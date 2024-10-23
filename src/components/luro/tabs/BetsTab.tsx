import { TabItem } from '@/src/components/luro/tabs/PlayersTab.tsx';
import { useRoundBets, useVisibleRound } from '@/src/lib/luro/query';
import { valueToNumber } from '@betfinio/abi';
import { AnimatePresence } from 'framer-motion';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

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

	const ref = useRef<HTMLDivElement>(null);

	const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
		const bet = newestBetsFirst[index];
		return (
			<div className={'px-2'} style={style}>
				<TabItem player={bet.player} amount={valueToNumber(bet.amount)} percent={(Number(bet.amount) / Number(totalVolume)) * 100} />
			</div>
		);
	};

	useEffect(() => {
		if (ref.current) {
			setListHeight(ref.current.offsetHeight);
		} else {
			setListHeight(460);
		}
	}, [ref.current]);

	return (
		<div className={'grow flex flex-col gap-2 h-full'} ref={ref}>
			<AnimatePresence mode="popLayout">
				<List
					height={listHeight} // Adjust height to fit your layout
					itemCount={bets.length}
					itemSize={74} // Adjust item size if necessary
					width={'100%'}
				>
					{Row}
				</List>
			</AnimatePresence>
		</div>
	);
};
