import { TabItem, WinnerCard } from '@/src/components/luro/tabs/PlayersTab.tsx';
import { type LuroInterval, getTimesByRound, hexToRgbA, jumpToCurrentRound } from '@/src/lib';
import { Tooltip, TooltipContent, TooltipTrigger } from '@betfinio/components/ui';
import { useLuroState, useObserveBet, useRound, useRoundBank, useRoundBets, useRoundWinner, useVisibleRound } from '../../lib/query';

import Chainlink from '@/src/assets/chainlink.svg';
import type { CustomLuroBet } from '@/src/lib/types.ts';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { ZeroAddress, valueToNumber } from '@betfinio/abi';
import { cn } from '@betfinio/components/lib';
import { BetValue } from '@betfinio/components/shared';
import { Bet } from '@betfinio/ui/dist/icons';
import { Pie, type PieTooltipProps } from '@nivo/pie';
import { useQueryClient } from '@tanstack/react-query';
import anime from 'animejs';
import { addressToColor } from 'betfinio_app/lib/utils';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { Loader, PlusIcon, TriangleIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import millify from 'millify';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import ConfettiExplosion from 'react-confetti-explosion';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

import Crown from '@/src/assets/luro/crown.svg';
import Duck from '@/src/assets/luro/duck.png';
import { LURO, LURO_5MIN } from '@/src/global.ts';
import { useTranslation } from 'react-i18next';

const largeProps = {
	force: 0.8,
	duration: 3000,
	particleCount: 300,
	width: 1600,
	colors: ['#041E43', '#1471BF', '#5BB4DC', '#FC027B', '#66D805'],
};

export const RoundCircle: FC<{ round: number; className?: string }> = ({ round, className = '' }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundCircle' });

	const [confettiExploding, setConfettiExploding] = useState(false);
	const [winnerColor, setWinnerColor] = useState<string | null>(null);
	const { address } = useAccount();
	const { data: bets = [] } = useRoundBets(round);
	const { data: currentRound } = useVisibleRound();
	const { data: roundData } = useRound(round);
	const winner = useRoundWinner(round);

	const {
		state: { data: wheelState },
		updateState: updateWheelState,
	} = useLuroState(round);

	const singleRotationDuration = 5000;
	// todo: Extract states to enum
	useEffect(() => {
		if (round !== currentRound) {
			return;
		}
		if (wheelState.state === 'standby') {
			anime.set(['.LOTTERY'], {
				rotate: () => 0,
			});
		}
		if (wheelState.state === 'spinning') {
			spinWheel();
		}
		if (wheelState.state === 'landed') {
			stopWheel((wheelState.winnerOffset * 360) / valueToNumber(roundData?.total.volume), wheelState.bet);
		}
		if (wheelState.state === 'stopped') {
			if (winner?.player === address) {
				setConfettiExploding(true);
			} else {
				setWinnerColor(addressToColor(winner?.player ?? ZeroAddress));
				setTimeout(() => {
					setWinnerColor(null);
				}, 1000);
			}
		}
	}, [wheelState]);
	const wheelRef = useRef(null);

	const wheelAngle = useMemo(() => {
		if (currentRound !== round) {
			if (roundData?.status === 2) {
				return Number((winner?.offset ?? 0n) * 360n) / valueToNumber(roundData?.total.volume);
			}
		}
		return 0;
	}, [winner, roundData?.total.volume]);

	function spinWheel() {
		if (wheelState.state !== 'spinning') return;

		anime({
			targets: ['.LOTTERY'],
			duration: 2000, // random duration
			rotate: '720',
			easing: 'easeInQuad',
			complete: () => {
				anime.set(['.LOTTERY'], {
					rotate: () => 0,
				});
				anime({
					targets: ['.LOTTERY'],
					duration: 500, // random duration
					rotate: '360',
					easing: 'linear',
					loop: true,
				});
			},
		});
	}

	async function stopWheel(result: number, bet: string) {
		const bezier = [0.165, 0.84, 0.44, 1.005];
		const wheelMinNumberOfSpins = 3;
		const wheelMaxNumberOfSpins = 4;

		const totalRotation = Math.floor(Math.random() * (wheelMaxNumberOfSpins - wheelMinNumberOfSpins + 1) + wheelMinNumberOfSpins) * 360 - result;

		anime.remove('.LOTTERY');
		anime({
			targets: ['.LOTTERY'],
			rotate: () => {
				return totalRotation; // random number
			},
			duration: singleRotationDuration, // random duration
			easing: `cubicBezier(${bezier.join(',')})`,
			complete: () => {
				updateWheelState({ state: 'stopped', result, bet }, round);
			},
		});
	}

	const data: CustomLuroBet[] = useMemo(() => {
		return bets.map((bet) => ({
			id: bet.address,
			label: bet.player,
			value: valueToNumber(bet.amount),
			color: hexToRgbA(addressToColor(bet.player)),
			betsNumber: bets.filter((b) => bet.player === b.player).length,
		}));
	}, [bets]);

	const [chartHeight, setChartHeight] = useState(250);
	const boxRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (boxRef.current) {
			setChartHeight(boxRef.current?.offsetHeight);
		} else {
			setChartHeight(460);
		}
	}, [boxRef.current]);

	return (
		<Tooltip>
			<motion.div
				className={cn(
					'border-border border relative p-4 flex-grow xl:p-8 rounded-xl bg-background-light flex flex-col md:flex-row items-center justify-center gap-10 duration-500 ease-in-out',
					className,
				)}
				style={{ backgroundColor: winnerColor ? `${winnerColor}80` : 'transparent' }}
			>
				{currentRound === round && <EffectsLayer round={round} />}
				<div className={cn('h-[250px] xl:h-[325px]', currentRound !== round && '!h-[300px] md:!h-[325px]')} ref={boxRef}>
					<div className={'relative'}>
						<ProgressBar round={round} authors={data} />

						{confettiExploding && (
							<div className={'top-1/2 left-1/2'}>
								<ConfettiExplosion
									force={largeProps.force}
									duration={largeProps.duration}
									particleCount={largeProps.particleCount}
									width={largeProps.width}
									colors={largeProps.colors}
								/>
							</div>
						)}

						{data.length > 0 ? (
							round === currentRound ? (
								<div className={'LOTTERY'} ref={wheelRef}>
									<Pie
										data={data}
										colors={{ datum: 'data.color' }}
										innerRadius={0.7}
										enableArcLabels={false}
										enableArcLinkLabels={false}
										width={chartHeight}
										height={chartHeight}
										isInteractive={wheelState.state === 'standby' || wheelState.state === 'waiting'}
										tooltip={CustomTooltip(roundData?.total.volume || 0n)}
									/>
								</div>
							) : (
								<div>
									<Pie
										data={data}
										colors={{ datum: 'data.color' }}
										innerRadius={0.7}
										startAngle={-wheelAngle}
										endAngle={360 - wheelAngle}
										enableArcLabels={false}
										enableArcLinkLabels={false}
										width={chartHeight}
										height={chartHeight}
										isInteractive={wheelState.state === 'standby' || wheelState.state === 'waiting'}
										tooltip={CustomTooltip(roundData?.total.volume || 0n)}
									/>
								</div>
							)
						) : (
							<Pie
								data={[{ id: 'none', value: 100, color: '#777' }]}
								colors={{ datum: 'data.color' }}
								innerRadius={0.7}
								enableArcLabels={false}
								enableArcLinkLabels={false}
								width={chartHeight}
								height={chartHeight}
								tooltip={() => null}
							/>
						)}
					</div>
				</div>
				{currentRound !== round && (roundData?.total.volume || 0n) > 0n && (
					<div className={cn('w-full flex gap-4 flex-row items-center justify-evenly')}>
						{roundData?.status === 0 && t('waiting')}

						{roundData?.status === 2 && (
							<>
								<div className={'shrink-0'}>
									<img alt={'duck'} src={Duck as string} className={'max-h-[200px] md:h-[300px]'} />
								</div>
								<div className={'flex flex-col min-w-[190px] gap-4'}>
									<div
										className={cn(
											'border border-secondary-foreground bg-background flex flex-col py-4 items-center rounded-lg min-h-[130px] justify-center drop-shadow-[0_0_35px_rgba(87,101,242,0.75)] duration-300',
										)}
									>
										<RoundResult round={round} />
									</div>
								</div>
							</>
						)}
					</div>
				)}
			</motion.div>
		</Tooltip>
	);
};

