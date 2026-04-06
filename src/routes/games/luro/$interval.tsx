import { SonnerToaster, TooltipProvider } from '@betfinio/components/ui';
import { createFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useLayoutEffect } from 'react';
import { BetsInfo } from '@/src/components/BetsInfo.tsx';
import { CurrentRound } from '@/src/components/CurrentRound.tsx';
import { FeeNotice } from '@/src/components/FeeNotice.tsx';
import { RoundInfo } from '@/src/components/RoundInfo.tsx';
import RoundModal from '@/src/components/RoundModal.tsx';
import { RoundMyInfo } from '@/src/components/RoundMyInfo.tsx';
import RoundsTable from '@/src/components/RoundsTable.tsx';
import { types } from '@/src/global';
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

	useLayoutEffect(() => {
		if (interval === '5m') {
			void navigate({ to: '/games/luro/$interval', params: { interval: '210s' }, search, replace: true });
			return;
		}
		if (!types.includes(interval as LuroInterval)) {
			void navigate({ to: '/games/luro/$interval', params: { interval: '210s' }, search, replace: true });
		}
	}, [interval, navigate, search]);

	if (interval === '5m' || !types.includes(interval as LuroInterval)) {
		return null;
	}

	return (
		<div className={'w-full h-full'}>
			<div className={'col-span-4 p-2 md:py-4 lg:col-start-2 2xl:px-0'}>
				<TooltipProvider delayDuration={0}>
					<RoundInfo />
					<div className={'grid grid-cols-4 md:grid-cols-3 lg:grid-cols-21 xl:grid-cols-12 gap-4 md:pt-4 relative'}>
						<div className={'col-span-4 md:col-span-2 lg:col-[span_15/span_15] xl:col-span-8 flex flex-col justify-between'}>
							<CurrentRound />
						</div>
						<div className={'col-span-4 md:col-span-2 lg:col-span-6 xl:col-span-4 flex flex-col gap-4'}>
							<BetsInfo />
							<RoundMyInfo />
						</div>
						<FeeNotice className={'col-span-4 lg:col-[span_21/span_21] xl:col-span-12'} />
						<RoundsTable className={'col-span-4 lg:col-[span_21/span_21] xl:col-span-12 mt-10'} />
						{search.round && <RoundModal round={search.round || 0} />}
					</div>
				</TooltipProvider>
			</div>
			<SonnerToaster />
		</div>
	);
}
