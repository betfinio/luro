import { TabItem } from '@/src/components/luro/tabs/PlayersTab.tsx';
import { valueToNumber } from '@betfinio/abi';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { List } from 'react-virtualized';
import { useRoundBets, useVisibleRound } from '../../../lib/query';

export const BetsTab = () => {
	const { data: round } = useVisibleRound();
	const { data: bets = [] } = useRoundBets(round);
	const [listHeight, setListHeight] = useState(460);
	const totalVolume = useMemo(() => {
		return bets.reduce((acc, val) => acc + val.amount, 0n);
	}, [bets]);

	const newestBetsFirst = useMemo(() => {
		return [...bets].reverse();
	}, [bets]);

	const renderRow = ({ index, style }: { index: number; style: CSSProperties }) => {
		const bet = newestBetsFirst[index];
		return (
			<div key={bet.address} className={'px-2'} style={style}>
				<TabItem player={bet.player} amount={valueToNumber(bet.amount)} percent={(Number(bet.amount) / Number(totalVolume)) * 100} />
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
				rowCount={bets.length}
				rowHeight={74}
				rowRenderer={renderRow}
				overscanRowCount={3}
			/>
		</div>
	);
};
