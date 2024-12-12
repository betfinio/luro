import { PlaceBet } from '@/src/components/luro/PlaceBet.tsx';
import { RoundCircle } from '@/src/components/luro/RoundCircle.tsx';
import logger from '@/src/config/logger';
import { useLuroAddress } from '@/src/lib';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { LuckyRoundContract } from '@betfinio/abi';
import { useQueryClient } from '@tanstack/react-query';
import { useWatchContractEvent } from 'wagmi';
import { useLuroState, useVisibleRound } from '../../lib/query';

export const CurrentRound = () => {
	const { data: round } = useVisibleRound();
	const search = Route.useSearch();
	const observedRound = search?.round ? search.round : round;

	const { updateState } = useLuroState(round);

	const luroAddress = useLuroAddress();

	const queryClient = useQueryClient();

	useWatchContractEvent({
		abi: LuckyRoundContract.abi,
		address: luroAddress,
		eventName: 'RequestedCalculation',
		poll: true,
		onLogs: (rolledLogs) => {
			logger.log('ROLLED LOGS', rolledLogs, observedRound);
			// @ts-ignore
			if (Number(rolledLogs[0].args.round) === observedRound) {
				logger.log('START SPINNING');
				updateState({ state: 'spinning' }, observedRound);
			}
		},
	});

	useWatchContractEvent({
		abi: LuckyRoundContract.abi,
		address: luroAddress,
		eventName: 'WinnerCalculated',
		onLogs: async (landedLogs) => {
			logger.log('CALCULATED LOGS', landedLogs, observedRound);
			// @ts-ignore
			if (Number(landedLogs[0].args.round) === observedRound) {
				logger.log('LANDED, STOP SPINNING');
				// @ts-ignore
				updateState({ state: 'landed', winnerOffset: Number(landedLogs[0].args.winnerOffset), bet: landedLogs[0].args.bet }, observedRound);
			}

			// @ts-ignore
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round', Number(landedLogs[0].args.round)] });
		},
	});
	return (
		<div className={'flex flex-col my-2 justify-between gap-2 sm:flex-row sm:my-4 sm:gap-4 md:my-0 md:flex-col lg:flex-row'}>
			<RoundCircle round={round} />
			<PlaceBet />
		</div>
	);
};
