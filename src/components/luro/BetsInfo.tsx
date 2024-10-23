import { BetsTabs } from '@/src/components/luro/BetsTabs.tsx';
import { BetsTab } from '@/src/components/luro/tabs/BetsTab.tsx';
import { BonusTab } from '@/src/components/luro/tabs/BonusTab.tsx';
import { PlayersTab } from '@/src/components/luro/tabs/PlayersTab.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

export const BetsInfo = () => {
	const [activeTab, setActiveTab] = useState(0);
	const handleTabClick = (index: number) => {
		setActiveTab(index);
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 0:
				return <PlayersTab />;
			case 1:
				return <BetsTab />;
			case 2:
				return <BonusTab />;
			default:
				return <div />;
		}
	};

	return (
		<div className={'flex flex-col h-full'}>
			<BetsTabs activeTab={activeTab} handleTabClick={handleTabClick} tabs={['Players', 'Bets', 'Bonus']} />
			<div className={'py-3 mt-3 min-h-[250px] overflow-y-auto rounded-xl bg-primaryLight grow flex flex-col gap-5 border border-gray-800'}>
				<div className={'grow flex flex-col h-full '}>
					<AnimatePresence mode={'wait'}>
						<motion.div className={'h-full'} key={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
							{renderTabContent()}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
};
