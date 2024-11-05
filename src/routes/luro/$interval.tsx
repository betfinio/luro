import { BetsInfo } from '@/src/components/luro/BetsInfo.tsx';
import BonusClaimBlock from '@/src/components/luro/BonusClaimBlock.tsx';
import { BonusInfo } from '@/src/components/luro/BonusInfo.tsx';
import { CurrentRound } from '@/src/components/luro/CurrentRound.tsx';
import { RoundInfo } from '@/src/components/luro/RoundInfo.tsx';
import RoundModal from '@/src/components/luro/RoundModal.tsx';
import { RoundMyInfo } from '@/src/components/luro/RoundMyInfo.tsx';
import RoundsTable from '@/src/components/luro/RoundsTable.tsx';
import i18n from '@/src/i18n.ts';
import { Link, createFileRoute } from '@tanstack/react-router';
import { getStakingUrl } from 'betfinio_app/lib';
import { TooltipProvider } from 'betfinio_app/tooltip';
import { Trans, useTranslation } from 'react-i18next';

export const Route = createFileRoute('/luro/$interval')({
	validateSearch: (search: Record<string, unknown>) => {
		if (!search.round) return {};
		return { round: Number(search.round) || 0 };
	},
	component: Luro,
});

function Luro() {
	const search = Route.useSearch();
	const { t } = useTranslation('luro');
	return (
		<div className={'col-span-4 p-2 md:p-3 lg:p-4  lg:col-start-2'}>
			<TooltipProvider delayDuration={0}>
				<RoundInfo />
				<div className={'grid grid-cols-4 md:grid-cols-3 lg:grid-cols-[repeat(21,minmax(0,_1fr))] xl:grid-cols-12 gap-4 md:pt-4 relative'}>
					<div className={'col-span-4 md:col-span-2 lg:col-[span_15_/_span_15] xl:col-span-8 flex flex-col justify-between'}>
						<CurrentRound />
						<div className={'text-center my-2 justify-self-end'}>
							<Link to={getStakingUrl('conservative')} className={'text-sm text-gray-400'}>
								<Trans t={t} i18nKey={'feeStaking'} i18n={i18n} components={{ b: <b className={'text-yellow-400 font-medium'} /> }} />
							</Link>
						</div>
						<BonusInfo />
						<BonusClaimBlock />
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
	);
}
