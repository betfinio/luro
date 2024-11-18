import RoundMobileInfo from '@/src/components/luro/RoundMobileInfo.tsx';
import SwitchModal from '@/src/components/luro/SwitchModal.tsx';
import type { LuroInterval } from '@/src/lib';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { valueToNumber } from '@betfinio/abi';
import { LuckyRound } from '@betfinio/ui/dist/icons/LuckyRound';
import { BetValue } from 'betfinio_app/BetValue';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from 'betfinio_app/dialog';
import cx from 'clsx';
import { motion } from 'framer-motion';
import { CircleHelp, Menu } from 'lucide-react';
import { type FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBetsCount, useTotalVolume, useVisibleRound } from '../../lib/query';

const Stats: FC<{ betsCount: number; volume: bigint; staking: bigint; isFetched: boolean }> = ({ betsCount, volume, staking, isFetched }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundInfo.stats' });
	return (
		<div className={'hidden md:flex gap-4 sm:gap-5 items-center justify-end grow text-xs'}>
			<div className={'flex flex-col'}>
				<span>{t('totalBets')}</span>
				<div className={cx('font-semibold flex flex-row items-center gap-0 duration-300', !isFetched && 'animate-pulse blur-sm')}>{betsCount}</div>
			</div>
			<div className={'w-[1px] bg-white h-[36px] hidden md:block'} />

			<div className={'flex flex-col'}>
				<span>{t('totalVolume')}</span>
				<div className={cx('font-semibold flex flex-row items-center gap-1 duration-300', !isFetched && 'animate-pulse blur-sm')}>
					<BetValue precision={1} value={valueToNumber(volume)} withIcon={true} iconClassName={'w-3 h-3'} />
				</div>
			</div>
			<div className={'w-[1px] bg-white h-[36px] hidden md:block'} />

			<div className={'flex flex-col'}>
				<span>{t('stakingRewards')}</span>
				<div className={cx('font-semibold flex flex-row items-center gap-1 duration-300', !isFetched && 'animate-pulse blur-sm')}>
					<BetValue precision={1} value={valueToNumber(staking)} withIcon={true} iconClassName={'w-3 h-3'} />
				</div>
			</div>
		</div>
	);
};

export const RoundInfo = () => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundInfo' });
	const { data: currentRound } = useVisibleRound();
	const { data: betsCount = 0, isFetched: isBetsFetched } = useBetsCount();
	const { data: volume = 0n, isFetched: isVolumeFetched } = useTotalVolume();
	const { interval } = Route.useParams();
	const staking = useMemo(() => {
		return (volume * 36n) / 1000n;
	}, [volume]);

	return (
		<div
			className={
				'px-3 py-2 bg-primaryLight border border-gray-800 rounded-lg max-h-[80px] flex gap-5 xl:gap-10 flex-row justify-between md:items-center relative md:px-5 md:py-6'
			}
		>
			<Dialog>
				<DialogTrigger asChild>
					<motion.div className={'flex gap-2 md:gap-4 items-center cursor-pointer'}>
						<Menu className={'w-8 md:w-10 aspect-square text-white'} />
						<LuckyRound className={'w-8 h-8 md:w-10 md:h-10 text-yellow-400'} />
						<div className={'flex flex-col'}>
							<span className={'md:text-lg leading-5 text-sm'}>{t('luro')}</span>
							<span className={'text-sm leading-5 text-gray-300'}>#{currentRound}</span>
						</div>
					</motion.div>
				</DialogTrigger>
				<DialogContent className={'w-fit luro'} aria-describedby={undefined}>
					<DialogTitle className={'hidden'} />
					<SwitchModal selected={interval as LuroInterval} />
				</DialogContent>
			</Dialog>

			<div className={'hidden sm:flex flex-row items-center justify-start md:justify-center gap-4'} />

			<Stats betsCount={betsCount} volume={volume} staking={staking} isFetched={isBetsFetched && isVolumeFetched} />

			<div className={'flex flex-row justify-between items-center gap-4 sm:gap-8 px-4 sm:px-0'}>
				<RoundMobileInfo bets={betsCount} volume={volume} staking={staking} />

				<a
					target={'_blank'}
					href={'https://betfin.gitbook.io/betfin-public/games-guide/lucky-round-luro'}
					className={'flex flex-col items-center justify-center cursor-pointer text-yellow-400 hover:text-yellow-400 lg:text-white duration-300'}
					rel="noreferrer"
				>
					<CircleHelp className={'cursor-pointer w-6 h-6'} />
					<span className={'hidden lg:inline text-xs whitespace-nowrap'}>{t('howToPlay')}</span>
				</a>
			</div>
		</div>
	);
};
