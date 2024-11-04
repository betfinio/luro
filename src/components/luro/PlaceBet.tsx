import Lambo from '@/src/assets/stickers/lambo.json';
import Throw from '@/src/assets/stickers/throw.json';
import { LURO, LURO_5MIN } from '@/src/global.ts';
import { hexToRgbA, jumpToCurrentRound } from '@/src/lib/luro';
import { getCurrentRoundInfo } from '@/src/lib/luro/api';
import {
	useLuroState,
	usePlaceBet,
	useRound,
	useRoundBank,
	useRoundBets,
	useRoundBonusShare,
	useRoundRequested,
	useRoundWinner,
	useStartRound,
	useVisibleRound,
} from '@/src/lib/luro/query';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { ZeroAddress, valueToNumber } from '@betfinio/abi';
import { LuckyRound } from '@betfinio/ui/dist/icons/LuckyRound';
import { Player } from '@lottiefiles/react-lottie-player';
import { useQueryClient } from '@tanstack/react-query';
import { BetValue } from 'betfinio_app/BetValue';
import { useAllowanceModal } from 'betfinio_app/allowance';
import { useIsMember } from 'betfinio_app/lib/query/pass';
import { useAllowance, useBalance } from 'betfinio_app/lib/query/token';
import { addressToColor } from 'betfinio_app/lib/utils';
import { Slider } from 'betfinio_app/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from 'betfinio_app/tooltip';
import { toast } from 'betfinio_app/use-toast';
import cx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Loader } from 'lucide-react';
import millify from 'millify';
import { type FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import { useMediaQuery } from 'react-responsive';
import { useAccount } from 'wagmi';

export const PlaceBet = () => {
	const { data: round } = useVisibleRound();

	const { state: luroState } = useLuroState(round);

	const renderScreen = () => {
		switch (luroState.data.state) {
			case 'waiting':
				return <WaitingScreen round={round} />;
			case 'spinning':
			case 'landed':
				return <SpinningScreen round={round} />;
			case 'stopped':
				return <RoundResult round={round} />;
			default:
				return <StandByScreen round={round} />;
		}
	};

	return <AnimatePresence>{renderScreen()}</AnimatePresence>;
};

const StandByScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });
	const [amount, setAmount] = useState<string>('10000');
	const { interval } = Route.useParams();
	const { address = ZeroAddress } = useAccount();
	const { data: allowance = 0n, isFetching: loading } = useAllowance(address);
	const { data: balance = 0n } = useBalance(address);
	const { data: isMember = false } = useIsMember(address);
	const { mutate: placeBet, isPending, isSuccess, data } = usePlaceBet();
	const { data: bets = [] } = useRoundBets(round);
	const { requestAllowance, setResult, requested } = useAllowanceModal();
	useEffect(() => {
		if (data && isSuccess) {
			setResult?.(data);
		}
	}, [isSuccess, data]);
	useEffect(() => {
		if (requested) {
			handleBet();
		}
	}, [requested]);
	const handleBetChange = (value: string) => {
		setAmount(value);
		const percentage = Math.floor((Number(value) / valueToNumber(balance)) * 100);
		setBetPercentage(percentage > 100 ? 100 : percentage);
	};

	const handleBet = () => {
		if (address === ZeroAddress) {
			toast({
				description: t('toast.connect'),
				variant: 'destructive',
			});
			return;
		}
		if (!isMember) {
			toast({
				description: t('toast.notMember'),
				variant: 'destructive',
			});
			return;
		}
		if (amount === '') {
			toast({
				description: t('toast.amount'),
				variant: 'destructive',
			});
			return;
		}
		if (Number(amount) < 1000) {
			toast({
				title: t('toast.minimalBet'),
				description: '',
				variant: 'destructive',
			});
			return;
		}

		try {
			BigInt(Number(amount));
		} catch (e) {
			toast({
				title: t('toast.invalidAmount'),
				description: '',
				variant: 'destructive',
			});
			return;
		}

		console.log(allowance, BigInt(Number(amount)) * 10n ** 18n);
		if (allowance < BigInt(Number(amount)) * 10n ** 18n) {
			requestAllowance?.('bet', BigInt(Number(amount)) * 10n ** 18n);
			return;
		}
		const luro = interval === '1d' ? LURO : LURO_5MIN;
		placeBet({ round: round, amount: Number(amount), player: address, address: luro });
	};

	const myBetVolume = useMemo(() => {
		return bets.filter((bet) => bet.player === address).reduce((acc, val) => acc + val.amount, 0n);
	}, [bets, address]);

	const roundInfo = useMemo(() => {
		return getCurrentRoundInfo(bets);
	}, [bets]);

	const bank = useMemo(() => bets.reduce((acc, val) => acc + val.amount, 0n), [bets, address, round]);
	const expectedWinning = (valueToNumber(bank) + Number(amount) - valueToNumber(myBetVolume)) * 0.914;
	const coef = expectedWinning / Number(amount);

	const myPercent = roundInfo.volume === 0 ? 0 : ((valueToNumber(myBetVolume) / roundInfo.volume) * 100).toFixed(2);
	const potentialWin = roundInfo.volume * 0.914;
	const myCoef = myBetVolume === 0n ? 0 : potentialWin / valueToNumber(myBetVolume);

	const [hovering, setHovering] = useState(false);
	const isMobile = useMediaQuery({ query: '(max-width: 640px)' });

	const compiledShadow = useMemo(() => {
		const color = addressToColor(address);
		const rgba = hexToRgbA(color);
		if (!rgba) return '';
		return `drop-shadow(0 0px ${hovering ? 45 : 25}px ${rgba}`;
	}, [address, hovering]);

	const [betPercentage, setBetPercentage] = useState(30);

	const handleSliderChange = (value: number) => {
		setBetPercentage(Math.floor((value / valueToNumber(balance)) * 100));
		setAmount(value.toFixed(0));
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'flex flex-col grow justify-between duration-300 lg:max-w-[300px]'}
		>
			<div className={'hidden uppercase text-xl items-center justify-center w-full font-semibold gap-2 z-10 my-2 ' + 'sm:flex'}>
				{t('title')}
				<LuckyRound className={'w-5 h-5 text-yellow-400'} />
			</div>
			<div
				onMouseEnter={() => {
					setHovering(true);
				}}
				onMouseLeave={() => {
					setHovering(false);
				}}
				style={{ filter: isMobile ? '' : compiledShadow }}
				className={cx('rounded-xl bg-primaryLight border border-gray-800 p-4 relative w-full duration-300')}
			>
				<h4 className={'font-medium text-center text-gray-500 text-xs '}>{t('amount')}</h4>
				<div className={'flex items-center gap-2 mt-2'}>
					<NumericFormat
						className={cx(
							'w-full rounded-lg border border-yellow-400 text-center text-base lg:text-lg bg-primary py-3 font-semibold text-white disabled:cursor-not-allowed duration-300',
							valueToNumber(balance) < Number(amount) && 'text-red-400',
						)}
						thousandSeparator={','}
						min={1}
						allowNegative={false}
						maxLength={15}
						disabled={loading}
						placeholder={valueToNumber(balance) < Number(amount) ? t('placeholder.balance') : t('placeholder.Amount')}
						value={amount}
						onValueChange={(values) => {
							const { value } = values;
							handleBetChange(value);
						}}
					/>

					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={handleBet}
						whileHover={{ scale: 1.03 }}
						disabled={Number(amount) === 0 || isPending || valueToNumber(balance) < Number(amount)}
						className={
							'text-xs font-semibold flex flex-col hover:scale-110 items-center justify-center text-center w-full h-[50px] bg-[#FFC800] rounded-lg text-primary disabled:grayscale disabled:pointer-events-none duration-300 ' +
							'sm:hidden'
						}
					>
						{isPending ? (
							<Loader size={30} color={'black'} className={'animate-spin'} />
						) : (
							<span className={'flex flex-row items-center gap-1 text-base uppercase'}>
								{t('bet')}
								<Coins className={'text-black w-4'} />
							</span>
						)}
					</motion.button>
				</div>

				<div className={cx('relative mt-4 h-[24px]', balance === 0n && 'grayscale pointer-events-none')}>
					<Slider
						min={1000}
						max={valueToNumber(balance) - 1}
						value={[amount]}
						defaultValue={[10000]}
						onValueChange={(value: number[]) => {
							handleSliderChange(value[0]);
						}}
					/>
				</div>

				<h4 className={'font-medium text-gray-500 text-xs text-center mt-[10px] hidden sm:block'}>{t('expected')}</h4>
				<p className={'mt-1 md:mt-[20px] text-center font-semibold text-yellow-400'}>
					<span className={'text-white'}>
						<span className={'sm:hidden'}>{t('win')}:</span>
					</span>{' '}
					{expectedWinning.toLocaleString()} <span className={'text-blue-500'}>+{t('bonus')}</span>
				</p>
				<div className={'text-center text-yellow-400 font-thin text-xs'}>
					{(coef === Number.POSITIVE_INFINITY || Number.isNaN(coef) ? 0 : coef).toFixed(3)}x
				</div>
				<motion.button
					whileTap={{ scale: 0.95 }}
					onClick={handleBet}
					whileHover={{ scale: 1.03 }}
					disabled={Number(amount) === 0 || isPending || valueToNumber(balance) < Number(amount)}
					className={
						'hidden text-xs font-semibold flex-col hover:scale-110 items-center justify-center text-center w-full h-[40px] bg-[#FFC800] mt-[30px] min-w-[210px] rounded-lg text-primary disabled:grayscale disabled:pointer-events-none duration-300 ' +
						'sm:flex'
					}
				>
					{isPending ? (
						<Loader size={30} color={'black'} className={'animate-spin'} />
					) : (
						<span className={'flex flex-row items-center gap-1 text-base uppercase'}>
							{t('bet')}
							<Coins className={'text-black w-4'} />
						</span>
					)}
				</motion.button>
			</div>

			<div className={cx('block rounded-xl bg-primaryLight p-3 relative w-full lg:w-full mt-3 border border-gray-800')}>
				<div className={'grid grid-cols-2 gap-2 text-xs'}>
					<div className={'bg-primary py-2 text-center flex flex-col gap-1 rounded-[8px]'}>
						<div className={'text-gray-500'}>{t('activeBets')}</div>
						<Tooltip>
							<div className={'text-yellow-400 font-semibold flex justify-center gap-1'}>
								<TooltipTrigger>
									{millify(valueToNumber(myBetVolume))} ({myPercent}%)
								</TooltipTrigger>
								<TooltipContent className={'font-semibold'}>{myBetVolume > 0 && valueToNumber(myBetVolume).toLocaleString()}</TooltipContent>
							</div>
						</Tooltip>
					</div>
					<div className={'bg-primary py-2 text-center flex flex-col gap-1 rounded-[8px]'}>
						<div className={'text-gray-500'}>{t('potentialWin')}</div>
						<Tooltip>
							<div className={'text-green-500 font-semibold flex justify-center gap-1'}>
								<TooltipTrigger>{millify(potentialWin)}</TooltipTrigger>
								<TooltipContent className={'font-semibold'}>
									{`${potentialWin.toLocaleString()} BET`} <span className={'text-green-500'}>{myBetVolume > 0 && `(${myCoef.toFixed(2)}x)`}</span>
								</TooltipContent>
							</div>
						</Tooltip>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

const WaitingScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	const { mutate: startRound, isPending } = useStartRound(round);
	const { data: isRoundRequested } = useRoundRequested(round);

	const handleSpin = () => {
		startRound();
	};
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'grow relative min-h-[290px] md:min-h-[390px] flex items-center justify-center'}
		>
			<Player src={Throw} autoplay={true} loop={true} style={{ position: 'absolute', zIndex: 2, width: '100%', bottom: 0, left: 0 }} />
			<div className={'flex flex-col  justify-center items-center relative z-10 p-5 bg-primary bg-opacity-75'}>
				<div className={'flex items-end pb-4 gap-2 '}>
					<span className={'leading-[12px]'}>{t('waiting')}</span>
					<div className="relative w-[3px] h-[3px] rounded-[5px] dot-flashing" />
				</div>
				{!isRoundRequested && (
					<button
						type={'button'}
						onClick={handleSpin}
						disabled={isPending}
						className={'bg-yellow-400 disabled:bg-gray-500 rounded-lg px-6 py-2 text-black font-medium'}
					>
						{isPending ? t('spinning') : t('spinTheWheel')}
					</button>
				)}
			</div>
		</motion.div>
	);
};

const SpinningScreen: FC<{ round: number }> = () => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'grow flex flex-col items-center min-h-[390px] relative'}
		>
			<Player src={Lambo} autoplay={true} loop={true} style={{ position: 'absolute', width: '100%', bottom: 0, left: 0 }} />
			<div className={'flex items-end pb-4 mt-10 gap-2'}>
				<span className={'leading-[12px]'}>{t('winnerIsBeingDecided')}</span>
				<div className="relative w-[3px] h-[3px] rounded-[5px] dot-flashing" />
			</div>
		</motion.div>
	);
};

