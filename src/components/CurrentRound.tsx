import { ZeroAddress } from '@betfinio/abi';
import { useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { readContract } from '@wagmi/core';
import { useConfig, useWatchContractEvent } from 'wagmi';
import { PlaceBet } from '@/src/components/PlaceBet/PlaceBet';
import { RoundCircle } from '@/src/components/RoundCircle.tsx';
import logger from '@/src/config/logger.ts';
import { useLuroAddress, useLuroStrategyAddress } from '@/src/lib';
import { LuckyRoundStrategyABI } from '@/src/lib/abi/LuckyRoundStrategyABI.ts';
import { PvPGameABI } from '@/src/lib/abi/PvPGameABI.ts';
import { fetchRoundBets, findLuroBetAtStrategyOffset, luroVrfWinnerOffset } from '@/src/lib/api';
import type { WheelState } from '@/src/lib/types.ts';
import { useLuroState, useVisibleRound } from '../lib/query';

export const CurrentRound = () => {
	const { data: round } = useVisibleRound();
	const search = useSearch({ from: '/games/luro/$interval' });
	const observedRound = search?.round ? search.round : round;

	const { updateState } = useLuroState(round);

	const luroAddress = useLuroAddress();
	const strategyAddress = useLuroStrategyAddress();
	const config = useConfig();
	const queryClient = useQueryClient();

	const stateQueryKey = ['luro', luroAddress, 'state', observedRound] as const;

	useWatchContractEvent({
		abi: PvPGameABI,
		address: luroAddress,
		eventName: 'RandomnessRequested',
		poll: true,
		onLogs: (rolledLogs) => {
			logger.log('ROLLED LOGS', rolledLogs, observedRound);
			// contextId is roundId for PvPGame
			if (Number(rolledLogs[0].args.contextId) === observedRound) {
				logger.log('START SPINNING');
				updateState({ state: 'spinning', spinRequestedAt: Date.now() }, observedRound);
			}
		},
	});

	// VRF returned — same winner offset as `LuckyRoundStrategy.resolveRound` will use at settle.
	// Drive wheel landing now; user still calls `resolveRound` to complete payouts (see PlaceBet).
	useWatchContractEvent({
		abi: PvPGameABI,
		address: luroAddress,
		eventName: 'RandomnessFulfilled',
		poll: true,
		onLogs: async (logs) => {
			for (const log of logs) {
				if (Number(log?.args?.contextId) !== observedRound) continue;
				const randomWord = log.args?.randomWord;
				if (randomWord === undefined) continue;

				const prev = queryClient.getQueryData<WheelState>(stateQueryKey);
				if (prev?.state === 'landed' || prev?.state === 'stopped') continue;

				const lastOffset = (await readContract(config, {
					abi: LuckyRoundStrategyABI,
					address: strategyAddress,
					functionName: 'lastOffset',
					args: [BigInt(observedRound)],
				})) as bigint;

				const winnerOffsetWei = luroVrfWinnerOffset(randomWord, lastOffset);
				if (winnerOffsetWei === 0n) {
					logger.warn('RANDOMNESS FULFILLED but lastOffset is zero', observedRound);
					updateState({ state: 'waiting' }, observedRound);
					await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round', observedRound] });
					continue;
				}

				const bets = await queryClient.fetchQuery({
					queryKey: ['luro', luroAddress, 'bets', 'round', observedRound],
					queryFn: () => fetchRoundBets(luroAddress, observedRound, config),
				});
				const winningBet = findLuroBetAtStrategyOffset(bets, winnerOffsetWei)?.address ?? ZeroAddress;

				logger.log('RANDOMNESS FULFILLED, wheel landing', observedRound, Number(winnerOffsetWei));
				updateState(
					{
						state: 'landed',
						round: observedRound,
						winnerOffset: Number(winnerOffsetWei),
						bet: winningBet,
					},
					observedRound,
				);
				await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round', observedRound] });
			}
		},
	});

	useWatchContractEvent({
		abi: PvPGameABI,
		address: luroAddress,
		eventName: 'BetResolved',
		onLogs: async (landedLogs) => {
			logger.log('RESOLVED LOGS', landedLogs, observedRound);
			const existing = queryClient.getQueryData<WheelState>(stateQueryKey);
			if (existing?.state === 'landed' || existing?.state === 'stopped') return;

			// Filter by roundId and find the winner (payout > 0)
			const winnerLog = landedLogs.find((log) => Number(log.args.roundId) === observedRound && (log.args.payout ?? 0n) > 0n);
			if (winnerLog) {
				const winnerOffset = Number(winnerLog.args.result ?? 0);
				logger.log('LANDED, STOP SPINNING');
				updateState({ state: 'landed', round: observedRound, winnerOffset, bet: (winnerLog.args.bet as string) || ZeroAddress }, observedRound);
				await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round'] });
				await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'winners'] });
			}
		},
	});

	return (
		<div className={'flex flex-col my-2 justify-between gap-2 sm:flex-row sm:my-4 sm:gap-4 md:my-0 md:flex-col lg:flex-row'}>
			<RoundCircle round={round} />
			<PlaceBet />
		</div>
	);
};
