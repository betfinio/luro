import type { LuroInterval } from '@/src/lib/luro';
import { Link } from '@tanstack/react-router';
import cx from 'clsx';
import { motion } from 'framer-motion';
import type { FC } from 'react';

const SwitchModal: FC<{ selected: LuroInterval }> = ({ selected }) => {
	const types = ['5m', '1d'];
	return (
		<motion.div layoutId={'switcher'} className={'rounded-lg border border-gray-800 bg-primary p-2 w-[300px] mx-auto text-white'}>
			{types.map((pair, index) => (
				<Link
					to={`/luro/${pair}`}
					key={index}
					className={cx(' flex flex-row items-center gap-2 p-4 py-2', pair === selected && 'border border-gray-800 bg-primaryLighter rounded-lg')}
				>
					{pair}
				</Link>
			))}
		</motion.div>
	);
};
export default SwitchModal;
