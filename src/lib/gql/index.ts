import {
	LuroRoundsByPlayerDocument,
	LuroRoundsDocument,
	type LuroRoundsQuery,
	LuroWinnerDocument,
	type LuroWinnerQuery,
	LuroWinnersDocument,
	type LuroWinnersQuery,
	type WinnerCalculated,
	execute,
} from '@/.graphclient';
import logger from '@/src/config/logger.ts';
import type { Round, WinnerInfo } from '@/src/lib/types.ts';
import { LuckyRoundABI } from '@betfinio/abi';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from 'betfinio_context/config';
import type { ExecutionResult } from 'graphql/execution';
import type { Address } from 'viem';

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

export const populateRounds = async (result: LuroRoundsQuery): Promise<Round[]> => {
	return await Promise.all(
		result.rounds.map(async (round: LuroRoundsQuery['rounds'][0]) => {
			const status = await readContract(wagmiConfig, {
				abi: LuckyRoundABI,
				address: round.address as Address,
				functionName: 'roundStatus',
				args: [round.round],
			});
			return {
				round: Number(round.round),
				total: {
					volume: BigInt(round.betsAmount),
					bets: BigInt(round.betsCount),
					bonus: (BigInt(round.betsAmount) * 5n) / 100n,
					staking: (BigInt(round.betsAmount) * 36n) / 1000n,
				},
				status: status,
				address: round.address,
				winnerAddress: round.winnerAddress,
				winnerOffset: round.winnerOffset ? BigInt(round.winnerOffset) : undefined,
			} as Round;
		}),
	);
};

export const fetchWinners = async (luro: Address): Promise<WinnerInfo[]> => {
	logger.start('[luro]', 'fetching winners by game', luro);
	const data: ExecutionResult<LuroWinnersQuery> = await execute(LuroWinnersDocument, { address: luro });
	logger.success('[luro]', 'fetching winners by game', data.data?.winnerCalculateds.length);
	if (data.data) {
		return data.data.winnerCalculateds.map(populateWinner);
	}
	return [];
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

function populateWinner(log: Pick<WinnerCalculated, 'winner' | 'winnerOffset' | 'transactionHash' | 'round' | 'bet'>): WinnerInfo {
	return {
		player: log.winner as Address,
		round: Number(log.round),
		bet: log.bet as Address,
		offset: Number(log.winnerOffset),
		tx: log.transactionHash as Address,
	} as WinnerInfo;
}
