import { ETHSCAN } from '@/src/global.ts';
import { mapBetsToAuthors } from '@/src/lib/luro';
import { useRoundBets, useVisibleRound } from '@/src/lib/luro/query';
import { ZeroAddress, truncateEthAddress, valueToNumber } from '@betfinio/abi';
import Fox from '@betfinio/ui/dist/icons/Fox';
import { BetValue } from 'betfinio_app/BetValue';
import { useCustomUsername, useUsername } from 'betfinio_app/lib/query/username';
import { addressToColor } from 'betfinio_app/lib/utils';
import cx from 'clsx';
import { motion } from 'framer-motion';
import { type FC, memo, useEffect, useMemo, useRef, useState } from 'react';
import { List } from 'react-virtualized';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

export const PlayersTab = () => {
	const { data: round } = useVisibleRound();
	const { data: bets = [] } = useRoundBets(round);
	const [listHeight, setListHeight] = useState(460);

	const totalVolume = useMemo(() => {
		return bets.reduce((acc, val) => acc + val.amount, 0n);
	}, [bets]);

	const players = useMemo(() => {
		return mapBetsToAuthors([...bets]).sort((a, b) => Number(b.amount - a.amount));
	}, [bets]);
	const renderRow = ({ index, style }) => {
		const player = players[index];
		return (
			<div className={'px-2'} key={player.address} style={style}>
				<TabItem
					betsNumber={player.betsNumber}
					player={player.player}
					amount={valueToNumber(player.amount)}
					percent={(Number(player.amount) / Number(totalVolume)) * 100}
				/>
			</div>
		);
	};
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			setListHeight(ref.current.offsetHeight);
		} else {
			setListHeight(460);
		}
	}, [ref.current]);

	return (
		<div className={'grow flex flex-col gap-2 h-full'} ref={ref}>
			<List
				height={listHeight}
				width={1}
				containerStyle={{ width: '100%', maxWidth: '100%' }}
				style={{ width: '100%' }}
				rowCount={players.length}
				rowHeight={74}
				rowRenderer={renderRow}
				overscanRowCount={3}
			/>
		</div>
	);
};

export interface TabItemProps {
	player: Address;
	amount: number;
	percent: number;
	id?: Address;
	className?: string;
	betsNumber?: number;
}

export const TabItem: FC<TabItemProps> = memo(({ player, amount, percent, id, betsNumber = 0, className }) => {
	const { data: username } = useUsername(player);
	const { address = ZeroAddress } = useAccount();
	const { data: customUsername } = useCustomUsername(address, player);

	const formatPlayer = (player: string) => {
		if (player.length > 12) {
			return `${player.slice(0, 12)}...`;
		}
		return player;
	};
	return (
		<motion.div
			layout
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ type: 'spring', stiffness: 500, damping: 30 }}
			exit={{ opacity: 0, y: 10 }}
			className={cx('rounded-lg flex bg-primary justify-between', className as string)}
		>
			<div className={'py-3 px-2 flex justify-between items-center grow gap-2'}>
				<div className={'flex items-start gap-[10px]'}>
					<Fox className={'w-5 h-5'} />
					<div className={'flex flex-col text-[#6A6F84] text-xs gap-2'}>
						<a
							href={`${ETHSCAN}/address/${player}`}
							target={'_blank'}
							className={cx('font-semibold text-sm !text-gray-300 hover:underline', player === address && '!text-yellow-400')}
							rel="noreferrer"
						>
							{formatPlayer(customUsername || username || truncateEthAddress(player))}
						</a>
						<span className={cx('opacity-0', betsNumber > 0 && 'opacity-100')}>{betsNumber} bets</span>
					</div>
				</div>
				<div className={'flex flex-col items-end text-xs gap-2'}>
					<span className={'font-semibold text-sm'}>{percent.toFixed(2)}%</span>
					<span>
						<BetValue precision={2} value={amount} withIcon={true} />
					</span>
				</div>
			</div>
			<div className={'w-[10px] rounded-r-[10px]'} style={{ backgroundColor: addressToColor(player) }} />
		</motion.div>
	);
});