const EffectsLayer: FC<{ round: number }> = ({ round }) => {
	const {
		query: { data: observedBetAuthor },
		resetObservedBet,
	} = useObserveBet(round);
	const { address } = useAccount();
	const [particles, setParticles] = useState<Array<{ x: number; y: number; color: string }>>([]);
	const [otherParticles, setOtherParticles] = useState<Array<{ x: number; y: number; color: string }>>([]);

	const ref = useRef<HTMLDivElement | null>(null);

	const generateParticles = (address?: Address) => {
		const { width, height } = ref.current?.getBoundingClientRect() ?? { width: 300, height: 300 };

		const arr = Array.from(new Array(30));
		return arr.map(() => ({
			color: addressToColor(address ?? ZeroAddress),
			x: Math.floor(Math.random() * (width + 40)) - 20, // Adjusted for wider range
			y: Math.floor(Math.random() * (height + 40)) - 20, // Adjusted for wider range
		}));
	};

	useEffect(() => {
		if (!observedBetAuthor.address) return;
		if (observedBetAuthor.address === address) {
			setParticles(generateParticles(address));
			setTimeout(() => {
				setParticles([]);
				resetObservedBet();
			}, 4000);
		} else if (observedBetAuthor.address !== ZeroAddress) {
			setOtherParticles(generateParticles(observedBetAuthor.address));
			setTimeout(() => {
				setOtherParticles([]);
				resetObservedBet();
			}, 4000);
		}
	}, [observedBetAuthor.address]);

	return (
		<div ref={ref} className={'absolute top-0 right-0 left-0 bottom-0 duration-300 overflow-hidden'}>
			<AnimatePresence>
				{particles?.map((particle, i) => (
					<motion.div
						key={particle.color + i}
						initial={{ opacity: 0, y: 300 }}
						animate={{ opacity: 1, y: -500 }}
						transition={{ duration: Math.random() * 2.3 + 1, delay: i * 0.01 }}
						className="w-5 h-5 absolute"
						style={{ left: particle.x, top: particle.y }}
					>
						<Bet className="text-secondary-foreground w-5 h-5" />
					</motion.div>
				))}

				{otherParticles?.map((particle, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 300 }}
						animate={{ opacity: 1, y: -500 }}
						transition={{ duration: Math.random() * 2.3 + 1, delay: i * 0.01 }}
						className="w-5 h-5 absolute"
						style={{ left: particle.x, top: particle.y }}
					>
						<div style={{ color: particle.color }}>
							<PlusIcon width={24} height={24} />
						</div>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
};

const CustomTooltip =
	(bank: bigint) =>
	({
		datum: { id, label, value, data },
	}: PieTooltipProps<{
		value: number;
		color: string;
	}>) => {
		return (
			<TabItem
				key={id}
				amount={value}
				betsNumber={(data as CustomLuroBet)?.betsNumber}
				className={'min-w-[250px]  !z-15'}
				player={label as Address}
				percent={(value * 100) / valueToNumber(bank)}
			/>
		);
	};
const ProgressBar: FC<{ round: number; authors: CustomLuroBet[] }> = ({ round }) => {
	const { data: roundData } = useRound(round);
	const { data: bank = 0n, isLoading: isBankLoading } = useRoundBank(round);
	const { data: currentRound } = useVisibleRound();
	const winner = useRoundWinner(round);
	const queryClient = useQueryClient();
	const {
		state: { data: luroState, isLoading: isLotteryStateLoading, isPending: isLotteryStatePending },
		updateState,
	} = useLuroState(round);
	const styles = {
		root: {
			width: '100%',
		},
		path: {
			stroke: 'hsl(var(--primary))',
			strokeWidth: '1px',
		},
		trail: {
			stroke: 'rgba(256, 256, 256, 0.2)',
			strokeWidth: '1px',
		},
	};
	const [progress, setProgress] = useState(0);
	const { interval } = Route.useParams();

	const { start, end } = getTimesByRound(round, interval as LuroInterval);

	const changeLotteryState = () => {
		if (luroState.state === 'standby' && !isLotteryStateLoading && !isLotteryStatePending) {
			updateState({ state: 'waiting' }, round);
		}
	};

	const luroAddress = interval === '1d' ? LURO : LURO_5MIN;

	const handleRoundEnd = () => {
		if (bank === 0n) {
			jumpToCurrentRound(queryClient, luroAddress);
		} else {
			changeLotteryState();
		}
	};

	useEffect(() => {
		const now = Date.now();
		setProgress(100 - ((end - now) / (end - start)) * 100);

		if (now <= end) {
			const i = setInterval(() => {
				const now = Date.now();
				if (end < now) {
					handleRoundEnd();
				}
				setProgress(100 - ((end - now) / (end - start)) * 100);
			}, 500);
			return () => clearInterval(i);
		}
	}, [round, bank, luroState.state]);

	const [from, setFrom] = useState(0);

	const to = useMemo(() => {
		const value = Math.floor(valueToNumber(isBankLoading ? 0n : bank));

		setTimeout(() => {
			setFrom(value);
		}, 1000);
		return value;
	}, [isBankLoading, bank]);

	const { state: wheelState } = useLuroState(round);

	const renderInside = () => {
		if (currentRound !== round) {
			if (roundData?.status === 2) {
				const authorVolume = valueToNumber(winner?.amount ?? 0n);
				const volume = valueToNumber(roundData?.total.volume ?? 1n);

				const finalVolume = (volume * 935) / 1000;

				const percent = (authorVolume / finalVolume) * 100;
				const coef = (finalVolume / authorVolume).toFixed(2);

				return <BetCircleWinner player={winner?.player ?? '0x123'} amount={authorVolume} percent={percent} coef={coef} win={finalVolume} loading={!winner} />;
			}
		}
		switch (wheelState.data.state) {
			case 'stopped': {
				const authorVolume = valueToNumber(winner?.amount ?? 0n);
				const volume = valueToNumber(roundData?.total.volume ?? 1n);

				const finalVolume = (volume * 935) / 1000;

				const percent = (authorVolume / finalVolume) * 100;
				const coef = (finalVolume / authorVolume).toFixed(2);

				return <BetCircleWinner player={winner?.player ?? '0x123'} amount={authorVolume} percent={percent} coef={coef} win={finalVolume} loading={!winner} />;
			}
			default: {
				const remaining = DateTime.fromMillis(end).diffNow();
				const secondsLeft = Number(remaining.toFormat('ss'));
				return (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5 }}
						className={'absolute flex flex-col items-center justify-center w-full h-full -top-4 gap-4'}
					>
						<div className={cn('text-md', secondsLeft < 30 && secondsLeft > 0 && 'text-red-500 animate-pulse')}>
							{end > Date.now() ? (
								remaining.toFormat('hh:mm:ss')
							) : (
								<div className={'w-6 aspect-square animate-pulse ease-in-out'}>
									<img src={Chainlink as string} alt="" />
								</div>
							)}
						</div>
						<div className={cn('text-xl  lg:text-3xl', secondsLeft < 30 && secondsLeft > 0 && 'animate-pulse')}>
							<Counter doMillify={true} from={from} to={to} />
						</div>
					</motion.div>
				);
			}
		}
	};

	return (
		<>
			<motion.div className={cn('absolute w-[115%] h-[115%] -top-[7.5%] -left-[7.5%]')}>
				<div className={'rotate-180 absolute z-10 top-[8px] lg:top-[11px] left-1/2 -translate-x-1/2'}>
					<TriangleIcon fill={'#FFC800'} stroke={'#FFC800'} className={cn('text-secondary-foreground w-6 h-6 duration-300 delay-300 opacity-100')} />
				</div>

				<CircularProgressbar className={cn('opacity-100 duration-300', wheelState.data.state !== 'standby' && '!opacity-0')} styles={styles} value={progress} />
			</motion.div>

			{renderInside()}
		</>
	);
};

