import { LuckyRound } from '@betfinio/components/icons';
import { cn } from '@betfinio/components/lib';
import { BetValue } from '@betfinio/components/shared';
import { UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import { getCurrentRoundInfo } from '../lib/api';
import { useRoundBets, useVisibleRound } from '../lib/query';

export const RoundMyInfo = () => {
	const { data: round } = useVisibleRound();
	const { data: bets = [], isFetched } = useRoundBets(round);

	const roundInfo = useMemo(() => {
		return getCurrentRoundInfo(bets);
	}, [bets]);

	return (
		<div className={'bg-background-light max-h-[120px] border-border border py-[10px] px-[10px] rounded-xl sticky top-5 text-sm grow flex flex-col gap-2'}>
			<div className={'bg-background rounded-lg p-[10px] flex justify-between gap-1 items-center text-white font-semibold'}>
				<div className={'flex flex-row items-center gap-1 text-secondary-foreground'}>
					<LuckyRound className={'h-4 w-4 '} />
					<div className={cn('flex flex-row gap-1 items-center', { 'blur-xs animate-pulse': !isFetched })}>
						<BetValue value={roundInfo.volume} precision={2} withIcon />
					</div>
				</div>
				<div className={'flex flex-row items-center gap-1 text-secondary-foreground'}>
					<div className={cn('flex flex-row gap-1 items-center', { 'blur-xs animate-pulse': !isFetched })}>{roundInfo.usersCount}</div>
					<UserIcon className={'h-4 w-4'} />
				</div>
			</div>

			<div className={'bg-background rounded-lg p-[10px] flex justify-between gap-1 items-center font-semibold'}>
				<div className={'flex flex-row items-center gap-1 text-secondary-foreground'}>
					<BetValue value={roundInfo.betsCount} precision={0} />
					<span className={'text-muted-foreground text-xs'}>bets</span>
				</div>
			</div>
		</div>
	);
};
