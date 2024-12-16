import logger from '@/src/config/logger.ts';
import { BETS_MEMORY, PARTNER } from '@/src/global.ts';
import type { BonusClaimParams, LuroBet, PlaceBetParams, Round, RoundStatusEnum } from '@/src/lib/types.ts';
import { BetsMemoryABI, LuckyRoundABI, LuckyRoundBetABI, PartnerABI, ZeroAddress, arrayFrom, defaultMulticall, valueToNumber } from '@betfinio/abi';
import { writeContract } from '@wagmi/core';
import { type Address, type Client, encodeAbiParameters, parseAbiParameters } from 'viem';
import { multicall, readContract } from 'viem/actions';
import type { Config } from 'wagmi';
import { requestPlayerRounds, requestRounds } from '../gql';
import type { ICurrentRoundInfo } from '../query';

export async function placeBet({ round, amount, player, address }: PlaceBetParams, config: Config) {
	try {
		logger.log('PLACING A BET', amount, round);
		const data = encodeAbiParameters(parseAbiParameters('address player, uint256 amount, uint256 round'), [player, BigInt(amount), BigInt(round)]);
		return await writeContract(config, {
			abi: PartnerABI,
			address: PARTNER,
			functionName: 'placeBet',
			args: [address, BigInt(amount) * 10n ** 18n, data],
		});
	} catch (e) {
		logger.log(e);
		throw e;
	}
}

export async function claimBonus({ player, address }: BonusClaimParams, config: Config) {
	try {
		return await writeContract(config, {
			abi: LuckyRoundABI,
			address: address,
			functionName: 'claimBonus',
			args: [player],
		});
	} catch (e) {
		logger.log(e);
		throw e;
	}
}

export const distributeBonus = async ({ round, address }: { round: number; address: Address }, config: Config) => {
	logger.log('distributing bonus', round);
	return await writeContract(config, {
		abi: LuckyRoundABI,
		address: address,
		functionName: 'distribute',
		args: [BigInt(round), 0n, 1000n],
	});
};

export const fetchBonusDistribution = async (address: Address, round: number, config: Config) => {
	logger.log('checking distribution', round);
	return (await readContract(config.getClient(), {
		abi: LuckyRoundABI,
		address: address,
		functionName: 'roundDistribution',
		args: [BigInt(round)],
	})) as boolean;
};

export const fetchAvailableBonus = async (luro: Address, address: Address, config: Config): Promise<bigint> => {
	logger.log('fetching bonus', address);
	return await readContract(config.getClient(), {
		abi: LuckyRoundABI,
		address: luro,
		functionName: 'claimableBonus',
		args: [address],
	});
};

export const fetchRoundBets = async (address: Address, roundId: number, config: Config) => {
	logger.log('fetching round bets', roundId);
	const count = await readContract(config.getClient(), {
		abi: LuckyRoundABI,
		address: address,
		functionName: 'getBetsCount',
		args: [BigInt(roundId)],
	});
	const prepared = arrayFrom(Number(count)).map((_, i) => ({
		abi: LuckyRoundABI,
		address: address,
		functionName: 'roundBets',
		args: [roundId, i],
	}));
	// @ts-ignore (type deep error?) todo
	const result = await multicall(config.getClient(), {
		multicallAddress: defaultMulticall,
		contracts: prepared,
	});
	return await Promise.all(result.map((e) => e.result as Address).map((bet) => fetchLuroBet(bet, config)));
};

export const fetchLuroBet = async (address: Address, config: Config): Promise<LuroBet> => {
	const betInfo = (await readContract(config.getClient(), {
		abi: LuckyRoundBetABI,
		address: address as Address,
		functionName: 'getBetInfo',
	})) as [string, string, bigint, bigint, bigint, bigint];
	return { player: betInfo[0], amount: betInfo[2], address } as LuroBet;
};

export async function startRound(luro: Address, round: number, config: Config) {
	logger.log('Starting a round');
	return await writeContract(config, {
		abi: LuckyRoundABI,
		address: luro,
		functionName: 'requestCalculation',
		args: [BigInt(round)],
	});
}

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

export const fetchRounds = async (address: Address, player: Address, onlyPlayers: boolean, config?: Client): Promise<Round[]> => {
	if (!config) return [];
	const activeRounds = await requestRounds(address);
	return await Promise.all(activeRounds.map((e) => fetchRound(address, BigInt(e.round), player, config)));
};

export const fetchRoundsByPlayer = async (address: Address, player: Address, config?: Client): Promise<Round[]> => {
	if (!config) return [];
	const activeRounds = await requestPlayerRounds(address, player);
	return await Promise.all(activeRounds.map((e) => fetchRound(address, BigInt(e.round), player, config)));
};
export const getRoundWinnerByOffset = (bets: LuroBet[], offset: bigint) => {
	if (!offset) return null;

	let tmp = 0;
	for (const bet of bets) {
		if (tmp + valueToNumber(bet.amount) > offset) return { ...bet, offset };
		tmp += valueToNumber(bet.amount);
	}
};

export const fetchRound = async (address: Address, round: bigint, player: Address, config: Client): Promise<Round> => {
	const data = await multicall(config, {
		multicallAddress: defaultMulticall,
		contracts: [
			{
				abi: LuckyRoundABI,
				address: address,
				functionName: 'roundBank',
				args: [round],
			},
			{
				abi: LuckyRoundABI,
				address: address,
				functionName: 'getBetsCount',
				args: [round],
			},
			{
				abi: LuckyRoundABI,
				address: address,
				functionName: 'roundPlayerVolume',
				args: [round, player],
			},
			{
				abi: LuckyRoundABI,
				address: address,
				functionName: 'roundPlayerBetsCount',
				args: [round, player],
			},
			{
				abi: LuckyRoundABI,
				address: address,
				functionName: 'roundStatus',
				args: [round],
			},
			{
				abi: LuckyRoundABI,
				address: address,
				functionName: 'roundWinners',
				args: [round],
			},
		],
	});

	const volume = data[0].result ?? 0n;
	const count = data[1].result ?? 0n;
	const playerVolume = data[2].result ?? 0n;
	const playerCount = data[3].result ?? 0n;
	const status = data[4].result as RoundStatusEnum;
	const bonus = (volume / 100n) * 5n;
	const winnerOffset = BigInt(data[5].result as bigint);

	return {
		round: Number(round),
		total: {
			volume: volume,
			bets: count,
			bonus: bonus,
			staking: (volume * 360n) / 10000n,
		},
		player: {
			volume: playerVolume,
			bets: playerCount,
			bonus: (playerVolume / 100n) * 5n,
		},
		status,
		address: ZeroAddress,
		winnerOffset,
	};
};

export const fetchBetsCount = async (address: Address, config: Config): Promise<number> => {
	logger.info('fetching total bets number');
	return Number(
		await readContract(config.getClient(), {
			abi: BetsMemoryABI,
			address: BETS_MEMORY,
			functionName: 'getGamesBetsCount',
			args: [address],
		}),
	);
};

export const fetchTotalVolume = async (address: Address, config: Config): Promise<bigint> => {
	logger.log('fetching total volume of luro');
	return await readContract(config.getClient(), {
		abi: BetsMemoryABI,
		address: BETS_MEMORY,
		functionName: 'gamesVolume',
		args: [address],
	});
};

export const calculateRound = async (address: Address, round: number, config: Config) => {
	logger.start('[luro]', 'calculating', address, round);
	return writeContract(config, {
		abi: LuckyRoundABI,
		address: address,
		functionName: 'requestCalculation',
		args: [BigInt(round)],
	});
};
