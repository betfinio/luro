import { ETHSCAN } from '@/src/global.ts';
import { useRoundBank, useRoundBets, useRoundBonusShare, useVisibleRound } from '@/src/lib/luro/query';
import { truncateEthAddress, valueToNumber } from '@betfinio/abi';
import Fox from '@betfinio/ui/dist/icons/Fox';
import { BetValue } from 'betfinio_app/BetValue';
import { useUsername } from 'betfinio_app/lib/query/username';
import { addressToColor } from 'betfinio_app/lib/utils';
import cx from 'clsx';
import { AnimatePresence } from 'framer-motion';
import { type CSSProperties, type FC, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

export const BonusTab = () => {
	const { data: round } = useVisibleRound();
	const { data: bets = [] } = useRoundBets(round);
	const { data: volume = 0n } = useRoundBank(round);
	const { data: bonusShare = 0n } = useRoundBonusShare(round);
	const [listHeight, setListHeight] = useState(460);

	const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
		const bet = bets[index];
		return (
			<div className={'px-2 h-[74px]'} style={style}>
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
		<div className={cx('rounded-lg flex bg-primary justify-between h-[68px]')}>
			<div className={'py-3 pl-4 pr-2 flex justify-between items-center grow gap-2'}>
				<div className={'flex items-start gap-[10px]'}>
					<Fox className={'w-5 h-5'} />
					<div className={'flex flex-col text-[#6A6F84] text-xs gap-2'}>
						<a
							href={`${ETHSCAN}/address/${player}`}
							target={'_blank'}
							className={cx('font-semibold text-sm !text-gray-300 hover:underline', player === address && '!text-yellow-400')}
							rel="noreferrer"
						>
							{formatPlayer(username || truncateEthAddress(player))}
						</a>
					</div>
				</div>
				<div className={'flex flex-col items-end text-xs gap-2'}>
					<div className={'font-semibold text-sm text-[#FFC800]'}>
						<BetValue value={bonus} precision={2} withIcon={true} />
					</div>
				</div>
			</div>
			<div className={'w-[10px] rounded-r-[10px]'} style={{ backgroundColor: addressToColor(player) }} />
		</div>
	);
};
