import type { LuroBet } from '@/src/lib/types.ts';
import { arrayFrom, truncateEthAddress } from '@betfinio/abi';
import { BetValue } from '@betfinio/components/shared';
import { type BarDatum, type BarTooltipProps, ResponsiveBar } from '@nivo/bar';
import { addressToColor } from 'betfinio_app/lib/utils';
import { type FC, useMemo } from 'react';
import type { Address } from 'viem';

interface BonusItem extends BarDatum {
	bet: Address;
	bonus: number;
	bonusColor: string;
}

export const BonusChart: FC<{ bonuses: { bet: LuroBet; bonus: number }[] }> = ({ bonuses }) => {
	const data = useMemo<BonusItem[]>(() => {
		return bonuses.map((item, index) => ({
			bet: item.bet.address as Address,
			bonus: item.bonus,
			bonusColor: addressToColor(item.bet.player),
			index,
		}));
	}, [bonuses]);

	const [min, max] = data.reduce<[number, number]>(([minVal, maxVal], bar) => [Math.min(minVal, bar.bonus), Math.max(maxVal, bar.bonus)], [0, 0]);

	const desiredLength = 15;
	const resultData = [...data];

	if (resultData.length < desiredLength) {
		const toAdd = desiredLength - resultData.length;
		resultData.unshift(
			...arrayFrom(Math.floor(toAdd / 2)).map((num, i) => ({
				bet: `0x123${num}` as Address,
				bonus: 0,
				bonusColor: 'hsl(var(--primary)',
				index: i + resultData.length,
			})),
		);
		resultData.push(
			...arrayFrom(Math.floor(toAdd / 2)).map((num, i) => ({
				bet: `0x123${num + 100}` as Address,
				bonus: 0,
				bonusColor: 'hsl(var(--primary)',
				index: i + resultData.length,
			})),
		);
	}

	const CustomTooltip: FC<BarTooltipProps<BonusItem>> = ({ data }) => (
		<div className="border border-border text-xs rounded-lg bg-background p-2 flex flex-col">
			<div>{truncateEthAddress(data.bet)}</div>
			<div className="flex flex-row items-center gap-1">
				Bonus: <BetValue value={Math.abs(data.bonus)} withIcon />
			</div>
		</div>
	);

	return (
		<div style={{ height: 90 }}>
			<ResponsiveBar
				data={resultData as readonly BonusItem[]}
				keys={['bonus']}
				indexBy="bet"
				colors={(bar) => bar.data.bonusColor}
				minValue={min < 0 ? min : 0}
				maxValue={max}
				enableGridX={false}
				enableGridY={false}
				axisLeft={null}
				axisBottom={null}
				padding={0.1}
				borderRadius={2}
				enableLabel={false}
				tooltip={CustomTooltip}
			/>
		</div>
	);
};