const BetCircleWinner: FC<{ player: Address; amount: number; percent: number; coef: string; win: number; loading?: boolean }> = ({
	player,
	amount,
	win,
	coef,
	loading,
}) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundCircle' });

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.5 }}
			className={cn('absolute flex flex-col items-center justify-center w-full h-full top-0 gap-2 duration-300', loading && 'blur-sm')}
		>
			<img alt={'crown'} src={Crown as string} />
			<div className={'z-10'}>
				<WinnerCard player={player} amount={amount} />
			</div>
			<div className={'flex flex-col items-center z-10'}>
				<BetValue className={'text-secondary-foreground text-xs'} iconClassName={'w-2.5 h-2.5'} value={win} withIcon />
				<div className={'flex items-center gap-1'}>
					<span className={'text-secondary-foreground'}>{coef}x</span> {t('win')}
				</div>
				<div className={'text-blue-500 text-xs'}>+ {t('bonus')}</div>
			</div>
		</motion.div>
	);
};

const RoundResult: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'roundCircle' });

	const { data: roundData, isLoading, isFetching } = useRound(round);

	const winner = useRoundWinner(round);

	const { address = ZeroAddress } = useAccount();
	if (isLoading || isFetching) return <Loader size={40} className={'animate-spin'} color={'white'} />;
	if (!roundData) return null;
	if (roundData.player.bets === 0n) {
		return (
			<>
				<div className={'text-xl font-semibold mb-4'}>{t('over')}</div>
				<div className={'w-full flex flex-row items-center justify-center gap-1'}>
					{t('couldWin')}
					<BetValue className={'text-secondary-foreground text-sm'} value={valueToNumber((roundData.total.volume * 935n) / 1000n)} withIcon />
				</div>
				<div className={'text-blue-500 text-xs'}>+ {t('bonus')}</div>
			</>
		);
	}

	if (winner?.player === address) {
		return (
			<>
				<div className={'text-xl font-semibold mb-4'}>{t('youWin')}</div>
				<div className={'w-full flex flex-row items-center justify-center gap-1'}>
					<BetValue className={'text-secondary-foreground text-lg font-semibold'} value={valueToNumber((roundData.total.volume * 935n) / 1000n)} withIcon />
				</div>
				<div className={'text-blue-500 text-sm flex flex-row items-center justify-center gap-1'}>
					{/*TODO: return bonus*/}+ {t('bonus')}
				</div>

				<div className={'text-muted-foreground text-xs mt-2'}>{t('total')}</div>
				<BetValue className={'text-secondary-foreground text-lg font-semibold'} value={valueToNumber((roundData.total.volume * 935n) / 1000n) + 20} withIcon />
			</>
		);
	}

	return (
		<>
			<div className={'text-xl font-semibold mb-4'}>{t('yourBonus')}</div>
			<div className={'text-blue-500 text-sm flex flex-row items-center justify-center gap-1'}>
				+<BetValue value={20} withIcon />
			</div>
		</>
	);
};

