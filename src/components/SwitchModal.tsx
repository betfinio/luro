import type { LuroInterval } from '@/src/lib';
import { cn } from '@betfinio/components/lib';
import { DialogClose } from '@betfinio/components/ui';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { types } from '../global';

const SwitchModal: FC<{ selected: LuroInterval }> = ({ selected }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundInfo.interval' });

	return (
		<motion.div layoutId={'switcher'} className={'rounded-lg border-border border bg-background p-2 w-[300px] mx-auto text-foreground'}>
			{types.map((pair, index) => (
				<DialogClose asChild key={index}>
					<Link
						to={`/games/luro/${pair}`}
						className={cn(' flex flex-row items-center gap-2 p-4 py-2', pair === selected && 'border-border border bg-background-lighter rounded-lg')}
					>
						{t(pair)}
					</Link>
				</DialogClose>
			))}
		</motion.div>
	);
};
export default SwitchModal;
