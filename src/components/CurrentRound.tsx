import { ZeroAddress } from '@betfinio/abi';
import { useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useWatchContractEvent } from 'wagmi';
import { PlaceBet } from '@/src/components/PlaceBet/PlaceBet';
import { RoundCircle } from '@/src/components/RoundCircle.tsx';
import logger from '@/src/config/logger.ts';
import { useLuroAddress } from '@/src/lib';
import { PvPGameABI } from '@/src/lib/abi/PvPGameABI.ts';
import { useLuroState, useVisibleRound } from '../lib/query';

export const CurrentRound = () => {
	const { data: round } = useVisibleRound();
	const search = useSearch({ from: '/games/luro/$interval' });
	const observedRound = search?.round ? search.round : round;

	const { updateState } = useLuroState(round);

	const luroAddress = useLuroAddress();

	const queryClient = useQueryClient();

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
				updateState({ state: 'spinning' }, observedRound);
			}
		},
	});

	useWatchContractEvent({
		abi: PvPGameABI,
		address: luroAddress,
		eventName: 'BetResolved',
		onLogs: async (landedLogs) => {
			logger.log('RESOLVED LOGS', landedLogs, observedRound);
			// Find the winner (payout > 0)
			const winnerLog = landedLogs.find((log) => (log.args.payout ?? 0n) > 0n);
			if (winnerLog) {
				// Get roundId from the bet — we can infer from result (winnerOffset)
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