export const Counter: FC<{ from: number; to: number; doMillify?: boolean }> = ({ from, to, doMillify = false }) => {
	const nodeRef = useRef<HTMLParagraphElement | null>(null);

	function formatNumber(value: number) {
		if (value === 0) return '0';
		if (value < 1000) return value.toFixed(0);
		const formattedValue = millify(value, {
			precision: 3,
			lowercase: false,
		});

		const [number, unit] = formattedValue.split(/([a-zA-Z]+)/);

		const paddedNumber = number.length > 5 ? number.slice(0, 5) : number;

		return `${paddedNumber}${unit}`;
	}

	useEffect(() => {
		const node = nodeRef.current;

		if (node) {
			node.style.color = '#ffc800';
		}

		const controls = animate(from, to, {
			duration: 0.5,
			onUpdate(value) {
				if (node) {
					node.textContent = doMillify ? formatNumber(value) : Math.floor(value).toLocaleString();
				}
			},
		});

		controls.then(() => {
			if (node) {
				node.style.color = 'white';
			}
		});

		return () => controls.stop();
	}, [from, to]);

	return (
		<>
			<TooltipTrigger>
				<div className={'flex gap-1 lg:gap-2 items-center relative z-[10]'}>
					<Bet className={'text-secondary-foreground w-5 h-5 lg:w-7 lg:h-7'} />
					<div className={''} ref={nodeRef} />
				</div>
			</TooltipTrigger>

			<TooltipContent className={'font-semibold'}>{to.toLocaleString()} BET</TooltipContent>
		</>
	);
};
