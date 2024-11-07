import { RoundCircle } from '@/src/components/luro/RoundCircle.tsx';
import { ETHSCAN } from '@/src/global.ts';
import { type LuroInterval, getTimesByRound, mapBetsToRoundTable } from '@/src/lib/luro';
import {
	useBonusDistribution,
	useCalculate,
	useDistributeBonus,
	useRound,
	useRoundBank,
	useRoundBets,
	useRoundBonusShare,
	useVisibleRound,
	useWinners,
} from '@/src/lib/luro/query';
import { addressToColor } from 'betfinio_app/lib/utils';

import type { Round, RoundModalPlayer } from '@/src/lib/luro/types.ts';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { ZeroAddress, truncateEthAddress, valueToNumber } from '@betfinio/abi';
import Bank from '@betfinio/ui/dist/icons/Bank';
import GoldenTrophy from '@betfinio/ui/dist/icons/GoldenTrophy';
import MoneyHand from '@betfinio/ui/dist/icons/MoneyHand';
import People from '@betfinio/ui/dist/icons/People';
import { Link } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { BetValue } from 'betfinio_app/BetValue';
import { DataTable } from 'betfinio_app/DataTable';
import { ScrollArea } from 'betfinio_app/scroll-area';
import cx from 'clsx';
import { Loader, ShieldCheckIcon, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { type FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

export const ModalContent: FC<{
	onClose: () => void;
	roundId: number;
	interval: number;
	round: Round | null;
}> = ({ onClose, roundId, round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal' });
	const { interval } = Route.useParams();
	const { start, end } = getTimesByRound(roundId, interval as LuroInterval);
	const isFinished = DateTime.fromMillis(Date.now()).diff(DateTime.fromMillis(end)).milliseconds > 0;

	const { data: volume = 0n } = useRoundBank(roundId);
	const { data: bonusShare = 0n } = useRoundBonusShare(roundId);
	const { data: winners = [] } = useWinners();
	const { mutate } = useCalculate(round?.round || 0);
	const winner = winners.find((w) => w.round === roundId)?.player || ZeroAddress;

	const handleCalculate = useCallback(() => {
		mutate();
	}, []);
	return (
		<ScrollArea className={'h-[98vh] SCROLLBAR max-h-[98vh] w-[98vw] md:h-auto md:max-w-[1200px] lg:w-[1000px]'}>
			<div
				onClick={(e) => e.stopPropagation()}
				className={'relative mx-auto text-white h-full w-full  min-h-[300px] rounded-xl flex flex-col p-2 md:p-3 lg:p-4 pt-5'}
			>
				<X
					className={'absolute top-5 right-5 w-6 h-6  border-2 border-white rounded-full cursor-pointer hover:text-red-500 hover:border-red-500 duration-300'}
					onClick={() => onClose()}
				/>
				<div className={'flex flex-row gap-2 justify-start items-center'}>
					<div className={'flex flex-col gap-1 w-1/3 whitespace-nowrap cursor-pointer'} onClick={handleCalculate}>
						{isFinished ? (
							<div className={'text-lg leading-6'}>
								{t('titleFinished')} #{roundId}
							</div>
						) : (
							<>
								<div className={'text-lg'}>
									{t('title')} #{roundId}
								</div>
							</>
						)}
						<span className={'-mt-1 text-sm'}>
							{DateTime.fromMillis(start).toFormat('dd.MM.yyyy / HH:mm')} - {DateTime.fromMillis(end).toFormat('dd.MM.yyyy / HH:mm')}
						</span>
					</div>
				</div>

				<RoundDetails volume={volume} usersCount={Number(round?.total.bets)} />
				<div className={'mt-2 md:mt-3 lg:mt-4'}>
					<RoundCircle round={roundId} className={'aspect-auto py-10 px-2 md:px-10 '} />
				</div>
				<WinnerBetInfo round={roundId} />
				<BetsTable round={roundId} volume={volume} bonusShare={bonusShare} winner={(winner || ZeroAddress).toLowerCase() as Address} />
				<BonusDistribution round={roundId} />
			</div>
		</ScrollArea>
	);
};

interface RoundDetailsProps {
	volume: bigint;
	usersCount: number;
}

const BonusDistribution: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal' });
	const { data: distributed } = useBonusDistribution(round);
	const { mutate: distribute } = useDistributeBonus();
	const { interval } = Route.useParams();
	const { end } = getTimesByRound(round, interval as LuroInterval);
	const handleDistribute = () => {
		console.log('distribute');
		distribute({ round });
	};

	if (distributed) {
		return <div className={'flex flex-row items-center my-4 justify-center'}>Bonuses were distributed!</div>;
	}

	if (end > Date.now()) {
		return null;
	}
	return (
		<div className={'flex flex-row gap-2 items-center justify-end py-2'}>
			<button type={'submit'} onClick={handleDistribute} className={'bg-yellow-400 px-4 py-2 rounded-xl text-black '}>
				Distribute bonuses
			</button>
		</div>
	);
};

const RoundDetails: FC<RoundDetailsProps> = ({ volume, usersCount }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal.details' });

	const staking = (volume / 1000n) * 36n;
	const bonus = (volume / 100n) * 5n;
	return (
		<div className={'mt-4 grid grid-cols-3 gap-2 md:mt-10 md:gap-3 lg:gap-4'}>
			<div
				className={
					'border rounded-xl border-gray-800 bg-primaryLighter min-h-[100px] flex flex-col md:flex-row justify-center items-center gap-1 md:gap-2 p-2 pt-0'
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
					<div className={'text-xs text-gray-400'}>{t('totalBets')}</div>
				</div>
			</div>
			<div
				className={
					'border rounded-xl border-gray-800 bg-primaryLighter min-h-[100px] flex flex-col md:flex-row justify-center items-center gap-1 md:gap-2 p-2 pt-1'
				}
			>
				<MoneyHand className={'p-1 w-13 h-13 text-yellow-400 md:w-20 md:h-20 '} />
				<div className={'flex flex-col items-center md:items-start'}>
					<div className={' text-xl font-semibold'}>
						<BetValue value={valueToNumber(bonus)} precision={1} withIcon={true} />
					</div>
					<div className={'text-xs text-gray-400'}>{t('totalBonus')}</div>
				</div>
			</div>
			<div
				className={
					'border rounded-xl  border-gray-800 bg-primaryLighter min-h-[100px] flex flex-col md:flex-row justify-center items-center gap-1 md:gap-2 p-2 pt-0'
				}
			>
				<Bank className={'w-14 h-14 text-yellow-400 md:w-20 md:h-20 '} />
				<div className={'flex flex-col items-center md:items-start'}>
					<div className={'text-xl font-semibold'}>
						<BetValue value={valueToNumber(staking)} precision={1} withIcon={true} />
					</div>
					<div className={'text-xs text-gray-400'}>{t('paidToStaking')}</div>
				</div>
			</div>
		</div>
	);
};

const columnHelper = createColumnHelper<RoundModalPlayer>();

const WinnerBetInfo: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal.winnerBet' });

	const { data: winners = [], isLoading, isFetching } = useWinners();
	const { data: currentRound } = useVisibleRound();

	const winner = winners.find((w) => w.round === round);

	if (round === currentRound || winner === undefined) {
		return null;
	}
	return (
		<div className={'py-5 border-b border-gray-800 flex flex-col items-center text-sm font-semibold'}>
			<p>{t('winningBet')}</p>
			{isLoading || isFetching ? (
				<Loader className={'w-3 h-3 animate-spin'} />
			) : (
				<a target={'_blank'} rel={'noreferrer'} href={`${ETHSCAN}/address/${winner.bet}`} className={'underline'}>
					{winner.bet}
				</a>
			)}

			<div className={'mt-5 flex gap-2'}>
				<p className={'text-gray-400'}>{t('proofOfRandom')}</p>
				{isLoading || isFetching ? (
					<Loader className={'w-3 h-3 animate-spin'} />
				) : (
					<>
						<ShieldCheckIcon className={'text-[#38BB7F] w-5 h-5'} />
						<Link target={'_blank'} to={`${ETHSCAN}/tx/${winner.tx}`} className={'underline'}>
							{truncateEthAddress(winner.tx)}
						</Link>
					</>
				)}
			</div>
		</div>
	);
};

const BetsTable: FC<{ round: number; className?: string; volume: bigint; bonusShare: bigint; winner: Address }> = ({
	className,
	round,
	volume,
	bonusShare,
	winner,
}) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundModal.table' });

	const { data: bets = [], isFetched: isRoundsFetched } = useRoundBets(round);
	const { address = ZeroAddress } = useAccount();
	const { data: roundData } = useRound(round);

	const players = useMemo(() => {
		return mapBetsToRoundTable(bets, winner, volume, bonusShare, address.toLowerCase() as Address);
	}, [bets, winner, address]);

	const columns = [
		columnHelper.display({
			header: '',
			id: 'color',
			meta: {
				className: '!w-[8px] !p-0 hidden lg:table-cell',
			},
			cell: (props) => <div className={'h-[40px] w-[8px] rounded-l'} style={{ backgroundColor: addressToColor(props.row.getValue('player')) }} />,
		}),
		columnHelper.display({
			header: '',
			id: 'trophy',
			meta: {
				className: '!w-[32px] h-[40px] !pr-0 hidden lg:table-cell',
			},
			cell: (props) => (
				<div className={'w-full h-full flex items-center justify-center'}>
					{props.row.getValue('player') === address.toLowerCase() ? (
						<div className={'text-[10px] text-gray-400 font-semibold'}>{t('you')}</div>
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
			id: 'total_bonus',
			header: t('columns.amount'),
			cell: (props) => {
				const pool = props.getValue();
				return <BetValue value={valueToNumber(pool)} withIcon={true} />;
			},
		}),

		columnHelper.accessor('bonus', {
			header: t('columns.bonus'),
			meta: {
				className: 'hidden md:table-cell',
			},
			cell: (props) => {
				const pool = props.getValue();
				return <BetValue value={valueToNumber(pool)} withIcon={true} />;
			},
		}),
		columnHelper.display({
			header: t('columns.totalResult'),
			id: 'totalWin',
			cell: (props) => {
				const isWinner = props.row.getValue('player') === winner;
				const win = props.row.original.win;
				const bonus = props.row.getValue('bonus') as bigint;
				return <BetValue value={bonus + (isWinner ? win : 0n)} withIcon={true} className={cx(isWinner && 'text-green-600')} />;
			},
		}),
	];

	return (
		<div className={'mt-4'}>
			{/*// @ts-ignore*/}
			<DataTable columns={columns} data={players} state={{ columnVisibility: { totalWin: (roundData?.winnerOffset || 0n) > 0n } }} />
		</div>
	);
};
