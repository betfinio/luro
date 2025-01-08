import type { Round } from '@/src/lib/types.ts';
import { Route } from '@/src/routes/games/luro/$interval.tsx';
import { ZeroAddress, truncateEthAddress, valueToNumber } from '@betfinio/abi';
import { cn } from '@betfinio/components/lib';
import { BetValue, DataTable } from '@betfinio/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@betfinio/components/ui';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { Expand } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { usePlayerRoundInfo, usePlayerRounds, useRounds } from '../../lib/query';

const RoundsTable: FC<{ className?: string }> = ({ className = '' }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'table' });

	const columns: ColumnDef<Round, never>[] = [
		columnHelper.accessor('round', {
			header: t('columns.round'),
			meta: { className: 'md:w-[120px]' },

			cell: (props) => {
				const { round } = props.row.original;
				const { data } = usePlayerRoundInfo(BigInt(props.row.original.round));

				return <div className={cn('text-muted-foreground md:w-[90px]', (data?.bets ?? 0) > 0 && 'text-secondary-foreground')}>#{round.toString()}</div>;
			},
		}),
		columnHelper.accessor('total.bets', {
			header: t('columns.bets'),
			meta: {
				className: 'hidden md:table-cell',
			},
			cell: (props) => <div className={''}>{valueToNumber(props.getValue(), 0)}</div>,
		}),
		columnHelper.accessor('total.volume', {
			header: t('columns.totalBets'),
			cell: (props) => (
				<div className={''}>
					<BetValue value={valueToNumber(props.getValue())} withIcon />
				</div>
			),
		}),
		columnHelper.accessor('total.bonus', {
			header: t('columns.totalBonuses'),
			meta: {
				className: 'hidden md:table-cell',
			},
			cell: (props) => (
				<div className={'text-secondary-foreground'}>
					<BetValue value={valueToNumber(props.getValue())} withIcon />
				</div>
			),
		}),
		columnHelper.accessor('winnerAddress', {
			header: t('columns.winner'),
			cell: (props) => <WinnerInfo winner={props.getValue()} />,
		}),
		columnHelper.accessor('total.staking', {
			meta: {
				className: 'md:w-[160px] hidden md:table-cell',
			},
			header: t('columns.stakingEarnings'),
			cell: (props) => (
				<div className={''}>
					<BetValue value={valueToNumber(props.getValue())} withIcon />
				</div>
			),
		}),
		columnHelper.display({
			meta: { className: 'w-10' },
			header: '',
			id: 'actions',
			cell: (props) => (
				<Link to={`./?round=${props.row.original.round}`} className={'w-full'} params={{}} search={{}}>
					<Expand className={'w-4 h-4 text-white'} />
				</Link>
			),
		}),
	];

	const myBetsColumn = columnHelper.display({
		id: 'playerVolume',
		header: t('columns.myBets'),
		cell: (props) => {
			const { data } = usePlayerRoundInfo(BigInt(props.row.original.round));
			return (
				<div className={''}>
					<BetValue value={data?.volume ?? 0n} withIcon />
				</div>
			);
		},
	});

	const getPlayerRoundsTableColumns = (columns: unknown[]) => {
		const newColumns = [...columns];
		newColumns.splice(2, 0, myBetsColumn);
		return newColumns;
	};

	return (
		<div className={cn('w-full overflow-x-auto min-h-[100px]', className)}>
			<Tabs defaultValue={'all'}>
				<TabsList>
					<TabsTrigger variant={'default'} value={'all'}>
						{t('tabs.all')}
					</TabsTrigger>
					<TabsTrigger variant={'default'} value={'my'}>
						{t('tabs.my')}
					</TabsTrigger>
				</TabsList>
				<TabsContent value={'all'}>
					<AllRoundsTable columns={columns} />
				</TabsContent>
				<TabsContent value={'my'}>
					<PlayerRoundsTable columns={getPlayerRoundsTableColumns(columns)} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default RoundsTable;

const columnHelper = createColumnHelper<Round>();

const AllRoundsTable: FC<{ columns: ColumnDef<Round, never>[] }> = ({ columns }) => {
	const { address = ZeroAddress } = useAccount();
	const { data: rounds = [], isLoading } = useRounds(address);
	const navigate = useNavigate();
	const { interval } = useParams({ from: '/games/luro/$interval' });

	const handleClick = async (row: Round) => {
		await navigate({ to: '/games/luro/$interval', params: { interval }, search: { round: row.round } });
	};
	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
			<DataTable data={rounds} columns={columns} onRowClick={handleClick} isLoading={isLoading} loaderClassName="h-[185px]" noResultsClassName="h-[185px]" />
		</motion.div>
	);
};

const PlayerRoundsTable: FC<{ columns: unknown }> = ({ columns }) => {
	const { address = ZeroAddress } = useAccount();
	const { data: rounds = [], isLoading } = usePlayerRounds(address);
	const navigate = useNavigate();
	const { interval } = Route.useParams();

	const handleClick = (row: Round) => {
		navigate({ to: '/games/luro/$interval', params: { interval }, search: { round: row.round } });
	};
	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
			<DataTable
				data={rounds}
				columns={columns as ColumnDef<Round, never>[]}
				onRowClick={handleClick}
				isLoading={isLoading}
				loaderClassName="h-[185px]"
				noResultsClassName="h-[185px]"
			/>
		</motion.div>
	);
};

const WinnerInfo: FC<{ winner: Address }> = ({ winner }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'table' });
	const { address } = useAccount();

	if (!winner) {
		return <div>{t('waiting')}</div>;
	}
	return <div className={cn(address?.toLowerCase() === winner.toLowerCase() && 'text-green-500')}>{truncateEthAddress(winner)}</div>;
};
