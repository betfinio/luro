import { defaultMulticall, valueToNumber, ZeroAddress } from '@betfinio/abi';
import { simulateContract, writeContract } from '@wagmi/core';
import { type Address, type Client, encodeAbiParameters, parseAbiParameters } from 'viem';
import { multicall, readContract } from 'viem/actions';
import type { Config } from 'wagmi';
import logger from '@/src/config/logger.ts';
import { CORE, PARTNER } from '@/src/global.ts';
import { BetABI } from '@/src/lib/abi/BetABI.ts';
import { CoreBetABI } from '@/src/lib/abi/CoreBetABI.ts';
import { PvPGameABI } from '@/src/lib/abi/PvPGameABI.ts';
import type { LuroBet, PlaceBetParams, PlayerRoundInfo, Round, RoundStatusEnum } from '@/src/lib/types.ts';
import { requestPlayerRounds, requestRounds } from '../gql';
import type { ICurrentRoundInfo } from '../query';

export async function placeBet({ round, amount, player, address }: PlaceBetParams, config: Config) {
	try {
		logger.log('placing a bet', amount, round);
		const data = encodeAbiParameters(parseAbiParameters('uint256 roundId'), [BigInt(round)]);
		const args = [player, player, address, BigInt(amount) * 10n ** 18n, data, PARTNER] as const;

		const { request } = await simulateContract(config, {
			abi: CoreBetABI,
			address: CORE,
			functionName: 'bet',
			args,
			account: player,
		});

		return await writeContract(config, request);
	} catch (e) {
		logger.error(e);
		throw e;
	}
}

export async function spinRound(luro: Address, round: number, config: Config) {
	logger.log('Spinning round', round);
	try {
		const { request } = await simulateContract(config, {
			abi: PvPGameABI,
			address: luro,
			functionName: 'spin',
			args: [BigInt(round)],
			account: config.getClient().account,
		});
		return await writeContract(config, request);
	} catch (e) {
		logger.error(e);
		throw e;
	}
}

export const fetchRoundBets = async (address: Address, roundId: number, config: Config) => {
	logger.log('fetching round bets', roundId);
	// Get round info which includes bets array
	const roundInfo = (await readContract(config.getClient(), {
		abi: PvPGameABI,
		address: address,
		functionName: 'getRound',
		args: [BigInt(roundId)],
	})) as [Address[], bigint, bigint, bigint, number];

	const betAddresses = roundInfo[0];
	if (betAddresses.length === 0) return [];

	// Fetch each bet's player and amount
	const prepared = betAddresses.flatMap((bet) => [
		{ abi: BetABI, address: bet, functionName: 'player' as const },
		{ abi: BetABI, address: bet, functionName: 'amount' as const },
	]);

	const result = await multicall(config.getClient(), {
		multicallAddress: defaultMulticall,
		contracts: prepared as any,
	});

	const bets: LuroBet[] = [];
	for (let i = 0; i < betAddresses.length; i++) {
		bets.push({
			player: (result[i * 2].result as Address) ?? ZeroAddress,
			amount: (result[i * 2 + 1].result as bigint) ?? 0n,
			address: betAddresses[i],
		});
	}
	return bets;
};

export const getCurrentRoundInfo = (iBets: LuroBet[]): ICurrentRoundInfo => {
	const usersSet = new Set();
	let volume = 0;
	const bets = iBets;
	for (const bet of bets) {
		usersSet.add(bet.player);
		volume += valueToNumber(bet.amount);
	}
	return {
		betsCount: bets.length,
		usersCount: usersSet.size,
		volume,
	};
};

export const fetchRounds = async (address: Address, _player: Address, config?: Client): Promise<Round[]> => {
	if (!config) return [];
	return await requestRounds(address);
};

export const fetchRoundsByPlayer = async (address: Address, player: Address, config?: Client): Promise<Round[]> => {
	if (!config) return [];
	return await requestPlayerRounds(address, player);
};

export const getRoundWinnerByOffset = (bets: LuroBet[], offset: bigint) => {
	if (!offset) return null;

	let tmp = 0;
	for (const bet of bets) {
		if (tmp + valueToNumber(bet.amount) > offset) return { ...bet, offset };
		tmp += valueToNumber(bet.amount);
	}
};

export const fetchPlayerRoundInfo = async (address: Address, player: Address, round: bigint, config: Config): Promise<PlayerRoundInfo> => {
	// No more roundPlayerVolume/roundPlayerBetsCount on contract — compute from bets
	const bets = await fetchRoundBets(address, Number(round), config);
	const playerBets = bets.filter((b) => b.player.toLowerCase() === player.toLowerCase());
	return {
		volume: playerBets.reduce((acc, b) => acc + b.amount, 0n),
		bets: playerBets.length,
	};
};

export const fetchRound = async (address: Address, round: bigint, config: Client): Promise<Round> => {
	const roundInfo = (await readContract(config, {
		abi: PvPGameABI,
		address: address,
		functionName: 'getRound',
		args: [round],
	})) as [Address[], bigint, bigint, bigint, number];

	const bets = roundInfo[0];
	const totalBank = roundInfo[1];
	const status = roundInfo[4] as RoundStatusEnum;

	return {
		round: Number(round),
		total: {
			volume: totalBank,
			bets: BigInt(bets.length),
		},
		status,
		address: ZeroAddress,
		winnerOffset: 0n,
	};
};
