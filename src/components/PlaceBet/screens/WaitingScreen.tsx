import { toast } from '@betfinio/components/ui';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { ASSETS_IPFS_BASE_URL } from '@/src/global';
import { jumpToCurrentRound, useLuroAddress } from '@/src/lib';
import { useLuroState, useResolveRound, useRound, useRoundRequested, useStartRound } from '@/src/lib/query';
import { RoundStatusEnum } from '@/src/lib/types';

export const WaitingScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	const { isConnected } = useAccount();
	const { mutate: startRound, isPending } = useStartRound(round);
	const { mutate: settle, isPending: isSettling } = useResolveRound(round);
	const { data: isRoundRequested } = useRoundRequested(round);
	const { data: roundData } = useRound(round);
	const { state: luroWheel } = useLuroState(round);
	const queryClient = useQueryClient();
	const luroAddress = useLuroAddress();

	const isResultReady = roundData?.status === RoundStatusEnum.ResultReady;
	const isSettled = roundData?.status === RoundStatusEnum.Settled;
	const showSettle = isResultReady || luroWheel.data.state === 'landed' || (luroWheel.data.state === 'stopped' && !isSettled);

	const handleSpin = () => {
		if (!isConnected) {
			toast.error(t('toast.connect'));
			return;
		}
		startRound();
	};
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'grow relative min-h-[390px] flex items-start justify-center'}
		>
			<DotLottieReact
				src={`${ASSETS_IPFS_BASE_URL}/throw.lottie`}
				autoplay={true}
				loop={true}
				renderConfig={{ autoResize: true }}
				style={{ position: 'absolute', width: '100%', height: '295px', right: 0, bottom: 0, left: 0 }}
			/>
			<div className={'flex flex-col justify-center items-center relative p-5 bg-background bg-opacity-75 mt-10'}>
				<div className={'flex items-end pb-4 gap-2'}>
					<span className={'leading-[12px] text-center max-w-[280px]'}>{showSettle ? t('settlementRequired') : t('waiting')}</span>
					{!showSettle ? <div className="relative w-[3px] h-[3px] rounded-[5px] dot-flashing" /> : null}
				</div>
				{showSettle ? (
					<div className={'flex flex-col items-center gap-2'}>
						{!isConnected ? <p className={'text-xs text-center text-muted-foreground max-w-[240px]'}>{t('toast.connect')}</p> : null}
						<button
							type={'button'}
							onClick={() => settle()}
							disabled={isSettling || !isConnected}
							className={'bg-primary disabled:bg-gray-500 rounded-lg px-6 py-2 text-black font-medium'}
						>
							{isSettling ? t('settling') : t('settleRound')}
						</button>
					</div>
				) : (
					!isRoundRequested && (
						<div className={'flex flex-col items-center gap-2'}>
							{!isConnected ? <p className={'text-xs text-center text-muted-foreground max-w-[240px]'}>{t('toast.connect')}</p> : null}
							<button
								type={'button'}
								onClick={handleSpin}
								disabled={isPending || !isConnected}
								className={'bg-primary disabled:bg-gray-500 rounded-lg px-6 py-2 text-black font-medium'}
							>
								{isPending ? t('spinning') : t('spinTheWheel')}
							</button>
						</div>
					)
				)}
				<button
					type={'button'}
					onClick={() => jumpToCurrentRound(queryClient, luroAddress)}
					className={'text-xs text-muted-foreground underline mt-2 hover:text-white transition-colors'}
				>
					{t('backToGame')}
				</button>
			</div>
		</motion.div>
	);
};
