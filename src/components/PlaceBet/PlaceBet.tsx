import { AnimatePresence } from 'motion/react';
import { getTimesByRound } from '@/src/lib';
import { Route } from '@/src/routes/games/luro/$interval.tsx';
import { useLuroState, useRound, useRoundBets, useRoundBetsGql, useVisibleRound } from '../../lib/query';
import type { LuroInterval } from '../../lib/types';
import { RoundStatusEnum } from '../../lib/types';
import { RoundResultScreen } from './screens/RoundResultScreen';
import { SpinningScreen } from './screens/SpinningScreen';
import { StandByScreen } from './screens/StandByScreen';
import { WaitingScreen } from './screens/WaitingScreen';

export const PlaceBet = () => {
	const { data: round } = useVisibleRound();
	const { interval } = Route.useParams();

	const { state: luroState } = useLuroState(round);
	const { data: roundData } = useRound(round);
	const { data: bets = [] } = useRoundBets(round);
	const { data: betsGql = [] } = useRoundBetsGql(round);

	const renderScreen = () => {
		const wheelStateValue = luroState.data.state;

		if (wheelStateValue === 'standby') {
			const { end } = getTimesByRound(round, interval as LuroInterval);
			const roundEnded = Date.now() > end;
			const hasBets = bets.length > 0 || betsGql.length > 0;

			// Round ended with bets but timer side-effect hasn't fired yet (or page was refreshed)
			if (roundEnded && hasBets) {
				if (roundData?.status === RoundStatusEnum.SpinRequested) {
					return <SpinningScreen round={round} />;
				}
				return <WaitingScreen round={round} />;
			}
		}

		switch (wheelStateValue) {
			case 'waiting':
				return <WaitingScreen round={round} />;
			case 'spinning':
			case 'landed':
				return <SpinningScreen round={round} />;
			case 'stopped':
				return <RoundResultScreen round={round} />;
			default:
				return <StandByScreen round={round} />;
		}
	};

	return <AnimatePresence>{renderScreen()}</AnimatePresence>;
};
