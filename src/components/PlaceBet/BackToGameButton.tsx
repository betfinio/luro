import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLuroAddress } from '@/src/lib';
import { jumpToCurrentRound } from '@/src/lib/index';

export const BackToGameButton = () => {
	const queryClient = useQueryClient();
	const luroAddress = useLuroAddress();
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });
	return (
		<motion.button
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			onClick={() => {
				jumpToCurrentRound(queryClient, luroAddress);
			}}
			exit={{ opacity: 0 }}
			transition={{ duration: 1, delay: 2 }}
			className={'w-3/4 bg-primary py-3 text-black rounded-[10px]'}
		>
			{t('backToGame')}
		</motion.button>
	);
};
