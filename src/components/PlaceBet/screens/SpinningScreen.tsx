import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'motion/react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const SpinningScreen: FC<{ round: number }> = () => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'grow flex flex-col items-center min-h-[290px] sm:min-h-[390px] relative'}
		>
			<DotLottieReact
				src={'https://betfin-assets.s3.eu-central-1.amazonaws.com/lambo.lottie'}
				renderConfig={{ autoResize: true }}
				style={{ position: 'absolute', width: '100%', height: '295px', zIndex: 2, right: 0, bottom: 0, left: 0 }}
				autoplay={true}
				loop={true}
			/>
			<div className={'flex items-end pb-4 mt-10 lg:mt-20 gap-2'}>
				<span className={'leading-[12px]'}>{t('winnerIsBeingDecided')}</span>
				<div className="relative w-[3px] h-[3px] rounded-[5px] dot-flashing" />
			</div>
		</motion.div>
	);
};
