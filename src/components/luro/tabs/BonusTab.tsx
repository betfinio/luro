import { ETHSCAN } from '@/src/global.ts';
import { useRoundBank, useRoundBets, useRoundBonusShare, useVisibleRound } from '@/src/lib/query';
import { truncateEthAddress, valueToNumber } from '@betfinio/abi';
import { cn } from '@betfinio/components/lib';
import { BetValue } from '@betfinio/components/shared';
import Fox from '@betfinio/ui/dist/icons/Fox';
import { useUsername } from 'betfinio_app/lib/query/username';
import { addressToColor } from 'betfinio_app/lib/utils';
import { motion } from 'framer-motion';
import { type CSSProperties, type FC, useEffect, useMemo, useRef, useState } from 'react';
import { List } from 'react-virtualized';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

export const BonusTab = () => {
	const { data: round } = useVisibleRound();
	const { data: bets = [] } = useRoundBets(round);
	const { data: volume = 0n } = useRoundBank(round);
	const { data: bonusShare = 0n } = useRoundBonusShare(round);
	const [listHeight, setListHeight] = useState(460);

	const renderRow = ({ index, style }: { index: number; style: CSSProperties }) => {
		const bet = bets[index];
		return (
			<div className={'px-2 h-[74px]'} key={bet.address} style={style}>
				<TabItem player={bet.player} bonus={bonuses[index].bonus} />
			</div>
		);
	};

	const bonuses = useMemo(() => {
		return bets.map((bet, index) => {
			if (bonusShare === 0n) return { bet, bonus: 0 };
			const bonusPool = (volume / 100n) * 5n;
			const weight = bet.amount * BigInt(bets.length - index);
			return {
				bet,
				bonus: valueToNumber((bonusPool * weight) / bonusShare),
			};
		});
	}, [bets, volume]);
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

export interface TabItemProps {
	player: Address;
	bonus: number;
}

const TabItem: FC<TabItemProps> = ({ player, bonus }) => {
	const { data: username } = useUsername(player);
	const { address } = useAccount();

	const formatPlayer = (player: string) => {
		if (player.length > 10) {
			return `${player.slice(0, 10)}...`;
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
			className={cn('rounded-lg flex bg-background justify-between h-[68px]')}
		>
			<div className={'py-3 pl-4 pr-2 flex justify-between items-center grow gap-2'}>
				<div className={'flex items-start gap-[10px]'}>
					<Fox className={'w-5 h-5'} />
					<div className={'flex flex-col text-muted-foreground text-xs gap-2'}>
						<a
							href={`${ETHSCAN}/address/${player}`}
							target={'_blank'}
							className={cn('font-semibold text-sm text-muted-foreground hover:underline', player === address && '!text-secondary-foreground')}
							rel="noreferrer"
						>
							{formatPlayer(username || truncateEthAddress(player))}
						</a>
					</div>
				</div>
				<div className={'flex flex-col items-end text-xs gap-2'}>
					<div className={'font-semibold text-sm text-secondary-foreground'}>
						<BetValue value={bonus} precision={2} withIcon={true} />
					</div>
				</div>
			</div>
			<div className={'w-[10px] rounded-r-[10px]'} style={{ backgroundColor: addressToColor(player) }} />
		</motion.div>
	);
};
