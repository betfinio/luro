import { useLuroState, useVisibleRound } from '../../lib/query';

import { AnimatePresence } from 'framer-motion';
import { RoundResultScreen } from './screens/RoundResultScreen';
import { SpinningScreen } from './screens/SpinningScreen';
import { StandByScreen } from './screens/StandByScreen';
import { WaitingScreen } from './screens/WaitingScreen';
export const PlaceBet = () => {
	const { data: round } = useVisibleRound();

	const { state: luroState } = useLuroState(round);

	const renderScreen = () => {
		switch (luroState.data.state) {
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
