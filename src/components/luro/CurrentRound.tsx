import { PlaceBet } from '@/src/components/luro/PlaceBet.tsx';
import { RoundCircle } from '@/src/components/luro/RoundCircle.tsx';
import { useVisibleRound } from '@/src/lib/luro/query';

export const CurrentRound = () => {
	const { data: round } = useVisibleRound();

	return (
		<div className={'flex flex-col my-4 md:my-0 lg:flex-row justify-between gap-4  '}>
			<RoundCircle round={round} />
			<PlaceBet />
		</div>
	);
};
