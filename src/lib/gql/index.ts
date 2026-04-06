import type { ExecutionResult } from 'graphql/execution';
import type { Address } from 'viem';
import {
	execute,
	LuroRoundBetsDocument,
	type LuroRoundBetsQuery,
	LuroRoundsByPlayerDocument,
	LuroRoundsDocument,
	type LuroRoundsQuery,
	LuroWinnerDocument,
	type LuroWinnerQuery,
} from '@/.graphclient';
import logger from '@/src/config/logger.ts';
import type { LuroBet, Round, RoundStatusEnum, WinnerInfo } from '@/src/lib/types.ts';

/** Graph-node `Bytes` entities are stored lowercase; checksummed env addresses often miss matches. */
function subgraphBytesAddress(a: Address): Address {
	return a.toLowerCase() as Address;
}

const mapStatus = (status: string | number): RoundStatusEnum => {
	if (typeof status === 'number') return status as RoundStatusEnum;
	switch (status) {
		case 'open':
			return 1;
		case 'spinning':
			return 2;
		case 'result_ready':
			return 3;
		case 'settled':
			return 4;
		case 'cancelled':
			return 5;
		default:
			return 0;
	}
};

export const requestRounds = async (address: Address): Promise<Round[]> => {
	const queryAddress = subgraphBytesAddress(address);
	logger.start('fetching rounds by game', queryAddress);
	const data: ExecutionResult<LuroRoundsQuery> = await execute(LuroRoundsDocument, { address: queryAddress });
	logger.success('fetched rounds by game', data.data?.rounds.length);
	if (data.data) {
		return populateRounds(data.data);
	}
	return [];
};

export const requestPlayerRounds = async (address: Address, player: Address): Promise<Round[]> => {
	const queryAddress = subgraphBytesAddress(address);
	const queryPlayer = subgraphBytesAddress(player);
	logger.start('fetching rounds by game and player', queryAddress, queryPlayer);
	const data: ExecutionResult<LuroRoundsQuery> = await execute(LuroRoundsByPlayerDocument, {
		address: queryAddress,
		player: queryPlayer,
	});
	logger.success('fetching rounds by game and player', data.data?.rounds.length);
	if (data.data) {
		return populateRounds(data.data);
	}
	return [];
};

const populateRounds = (result: LuroRoundsQuery): Round[] => {
	return result.rounds.map((round: any) => ({
		round: Number(round.round),
		total: {
			volume: BigInt(round.betsAmount),
			bets: BigInt(round.betsCount),
		},
		status: mapStatus(round.status ?? 0) as RoundStatusEnum,
		address: round.address as Address,
		winnerAddress: round.winnerAddress as Address | undefined,
		winnerOffset: round.winnerOffset ? BigInt(round.winnerOffset) : undefined,
		winnerPayout: round.winnerPayout ? BigInt(round.winnerPayout) : undefined,
	}));
};

export const fetchRoundBetsGql = async (luro: Address, round: number): Promise<LuroBet[]> => {
	logger.start('[luro]', 'fetching round bets from subgraph', luro, round);
	const data: ExecutionResult<LuroRoundBetsQuery> = await execute(LuroRoundBetsDocument, {
		address: subgraphBytesAddress(luro),
		round: round,
	});
	logger.success('[luro]', 'fetched round bets from subgraph', data.data?.bets.length);
	if (!data.data) return [];
	return data.data.bets.map((bet) => ({
		player: bet.player as Address,
		amount: BigInt(bet.amount),
		address: bet.betAddress as Address,
	}));
};

export const fetchWinner = async (luro: Address, round: number): Promise<WinnerInfo | null> => {
	logger.start('[luro]', 'fetching winner by game and round', luro, round);
	const data: ExecutionResult<LuroWinnerQuery> = await execute(LuroWinnerDocument, {
		address: subgraphBytesAddress(luro),
		round: round,
	});
	const rows = data.data?.winnerCalculateds ?? [];
	logger.success('[luro]', 'fetching winners by game and round', rows.length);
	if (rows.length === 0) return null;
	// Prefer entry with payout > 0 (winner); subgraph may return multiple rows in edge cases.
	const withPayout = rows.find((r) => BigInt(r.payout ?? 0) > 0n);
	return populateWinner(withPayout ?? rows[0]);
};

function populateWinner(log: any): WinnerInfo {
	return {
		player: log.winner as Address,
		round: Number(log.round),
		bet: log.bet as Address,
		offset: Number(log.winnerOffset),
		tx: log.transactionHash as Address,
		payout: BigInt(log.payout ?? 0),
	};
}