const RoundResult: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	const queryClient = useQueryClient();

	const { data: roundData } = useRound(round);
	const { address = ZeroAddress } = useAccount();

	const { data: bets = [] } = useRoundBets(round);
	const { data: volume = 0n } = useRoundBank(round);
	const { data: bonusShare = 0n } = useRoundBonusShare(round);

	const winner = useRoundWinner(round);

	const bonus = useMemo(() => {
		const bonuses = bets.map((bet, index) => {
			if (bonusShare === 0n) return { bet, bonus: 0 };
			const bonusPool = (volume / 100n) * 5n;
			const weight = bet.amount * BigInt(bets.length - index);
			return {
				bet,
				bonus: valueToNumber((bonusPool * weight) / bonusShare),
			};
		});
		return bonuses.find((bonus) => bonus?.bet?.address === winner?.address);
	}, [bets, volume, address]);

	const { interval } = Route.useParams();
	const luroAddress = interval === '1d' ? LURO : LURO_5MIN;

	if (!roundData) return null;

	if (roundData.player.bets === 0n) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.3 }}
				className={'grow flex flex-col gap-5 items-center justify-center min-h-[290px] md:min-h-[390px]'}
			>
				<div className={'flex flex-col w-3/4 h-[200px] items-center justify-center border rounded-[10px] border-yellow-400'}>
					<div className={'text-xl font-semibold mb-4'}>{t('over')}</div>
					<div className={'w-full flex flex-row items-center justify-center gap-1'}>
						{t('couldWin')}
						<BetValue className={'text-yellow-400 text-sm'} value={valueToNumber((roundData.total.volume * 935n) / 1000n)} withIcon />
					</div>
					<div className={'text-blue-500 text-xs'}>+ {t('bonus')}</div>
				</div>
				<motion.button
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					onClick={() => {
						jumpToCurrentRound(queryClient, luroAddress);
					}}
					exit={{ opacity: 0 }}
					transition={{ duration: 1, delay: 2 }}
					className={'w-3/4 bg-yellow-400 py-3 text-black rounded-[10px]'}
				>
					{t('backToGame')}
				</motion.button>
			</motion.div>
		);
	}

	if (winner?.player === address) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.3 }}
				className={'grow flex flex-col gap-5 items-center justify-center min-h-[290px] md:min-h-[390px]'}
			>
				<div className={'flex flex-col w-3/4 h-[200px] items-center justify-center border rounded-[10px] border-yellow-400'}>
					<div className={'text-xl font-semibold mb-4'}>{t('youWin')}</div>
					<div className={'w-full flex flex-row items-center justify-center gap-1'}>
						<BetValue className={'text-yellow-400 text-lg font-semibold'} value={valueToNumber((roundData.total.volume * 935n) / 1000n)} withIcon />
					</div>
					<div className={'text-blue-500 text-sm flex flex-row items-center justify-center gap-1'}>
						+bonus <BetValue value={bonus?.bonus || 0} withIcon />
					</div>

					<div className={'text-gray-400 text-xs mt-2'}>{t('total')}</div>
					<BetValue
						className={'text-yellow-400 text-lg font-semibold'}
						value={valueToNumber((roundData.total.volume * 935n) / 1000n) + (bonus?.bonus ?? 0)}
						withIcon
					/>
				</div>

				<motion.button
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					onClick={() => {
						jumpToCurrentRound(queryClient, luroAddress);
					}}
					exit={{ opacity: 0 }}
					transition={{ duration: 1, delay: 2 }}
					className={'w-3/4 bg-yellow-400 py-3 text-black rounded-[10px]'}
				>
					{t('backToGame')}
				</motion.button>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'grow flex flex-col gap-5 items-center justify-center min-h-[290px] md:min-h-[390px]'}
		>
			<div className={'flex flex-col w-3/4 h-[200px] items-center justify-center border rounded-[10px] border-yellow-400'}>
				<div className={'text-xl font-semibold mb-4'}>{t('yourBonus')}</div>
				<div className={'text-blue-500 text-sm flex flex-row items-center justify-center gap-1'}>
					+<BetValue value={bonus?.bonus ?? 0} withIcon />
				</div>
			</div>

			<motion.button
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 1, delay: 2 }}
				onClick={() => {
					jumpToCurrentRound(queryClient, luroAddress);
				}}
				className={'w-3/4 bg-yellow-400 py-3 text-black rounded-[10px]'}
			>
				{t('backToGame')}
			</motion.button>
		</motion.div>
	);
};
