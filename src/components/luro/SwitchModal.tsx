import type { LuroInterval } from '@/src/lib';
import { cn } from '@betfinio/components/lib';
import { DialogClose } from '@betfinio/components/ui';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import type { FC } from 'react';

const SwitchModal: FC<{ selected: LuroInterval }> = ({ selected }) => {
	const types = ['5m', '1d'];
	return (
		<motion.div layoutId={'switcher'} className={'rounded-lg border-border border bg-background p-2 w-[300px] mx-auto text-white'}>
			{types.map((pair, index) => (
				<DialogClose asChild key={index}>
					<Link
						to={`/luro/${pair}`}
						className={cn(' flex flex-row items-center gap-2 p-4 py-2', pair === selected && 'border-border border bg-background-lighter rounded-lg')}
					>
						{pair}
					</Link>
				</DialogClose>
			))}
		</motion.div>
	);
};
export default SwitchModal;
