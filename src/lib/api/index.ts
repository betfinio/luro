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
import { type LuroBet, type PlaceBetParams, type PlayerRoundInfo, type Round, RoundStatusEnum, type WinnerInfo } from '@/src/lib/types.ts';
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

export async function resolveRound(luro: Address, round: number, config: Config) {
	logger.log('Resolving round', round);
	try {
		const { request } = await simulateContract(config, {
			abi: PvPGameABI,
			address: luro,
			functionName: 'resolveRound',
			args: [BigInt(round)],
			account: config.getClient().account,
		});
		return await writeContract(config, request);
	} catch (e) {
		logger.error(e);
		throw e;
	}
}

export async function refundRound(luro: Address, round: number, config: Config) {
	logger.log('Refunding round', round);
	try {
		const { request } = await simulateContract(config, {
			abi: PvPGameABI,
			address: luro,
			functionName: 'refundRound',
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

const CHAIN_ROUNDS_WINDOW = 400;
const CHAIN_MULTICALL_CHUNK = 64;

type RawRound = {
	rid: bigint;
	betAddresses: Address[];
	totalBank: bigint;
	status: RoundStatusEnum;
};

/** When the subgraph has no rows (wrong URL, lag, or filter mismatch), build history from `getRound` multicalls. */
async function fetchRoundsFromChain(luro: Address, client: Client): Promise<Round[]> {
	const currentRaw = await readContract(client, {
		abi: PvPGameABI,
		address: luro,
		functionName: 'getCurrentRoundId',
	});
	const current = currentRaw as bigint;
	const rawRounds: RawRound[] = [];

	for (let base = 0; base < CHAIN_ROUNDS_WINDOW; base += CHAIN_MULTICALL_CHUNK) {
		const chunkSize = Math.min(CHAIN_MULTICALL_CHUNK, CHAIN_ROUNDS_WINDOW - base);
		const contracts: {
			abi: typeof PvPGameABI;
			address: Address;
			functionName: 'getRound';
			args: readonly [bigint];
		}[] = [];

		for (let i = 0; i < chunkSize; i++) {
			const rid = current - BigInt(base + i);
			if (rid < 0n) break;
			contracts.push({
				abi: PvPGameABI,
				address: luro,
				functionName: 'getRound',
				args: [rid],
			});
		}
		if (contracts.length === 0) break;

		const results = await multicall(client, {
			multicallAddress: defaultMulticall,
			contracts,
		});

		for (let i = 0; i < results.length; i++) {
			const res = results[i];
			if (res.status !== 'success') continue;
			const tuple = res.result as [Address[], bigint, bigint, bigint, number];
			const betAddresses = tuple[0];
			const totalBank = tuple[1];
			const status = tuple[4] as RoundStatusEnum;
			if (status === RoundStatusEnum.None && betAddresses.length === 0) continue;
			const rid = current - BigInt(base + i);
			rawRounds.push({ rid, betAddresses, totalBank, status });
		}
	}

	// For settled rounds, resolve winner address by checking payout() on each bet
	const winnerByRound = new Map<string, Address>();
	const settledWithBets = rawRounds.filter((r) => r.status === RoundStatusEnum.Settled && r.betAddresses.length > 0);

	if (settledWithBets.length > 0) {
		const payoutContracts = settledWithBets.flatMap((r) => r.betAddresses.map((bet) => ({ abi: BetABI, address: bet, functionName: 'payout' as const })));
		const payoutResults = await multicall(client, {
			multicallAddress: defaultMulticall,
			contracts: payoutContracts as any,
		});

		const winningBets: { rid: bigint; bet: Address }[] = [];
		let idx = 0;
		for (const r of settledWithBets) {
			let winnerBet: Address | undefined;
			for (const bet of r.betAddresses) {
				const pr = payoutResults[idx++];
				if (pr.status === 'success' && (pr.result as bigint) > 0n) {
					winnerBet = bet;
				}
			}
			if (winnerBet) winningBets.push({ rid: r.rid, bet: winnerBet });
		}

		if (winningBets.length > 0) {
			const playerContracts = winningBets.map((w) => ({
				abi: BetABI,
				address: w.bet,
				functionName: 'player' as const,
			}));
			const playerResults = await multicall(client, {
				multicallAddress: defaultMulticall,
				contracts: playerContracts as any,
			});

			for (let i = 0; i < winningBets.length; i++) {
				const pr = playerResults[i];
				if (pr.status === 'success') {
					winnerByRound.set(winningBets[i].rid.toString(), pr.result as Address);
				}
			}
		}
	}

	return rawRounds.map((r) => ({
		round: Number(r.rid),
		total: { volume: r.totalBank, bets: BigInt(r.betAddresses.length) },
		status: r.status,
		address: luro,
		winnerAddress: winnerByRound.get(r.rid.toString()),
		winnerOffset: 0n,
	}));
}

export const fetchRounds = async (address: Address, _player: Address, config?: Config): Promise<Round[]> => {
	if (!config) return [];
	const client = config.getClient();
	const fromGraph = await requestRounds(address);
	if (fromGraph.length > 0) return fromGraph;
	return fetchRoundsFromChain(address, client);
};

export const fetchRoundsByPlayer = async (address: Address, player: Address, config?: Config): Promise<Round[]> => {
	if (!config) return [];
	const client = config.getClient();
	const fromGraph = await requestPlayerRounds(address, player);
	if (fromGraph.length > 0) return fromGraph;
	if (player === ZeroAddress) return [];
	const candidates = await fetchRoundsFromChain(address, client);
	const filtered: Round[] = [];
	for (const r of candidates) {
		const info = await fetchPlayerRoundInfo(address, player, BigInt(r.round), config);
		if (info.bets > 0) filtered.push(r);
	}
	return filtered;
};

export const getRoundWinnerByOffset = (bets: LuroBet[], offset: bigint) => {
	if (!offset) return null;

	let tmp = 0;
	for (const bet of bets) {
		if (tmp + valueToNumber(bet.amount) > offset) return { ...bet, offset };
		tmp += valueToNumber(bet.amount);
	}
};

/** Same as `LuckyRoundStrategy.resolveRound`: `(randomWords[0] % lastOffset) + 1` */
export function luroVrfWinnerOffset(randomWord: bigint, lastOffset: bigint): bigint {
	if (lastOffset <= 0n) return 0n;
	return (randomWord % lastOffset) + 1n;
}

/** Strategy assigns contiguous offset ranges per bet in wei; returns the winning bet or undefined */
export function findLuroBetAtStrategyOffset(bets: LuroBet[], winnerOffset: bigint): LuroBet | undefined {
	if (winnerOffset <= 0n || bets.length === 0) return undefined;
	let cumulative = 0n;
	for (const bet of bets) {
		const start = cumulative + 1n;
		const end = cumulative + bet.amount;
		if (winnerOffset >= start && winnerOffset <= end) return bet;
		cumulative = end;
	}
	return undefined;
}

export const fetchPlayerRoundInfo = async (address: Address, player: Address, round: bigint, config: Config): Promise<PlayerRoundInfo> => {
	// No more roundPlayerVolume/roundPlayerBetsCount on contract — compute from bets
	const bets = await fetchRoundBets(address, Number(round), config);
	const playerBets = bets.filter((b) => b.player.toLowerCase() === player.toLowerCase());
	return {
		volume: playerBets.reduce((acc, b) => acc + b.amount, 0n),
		bets: playerBets.length,
	};
};

export const fetchWinnerFromChain = async (address: Address, roundId: number, config: Config): Promise<WinnerInfo | null> => {
	const roundInfo = (await readContract(config.getClient(), {
		abi: PvPGameABI,
		address,
		functionName: 'getRound',
		args: [BigInt(roundId)],
	})) as [Address[], bigint, bigint, bigint, number];

	const betAddresses = roundInfo[0];
	const status = roundInfo[4] as RoundStatusEnum;

	if (status !== RoundStatusEnum.Settled || betAddresses.length === 0) return null;

	const payoutContracts = betAddresses.map((bet) => ({ abi: BetABI, address: bet, functionName: 'payout' as const }));
	const payoutResults = await multicall(config.getClient(), {
		multicallAddress: defaultMulticall,
		contracts: payoutContracts as any,
	});

	let winnerBet: Address | undefined;
	let winnerPayout = 0n;
	for (let i = 0; i < betAddresses.length; i++) {
		const pr = payoutResults[i];
		if (pr.status === 'success' && (pr.result as bigint) > 0n) {
			winnerBet = betAddresses[i];
			winnerPayout = pr.result as bigint;
			break;
		}
	}
	if (!winnerBet) return null;

	const infoResults = await multicall(config.getClient(), {
		multicallAddress: defaultMulticall,
		contracts: [
			{ abi: BetABI, address: winnerBet, functionName: 'player' as const },
			{ abi: BetABI, address: winnerBet, functionName: 'result' as const },
		] as any,
	});

	return {
		player: (infoResults[0]?.result as Address) ?? ZeroAddress,
		round: roundId,
		bet: winnerBet,
		offset: Number(infoResults[1]?.result ?? 0n),
		tx: ZeroAddress as Address,
		payout: winnerPayout,
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
