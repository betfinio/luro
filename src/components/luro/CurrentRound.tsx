import { PlaceBet } from '@/src/components/luro/PlaceBet.tsx';
import { RoundCircle } from '@/src/components/luro/RoundCircle.tsx';
import { LURO, LURO_5MIN } from '@/src/global.ts';
import { useLuroState, useVisibleRound } from '@/src/lib/luro/query';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { LuckyRoundContract } from '@betfinio/abi';
import { useQueryClient } from '@tanstack/react-query';
import { useWatchContractEvent } from 'wagmi';

export const CurrentRound = () => {
	const { data: round } = useVisibleRound();
	const search = Route.useSearch();
	const observedRound = search?.round ? search.round : round;

	const { updateState } = useLuroState(round);
	const { interval } = Route.useParams();

	const address = interval === '1d' ? LURO : LURO_5MIN;
	const queryClient = useQueryClient();

	useWatchContractEvent({
		abi: LuckyRoundContract.abi,
		address: address,
		eventName: 'RequestedCalculation',
		poll: true,
		onLogs: (rolledLogs) => {
			console.log('ROLLED LOGS', rolledLogs, observedRound);
			// @ts-ignore
			if (Number(rolledLogs[0].args.round) === observedRound) {
				console.log('START SPINNING');
				updateState({ state: 'spinning' }, observedRound);
			}
		},
	});

	useWatchContractEvent({
		abi: LuckyRoundContract.abi,
		address: address,
		eventName: 'WinnerCalculated',
		onLogs: async (landedLogs) => {
			console.log('CALCULATED LOGS', landedLogs, observedRound);
			// @ts-ignore
			if (Number(landedLogs[0].args.round) === observedRound) {
				console.log('LANDED, STOP SPINNING');
				// @ts-ignore
				updateState({ state: 'landed', winnerOffset: Number(landedLogs[0].args.winnerOffset), bet: landedLogs[0].args.bet }, observedRound);
			}

			// @ts-ignore
			await queryClient.invalidateQueries({ queryKey: ['luro', address, 'round', Number(landedLogs[0].args.round)] });
		},
	});
	return (
		<div className={'flex flex-col my-2 justify-between gap-2 sm:flex-row sm:my-4 sm:gap-4 md:my-0 md:flex-col lg:flex-row'}>
			<RoundCircle round={round} />
			<PlaceBet />
		</div>
	);
};
