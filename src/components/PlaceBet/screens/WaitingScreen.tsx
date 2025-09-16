import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'motion/react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoundRequested, useStartRound } from '@/src/lib/query';

export const WaitingScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	const { mutate: startRound, isPending } = useStartRound(round);
	const { data: isRoundRequested } = useRoundRequested(round);

	const handleSpin = () => {
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
				src={'https://betfin-assets.s3.eu-central-1.amazonaws.com/throw.lottie'}
				autoplay={true}
				loop={true}
				renderConfig={{ autoResize: true }}
				style={{ position: 'absolute', width: '100%', height: '295px', zIndex: 2, right: 0, bottom: 0, left: 0 }}
			/>
			<div className={'flex flex-col justify-center items-center relative z-10 p-5 bg-background bg-opacity-75 mt-10'}>
				<div className={'flex items-end pb-4 gap-2'}>
					<span className={'leading-[12px]'}>{t('waiting')}</span>
					<div className="relative w-[3px] h-[3px] rounded-[5px] dot-flashing" />
				</div>
				{!isRoundRequested && (
					<button
						type={'button'}
						onClick={handleSpin}
						disabled={isPending}
						className={'bg-primary disabled:bg-gray-500 rounded-lg px-6 py-2 text-black font-medium'}
					>
						{isPending ? t('spinning') : t('spinTheWheel')}
					</button>
				)}
			</div>
		</motion.div>
	);
};
