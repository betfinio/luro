import { SonnerToaster, TooltipProvider } from '@betfinio/components/ui';
import { createFileRoute, Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';
import { BetsInfo } from '@/src/components/BetsInfo.tsx';
import BonusClaimBlock from '@/src/components/BonusClaimBlock.tsx';
import { BonusInfo } from '@/src/components/BonusInfo.tsx';
import { CurrentRound } from '@/src/components/CurrentRound.tsx';
import { RoundInfo } from '@/src/components/RoundInfo.tsx';
import RoundModal from '@/src/components/RoundModal.tsx';
import { RoundMyInfo } from '@/src/components/RoundMyInfo.tsx';
import RoundsTable from '@/src/components/RoundsTable.tsx';
import { types } from '@/src/global';
import i18n from '@/src/i18n.ts';
import type { LuroInterval } from '@/src/lib/types.ts';

export const Route = createFileRoute('/games/luro/$interval')({
	validateSearch: (search: Record<string, unknown>) => {
		if (!search.round) return {};
		return { round: Number(search.round) || 0 };
	},
	component: LuroPage,
});

export function LuroPage() {
	const search = useSearch({ from: '/games/luro/$interval' });
	const { interval } = useParams({ from: '/games/luro/$interval' });
	const navigate = useNavigate();

	if (!types.includes(interval as LuroInterval)) {
		navigate({ to: '/games/luro/$interval', params: { interval: '5m' } });
	}

	const { t } = useTranslation('luro');
	return (
		<div className={'luro w-full h-full '}>
			<div className={'col-span-4 p-2 md:p-3 lg:p-4 lg:col-start-2 2xl:px-0'}>
				<TooltipProvider delayDuration={0}>
					<RoundInfo />
					<div className={'grid grid-cols-4 md:grid-cols-3 lg:grid-cols-[repeat(21,minmax(0,1fr))] xl:grid-cols-12 gap-4 md:pt-4 relative'}>
						<div className={'col-span-4 md:col-span-2 lg:col-[span_15_/_span_15] xl:col-span-8 flex flex-col justify-between'}>
							<CurrentRound />
							<BonusInfo />
							<BonusClaimBlock />
							<div className={'text-center my-2 justify-self-end'}>
								<Link to={'/staking/conservative'} className={'text-sm text-muted-foreground'}>
									<Trans
										t={t}
										i18nKey={'feeStaking'}
										i18n={i18n}
										components={{
											b: <b className={'text-secondary-foreground font-medium'} />,
										}}
									/>
								</Link>
							</div>
						</div>
						<div className={'col-span-4 md:col-span-2 lg:col-[span_6_/_span_6] xl:col-span-4 flex flex-col gap-4'}>
							<BetsInfo />
							<RoundMyInfo />
						</div>
						<RoundsTable className={'col-span-4 lg:col-[span_21_/_span_21] xl:col-span-12 mt-10'} />
						{search.round && <RoundModal round={search.round || 0} />}
					</div>
				</TooltipProvider>
			</div>
			<SonnerToaster />
		</div>
	);
}
