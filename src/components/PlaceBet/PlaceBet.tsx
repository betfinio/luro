import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { getTimesByRound, jumpToCurrentRound, LURO_SHORT_ROUND_SECONDS_FALLBACK, useLuroAddress } from '@/src/lib';
import { Route } from '@/src/routes/games/luro/$interval.tsx';
import { useLuroGameIntervalSeconds, useLuroState, useRound, useRoundBets, useRoundBetsGql, useVisibleRound } from '../../lib/query';
import type { LuroInterval } from '../../lib/types';
import { RoundStatusEnum } from '../../lib/types';
import { RoundResultScreen } from './screens/RoundResultScreen';
import { SpinningScreen } from './screens/SpinningScreen';
import { StandByScreen } from './screens/StandByScreen';
import { WaitingScreen } from './screens/WaitingScreen';

export const PlaceBet = () => {
	const { data: round } = useVisibleRound();
	const { interval } = Route.useParams();
	const { data: intervalSeconds } = useLuroGameIntervalSeconds();
	const shortRoundSeconds = intervalSeconds ?? LURO_SHORT_ROUND_SECONDS_FALLBACK;
	const queryClient = useQueryClient();
	const luroAddress = useLuroAddress();

	const { state: luroState } = useLuroState(round);
	const { data: roundData } = useRound(round);
	const { data: bets = [] } = useRoundBets(round);
	const { data: betsGql = [] } = useRoundBetsGql(round);

	useEffect(() => {
		const wheel = luroState.data.state;
		if (wheel !== 'standby' && wheel !== 'waiting') return;

		const { end } = getTimesByRound(round, interval as LuroInterval, shortRoundSeconds);
		if (Date.now() <= end) return;

		const hasBets = bets.length > 0 || betsGql.length > 0;
		if (hasBets) return;

		jumpToCurrentRound(queryClient, luroAddress, {
			endedRound: round,
			interval: interval as LuroInterval,
			shortRoundSeconds,
		});
	}, [bets.length, betsGql.length, interval, luroAddress, luroState.data.state, queryClient, round, shortRoundSeconds]);

	const renderScreen = () => {
		const wheelStateValue = luroState.data.state;

		if (wheelStateValue === 'standby') {
			const { end } = getTimesByRound(round, interval as LuroInterval, shortRoundSeconds);
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
				return <SpinningScreen round={round} />;
			case 'landed':
				return <WaitingScreen round={round} />;
			case 'stopped':
				if (roundData?.status === RoundStatusEnum.ResultReady) {
					return <WaitingScreen round={round} />;
				}
				return <RoundResultScreen round={round} />;
			default:
				return <StandByScreen round={round} />;
		}
	};

	return <AnimatePresence>{renderScreen()}</AnimatePresence>;
};
