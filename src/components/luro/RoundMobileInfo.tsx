import { valueToNumber } from '@betfinio/abi';
import { Dialog, DialogContent, DialogTrigger } from 'betfinio_app/dialog';
import { motion } from 'framer-motion';
import { ChartBarIcon } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

const RoundMobileInfo: FC<{ bets: number; volume: bigint; staking: bigint }> = ({ bets, volume, staking }) => {
	return (
		<div className={'md:hidden'}>
			<Dialog>
				<DialogTrigger asChild>
					<motion.div className={'flex flex-col items-center justify-center cursor-pointer text-[#FFC800] hover:text-[#FFC800] lg:text-white duration-300'}>
						<ChartBarIcon className={'text-[#FFC800] w-6'} />
					</motion.div>
				</DialogTrigger>
				<DialogContent className={'games max-w-0 w-auto'}>
					<SwitchModal bets={bets} volume={volume} staking={staking} />
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default RoundMobileInfo;

const SwitchModal: FC<{ bets: number; volume: bigint; staking: bigint }> = ({ bets, volume, staking }) => {
	const { t } = useTranslation('luro', { keyprefix: 'statsModal' });

	return (
		<motion.div className={'rounded-lg border border-gray-800 bg-primary p-5 w-[350px] flex flex-col gap-5 text-white'}>
			<div className={'flex justify-between'}>
				<span className={'text-sm'}>{t('bets')}</span>
				<span className={'font-semibold'}>{bets}</span>
			</div>

			<div className={'flex justify-between'}>
				<span className={'text-sm'}>{t('volume')}</span>
				<span className={'font-semibold'}>{Math.floor(valueToNumber(volume)).toLocaleString()} BET</span>
			</div>
			<div className={'flex justify-between'}>
				<span className={'text-sm'}>{t('staking')}</span>
				<span className={'font-semibold'}>{Math.floor(valueToNumber(staking)).toLocaleString()} BET</span>
			</div>
		</motion.div>
	);
};
