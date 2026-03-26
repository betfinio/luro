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

const mapStatus = (status: string | number): RoundStatusEnum => {
	if (typeof status === 'number') return status as RoundStatusEnum;
	switch (status) {
		case 'open':
			return 1;
		case 'spinning':
			return 2;
		case 'settled':
			return 4;
		case 'cancelled':
			return 5;
		default:
			return 0;
	}
};

export const requestRounds = async (address: Address): Promise<Round[]> => {
	logger.start('fetching rounds by game', address);
	const data: ExecutionResult<LuroRoundsQuery> = await execute(LuroRoundsDocument, { address });
	logger.success('fetched rounds by game', data.data?.rounds.length);
	if (data.data) {
		return populateRounds(data.data);
	}
	return [];
};

export const requestPlayerRounds = async (address: Address, player: Address): Promise<Round[]> => {
	logger.start('fetching rounds by game and player', address, player);
	const data: ExecutionResult<LuroRoundsQuery> = await execute(LuroRoundsByPlayerDocument, { address, player });
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
	const data: ExecutionResult<LuroRoundBetsQuery> = await execute(LuroRoundBetsDocument, { address: luro, round: round });
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
	const data: ExecutionResult<LuroWinnerQuery> = await execute(LuroWinnerDocument, { address: luro, round: round });
	logger.success('[luro]', 'fetching winners by game and round', data.data?.winnerCalculateds.length);
	if (data.data && data.data.winnerCalculateds.length === 1) {
		return populateWinner(data.data.winnerCalculateds[0]);
	}
	return null;
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
