import type { LuroBet } from '@/src/lib/types.ts';
import { addressToColor } from 'betfinio_app/lib/utils';
import { BarElement, CategoryScale, Chart as ChartJS, type ChartOptions, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { type FC, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const BonusChart: FC<{ bonuses: { bet: LuroBet; bonus: number }[] }> = ({ bonuses }) => {
	const colors: string[] = [];
	const values: number[] = [];

	for (const { bet, bonus } of bonuses) {
		values.push(bonus);
		colors.push(addressToColor(bet.player));
	}

	const options = useMemo<ChartOptions<'bar'>>(
		() => ({
			plugins: {
				title: {
					display: false,
					text: 'Lottery Bonuses',
				},
				legend: {
					display: false,
				},
				tooltip: {
					displayColors: false,
					callbacks: {
						label: (context) => `${Math.abs(context.parsed.y)} BET`,
						title: () => '',
					},
				},
			},
			responsive: true,
			scales: {
				x: {
					display: false,
				},
				y: {
					display: false,
					min: 0,
					max: Math.max(...values),
				},
			},
		}),
		[values],
	);

	const data = {
		labels: Array.from(Array(Math.max(values.length, 20)), (_, i) => i),
		datasets: [
			{
				label: 'Dataset 1',
				data: values,
				backgroundColor: colors,
				borderRadius: 2,
			},
		],
	};
	return <Bar style={{ height: 90 }} height={90} options={options} data={data} />;
};
