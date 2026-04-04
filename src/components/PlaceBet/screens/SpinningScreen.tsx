import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { type FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ASSETS_IPFS_BASE_URL } from '@/src/global';
import { getTimesByRound, jumpToCurrentRound, LURO_SHORT_ROUND_SECONDS_FALLBACK, useLuroAddress } from '@/src/lib';
import { useLuroGameIntervalSeconds, useLuroState, useRefundRound } from '@/src/lib/query';
import type { LuroInterval } from '@/src/lib/types';
import { Route } from '@/src/routes/games/luro/$interval.tsx';

const REFUND_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

export const SpinningScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });
	const queryClient = useQueryClient();
	const luroAddress = useLuroAddress();
	const { interval } = Route.useParams();
	const { data: intervalSeconds } = useLuroGameIntervalSeconds();
	const shortRoundSeconds = intervalSeconds ?? LURO_SHORT_ROUND_SECONDS_FALLBACK;
	const { mutate: refund, isPending: isRefunding } = useRefundRound(round);
	const { state: luroState } = useLuroState(round);

	// Determine when refund becomes available.
	// If we have a live spinRequestedAt from the event, use that.
	// Otherwise fall back to round end time (conservative: spin >= round end).
	const refundAvailableAt = useMemo(() => {
		const spinningState = luroState.data.state === 'spinning' ? luroState.data : null;
		if (spinningState?.spinRequestedAt) {
			return spinningState.spinRequestedAt + REFUND_TIMEOUT_MS;
		}
		const { end } = getTimesByRound(round, interval as LuroInterval, shortRoundSeconds);
		return end + REFUND_TIMEOUT_MS;
	}, [luroState.data, round, interval, shortRoundSeconds]);

	const now = Date.now();
	const refundAvailable = now >= refundAvailableAt;
	const hoursLeft = Math.ceil((refundAvailableAt - now) / (1000 * 60 * 60));

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'grow flex flex-col items-center min-h-[290px] sm:min-h-[390px] relative'}
		>
			<DotLottieReact
				src={`${ASSETS_IPFS_BASE_URL}/lambo.lottie`}
				renderConfig={{ autoResize: true }}
				style={{ position: 'absolute', width: '100%', height: '295px', zIndex: 2, right: 0, bottom: 0, left: 0 }}
				autoplay={true}
				loop={true}
			/>
			<div className={'flex flex-col items-center mt-10 lg:mt-20 gap-3 relative z-10'}>
				<div className={'flex items-end pb-1 gap-2'}>
					<span className={'leading-[12px]'}>{t('winnerIsBeingDecided')}</span>
					<div className="relative w-[3px] h-[3px] rounded-[5px] dot-flashing" />
				</div>
				<button
					type={'button'}
					onClick={() => refund()}
					disabled={!refundAvailable || isRefunding}
					title={refundAvailable ? undefined : t('refundAvailableIn', { hours: hoursLeft })}
					className={
						'text-xs text-red-400 underline hover:text-red-300 transition-colors disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed'
					}
				>
					{isRefunding ? t('refunding') : refundAvailable ? t('refundRound') : t('refundAvailableIn', { hours: hoursLeft })}
				</button>
				<button
					type={'button'}
					onClick={() => jumpToCurrentRound(queryClient, luroAddress)}
					className={'text-xs text-muted-foreground underline hover:text-white transition-colors'}
				>
					{t('backToGame')}
				</button>
			</div>
		</motion.div>
	);
};
