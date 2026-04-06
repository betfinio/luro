import { truncateEthAddress, valueToNumber, ZeroAddress } from '@betfinio/abi';
import { Bank, GoldenTrophy, People } from '@betfinio/components/icons';
import { cn } from '@betfinio/components/lib';
import { BetValue, DataTable } from '@betfinio/components/shared';
import { DialogClose, ScrollArea } from '@betfinio/components/ui';
import { Link } from '@tanstack/react-router';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { addressToColor } from 'betfinio_context/lib/utils';
import { Loader, ShieldCheckIcon, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { type FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { FeeNotice } from '@/src/components/FeeNotice.tsx';
import { RoundCircle } from '@/src/components/RoundCircle.tsx';
import { ETHSCAN } from '@/src/global.ts';
import { getTimesByRound, LURO_SHORT_ROUND_SECONDS_FALLBACK, mapBetsToRoundTable } from '@/src/lib';
import type { LuroInterval, Round, RoundModalPlayer } from '@/src/lib/types.ts';
import { Route } from '@/src/routes/games/luro/$interval.tsx';
import { useLuroFee, useLuroGameIntervalSeconds, useRoundBets, useRoundBetsGql, useVisibleRound, useWinner } from '../lib/query';

export const ModalContent: FC<{
	roundId: number;
	round: Round | null;
}> = ({ roundId, round: _round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal' });
	const { interval } = Route.useParams();
	const { data: intervalSeconds } = useLuroGameIntervalSeconds();
	const shortRoundSeconds = intervalSeconds ?? LURO_SHORT_ROUND_SECONDS_FALLBACK;
	const { start, end } = getTimesByRound(roundId, interval as LuroInterval, shortRoundSeconds);
	const isFinished = DateTime.fromMillis(Date.now()).diff(DateTime.fromMillis(end)).milliseconds > 0;

	const { data: betsChain = [] } = useRoundBets(roundId);
	const { data: betsGql = [] } = useRoundBetsGql(roundId);
	const bets = betsChain.length > 0 ? betsChain : betsGql;
	const { data: feeData } = useLuroFee();
	const { data: winner } = useWinner(roundId);

	const gqlVolume = useMemo(() => bets.reduce((acc, b) => acc + b.amount, 0n), [bets]);
	const lpFee = feeData ? (gqlVolume * feeData.feeBps) / 10000n : 0n;

	return (
		<ScrollArea className={'h-[98vh] SCROLLBAR max-h-[98vh] w-[98vw] md:h-auto md:max-w-[1200px] lg:w-[1000px]'}>
			<div
				onClick={(e) => e.stopPropagation()}
				className={'relative mx-auto text-white h-full w-full  min-h-[300px] rounded-xl flex flex-col p-2 md:p-3 lg:p-4 pt-5'}
			>
				<DialogClose>
					<X
						className={'absolute top-5 right-5 w-6 h-6  border-2 border-white rounded-full cursor-pointer hover:text-red-500 hover:border-red-500 duration-300'}
					/>
				</DialogClose>

				<div className={'flex flex-row gap-2 justify-start items-center'}>
					<div className={'flex flex-col gap-1 w-1/3 whitespace-nowrap'}>
						{isFinished ? (
							<div className={'text-lg leading-6'}>
								{t('titleFinished')} #{roundId}
							</div>
						) : (
							<div className={'text-lg'}>
								{t('title')} #{roundId}
							</div>
						)}
						<span className={'-mt-1 text-sm'}>
							{DateTime.fromMillis(start).toFormat('dd.MM.yyyy / HH:mm')} - {DateTime.fromMillis(end).toFormat('dd.MM.yyyy / HH:mm')}
						</span>
					</div>
				</div>

				<RoundDetails volume={gqlVolume} lpFee={lpFee} usersCount={bets.length} />
				<FeeNotice className={'mt-3'} />
				<div className={'mt-2 md:mt-3 lg:mt-4'}>
					<RoundCircle round={roundId} className={'aspect-auto py-10 px-2 md:px-10 '} />
				</div>
				<WinnerBetInfo round={roundId} />
				<BetsTable round={roundId} volume={gqlVolume} winner={(winner?.player || ZeroAddress).toLowerCase() as Address} />
			</div>
		</ScrollArea>
	);
};

interface RoundDetailsProps {
	volume: bigint;
	lpFee: bigint;
	usersCount: number;
}

const RoundDetails: FC<RoundDetailsProps> = ({ volume, lpFee, usersCount }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal.details' });

	return (
		<div className={'mt-4 grid grid-cols-2 gap-2 md:mt-10 md:gap-3 lg:gap-4'}>
			<div
				className={
					'border rounded-xl border-border bg-background-lighter min-h-[100px] flex flex-col md:flex-row justify-center items-center gap-1 md:gap-2 p-2 pt-0'
				}
			>
				<People className={'w-14 h-14 md:w-20 md:h-20 '} />
				<div className={'flex flex-col items-center md:items-start'}>
					<div className={'text-xl font-semibold'}>
						<BetValue value={valueToNumber(volume)} precision={2} withIcon />
					</div>
					<div className={'text-sm hidden md:flex font-semibold'}>
						({usersCount}
						<span className={'ml-1'}>{t('bets')}</span>)
					</div>
					<div className={'text-xs text-muted-foreground'}>{t('totalBets')}</div>
				</div>
			</div>
			<div
				className={
					'border rounded-xl border-border bg-background-lighter min-h-[100px] flex flex-col md:flex-row justify-center items-center gap-1 md:gap-2 p-2 pt-0'
				}
			>
				<Bank className={'w-14 h-14 text-secondary-foreground md:w-20 md:h-20 '} />
				<div className={'flex flex-col items-center md:items-start'}>
					<div className={'text-xl font-semibold'}>
						<BetValue value={valueToNumber(lpFee)} precision={1} withIcon={true} />
					</div>
					<div className={'text-xs text-muted-foreground'}>{t('paidToStaking')}</div>
				</div>
			</div>
		</div>
	);
};

const columnHelper = createColumnHelper<RoundModalPlayer>();

const WinnerBetInfo: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal.winnerBet' });

	const { data: winner, isLoading, isFetching } = useWinner(round);
	const { data: currentRound } = useVisibleRound();

	if (round === currentRound || !winner) {
		return null;
	}
	return (
		<div className={'py-5 border-b border-border flex flex-col items-center text-sm font-semibold'}>
			<p>{t('winningBet')}</p>
			{isLoading || isFetching ? (
				<Loader className={'w-3 h-3 animate-spin'} />
			) : (
				<a target={'_blank'} rel={'noreferrer'} href={`${ETHSCAN}/address/${winner?.bet}`} className={'underline'}>
					{winner?.bet}
				</a>
			)}

			<div className={'mt-5 flex gap-2'}>
				<p className={'text-muted-foreground'}>{t('proofOfRandom')}</p>
				{isLoading || isFetching ? (
					<Loader className={'w-3 h-3 animate-spin'} />
				) : (
					<>
						<ShieldCheckIcon className={'text-[#38BB7F] w-5 h-5'} />
						<Link target={'_blank'} to={`${ETHSCAN}/tx/${winner?.tx}`} className={'underline'}>
							{truncateEthAddress(winner?.tx || ZeroAddress)}
						</Link>
					</>
				)}
			</div>
		</div>
	);
};

const BetsTable: FC<{ round: number; className?: string; volume: bigint; winner: Address }> = ({ round, volume, winner }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal.table' });
	const { t: tShared } = useTranslation('shared', { keyPrefix: 'tables' });
	const { data: betsChain = [] } = useRoundBets(round);
	const { data: betsGql = [] } = useRoundBetsGql(round);
	const bets = betsChain.length > 0 ? betsChain : betsGql;
	const { address = ZeroAddress } = useAccount();

	const players = useMemo(() => {
		return mapBetsToRoundTable(bets, winner, volume, address.toLowerCase() as Address);
	}, [bets, winner, address, volume]);

	const columns: ColumnDef<RoundModalPlayer, any>[] = [
		columnHelper.display({
			header: '',
			id: 'color',
			meta: {
				className: 'w-[8px]! p-0! hidden lg:table-cell',
			},
			cell: (props) => <div className={'h-[40px] w-[8px] rounded-l'} style={{ backgroundColor: addressToColor(props.row.getValue('player')) }} />,
		}),
		columnHelper.display({
			header: '',
			id: 'trophy',
			meta: {
				className: 'w-[32px]! h-[40px] pr-0! hidden lg:table-cell',
			},
			cell: (props) => (
				<div className={'w-full h-full flex items-center justify-center'}>
					{props.row.getValue('player') === address.toLowerCase() ? (
						<div className={'text-[10px] text-muted-foreground font-semibold'}>{t('you')}</div>
					) : (
						props.row.getValue('player') === winner && <GoldenTrophy />
					)}
				</div>
			),
		}),
		columnHelper.accessor('player', {
			header: t('columns.player'),
			cell: (props) => {
				const address = props.getValue();

				return (
					<a href={`${ETHSCAN}/address/${address}`} className={'hover:underline'} target={'_blank'} rel="noreferrer">
						{truncateEthAddress(address)}
					</a>
				);
			},
		}),
		columnHelper.accessor('count', {
			header: t('columns.bets'),
			meta: {
				className: 'hidden md:table-cell',
			},
			cell: (props) => {
				const count = props.getValue();
				return <div>{count}</div>;
			},
		}),
		columnHelper.accessor('volume', {
			id: 'total_volume',
			header: t('columns.amount'),
			cell: (props) => {
				const pool = props.getValue();
				return <BetValue value={valueToNumber(pool)} withIcon={true} />;
			},
		}),
		columnHelper.accessor('win', {
			header: t('columns.totalResult'),
			id: 'totalWin',
			cell: (props) => {
				const win = props.getValue();
				const isWinner = win > 0n;
				return <BetValue value={valueToNumber(win)} withIcon={true} className={cn(isWinner && 'text-success')} />;
			},
		}),
	];

	return (
		<div className={'mt-4'}>
			<DataTable t={tShared} columns={columns} data={players} state={{ columnVisibility: { totalWin: winner !== ZeroAddress.toLowerCase() } }} />
		</div>
	);
};
