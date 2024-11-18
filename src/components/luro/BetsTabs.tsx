import { motion } from 'framer-motion';
import type { FC } from 'react';

interface ITabs {
	activeTab: number;
	handleTabClick: (id: number) => void;
}
export interface BetsTabsProps extends ITabs {
	tabs: string[];
}

export const BetsTabs: FC<BetsTabsProps> = ({ activeTab, handleTabClick, tabs }) => {
	return (
		<div className={'flex gap-2 justify-between'}>
			{tabs.map((tab, i) => (
				<div
					key={i}
					className={`py-2 grow px-4 bg-primary rounded-md relative ${activeTab === i ? 'text-black' : 'cursor-pointer'}`}
					onClick={() => handleTabClick(i)}
				>
					{activeTab === i && (
						<motion.div layoutId="bubble" className="absolute inset-0 rounded-md bg-yellow-400" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
					)}
					<div className={`text-xs font-semibold relative text-center transition-all transition-300 ${activeTab === i ? '!text-black' : 'text-gray-400'}`}>
						{tab}
					</div>
				</div>
			))}
		</div>
	);
};
