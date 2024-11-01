import { usePlayerRounds, useRounds, useWinner, useWinners } from '@/src/lib/luro/query';
import type { Round } from '@/src/lib/luro/types.ts';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { ZeroAddress, truncateEthAddress, valueToNumber } from '@betfinio/abi';
import { Link, useNavigate } from '@tanstack/react-router';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { BetValue } from 'betfinio_app/BetValue';
import { DataTable } from 'betfinio_app/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'betfinio_app/tabs';
import cx from 'clsx';
import { motion } from 'framer-motion';
import { Expand, Loader } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

const RoundsTable: FC<{ className?: string }> = ({ className = '' }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'table' });

	const columns = [
		columnHelper.accessor('round', {
			header: t('columns.round'),
			meta: { className: 'md:w-[120px]' },

			cell: (props) => {
				const { player, round } = props.row.original;

				return <div className={cx('text-gray-400 md:w-[90px]', player.bets > 0 && 'text-yellow-400')}>#{round.toString()}</div>;
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
				<div className={'text-yellow-400'}>
					<BetValue value={valueToNumber(props.getValue())} withIcon />
				</div>
			),
		}),
		columnHelper.accessor('winner', {
			header: t('columns.winner'),
			cell: (props) => <WinnerInfo round={Number(props.row.original.round)} />,
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

	const myBetsColumn = columnHelper.accessor('player.volume', {
		header: t('columns.myBets'),
		cell: (props) => (
			<div className={''}>
				<BetValue value={valueToNumber(props.getValue())} withIcon />
			</div>
		),
	});

	const getPlayerRoundsTableColumns = (columns: unknown[]) => {
		const newColumns = [...columns];
		newColumns.splice(2, 0, myBetsColumn);
		return newColumns;
	};

	return (
		<div className={cx('w-full overflow-x-auto min-h-[100px]', className)}>
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

const AllRoundsTable: FC<{ columns: unknown[] }> = ({ columns }) => {
	const { address = ZeroAddress } = useAccount();
	const { data: rounds = [], isLoading } = useRounds(address);
	const navigate = useNavigate();
	const { interval } = Route.useParams();

	const handleClick = (row: Round) => {
		navigate({ to: '/luro/$interval', params: { interval }, search: { round: row.round } });
	};
	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
			{/*// @ts-ignore*/}
			<DataTable
				data={rounds}
				columns={columns as ColumnDef<Round, unknown>[]}
				onRowClick={handleClick}
				isLoading={isLoading}
				loaderClassName="h-[185px]"
				noResultsClassName="h-[185px]"
			/>
		</motion.div>
	);
};

const PlayerRoundsTable: FC<{ columns: unknown }> = ({ columns }) => {
	const { address = ZeroAddress } = useAccount();
	const { data: rounds = [], isLoading } = usePlayerRounds(address);
	const navigate = useNavigate();
	const { interval } = Route.useParams();

	const handleClick = (row: Round) => {
		navigate({ to: '/luro/$interval', params: { interval }, search: { round: row.round } });
	};
	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
			{/*// @ts-ignore*/}
			<DataTable
				data={rounds}
				columns={columns as ColumnDef<Round, unknown>[]}
				onRowClick={handleClick}
				isLoading={isLoading}
				loaderClassName="h-[185px]"
				noResultsClassName="h-[185px]"
			/>
		</motion.div>
	);
};

const WinnerInfo: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'table' });
	const { address } = useAccount();

	const { data: winner = null, isLoading, isFetching } = useWinner(round);
	if (isLoading || isFetching) {
		return <Loader className={'w-3 h-3 animate-spin'} />;
	}
	if (!winner) {
		return <div>{t('waiting')}</div>;
	}
	return <div className={cx(address?.toLowerCase() === winner.player.toLowerCase() && 'text-green-500')}>{truncateEthAddress(winner.player)}</div>;
};
