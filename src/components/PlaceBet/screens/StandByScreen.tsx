import { valueToNumber, ZeroAddress } from '@betfinio/abi';
import { useMediaQuery } from '@betfinio/components/hooks';
import { Bet, LuckyRound } from '@betfinio/components/icons';
import { cn } from '@betfinio/components/lib';
import { type NumberFormatValues, NumericInput, Slider, Tooltip, TooltipContent, TooltipTrigger } from '@betfinio/components/ui';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAllowanceModal } from 'betfinio_context/lib/context';
import { useAllowance, useBalance, useIsMember } from 'betfinio_context/lib/query';
import { addressToColor } from 'betfinio_context/lib/utils';
import { Loader } from 'lucide-react';
import millify from 'millify';
import { motion } from 'motion/react';
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { ASSETS_IPFS_BASE_URL } from '@/src/global';
import { hexToRgbA, useLuroAddress } from '@/src/lib';
import { getCurrentRoundInfo } from '@/src/lib/api';
import { usePlaceBet, useRoundBets } from '@/src/lib/query';

export const StandByScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });
	const [amount, setAmount] = useState<string>('10000');
	const { address = ZeroAddress } = useAccount();
	const { data: allowance = 0n } = useAllowance(address);
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
	const handleBetChange = (values: NumberFormatValues) => {
		const { value } = values;
		setAmount(value);
	};
	const luroAddress = useLuroAddress();

	const handleBet = () => {
		if (address === ZeroAddress) {
			toast.error(t('toast.connect'));
			return;
		}
		if (!isMember) {
			toast.error(t('toast.notMember'));
			return;
		}
		if (amount === '') {
			toast.error(t('toast.amount'));
			return;
		}
		if (Number(amount) < 1000) {
			toast.error(t('toast.minimalBet'));
			return;
		}

		try {
			parseEther(amount);
		} catch {
			toast.error(t('toast.invalidAmount'));
			return;
		}

		if (allowance < parseEther(amount)) {
			requestAllowance?.('bet', parseEther(amount));
			return;
		}
		placeBet({ round: round, amount: Number(amount), player: address, address: luroAddress });
	};

	const myBetVolume = useMemo(() => {
		return bets.filter((bet) => bet.player === address).reduce((acc, val) => acc + val.amount, 0n);
	}, [bets, address]);

	const roundInfo = useMemo(() => {
		return getCurrentRoundInfo(bets);
	}, [bets]);

	const bank = useMemo(() => bets.reduce((acc, val) => acc + val.amount, 0n), [bets, address]);
	const expectedWinning = valueToNumber(bank) + Number(amount) - valueToNumber(myBetVolume);
	const coef = expectedWinning / Number(amount);

	const myPercent = roundInfo.volume === 0 ? 0 : ((valueToNumber(myBetVolume) / roundInfo.volume) * 100).toFixed(2);
	const potentialWin = roundInfo.volume;
	const myCoef = myBetVolume === 0n ? 0 : potentialWin / valueToNumber(myBetVolume);

	const [hovering, setHovering] = useState(false);
	const { isMobile } = useMediaQuery();

	const compiledShadow = useMemo(() => {
		const color = addressToColor(address);
		const rgba = hexToRgbA(color);
		if (!rgba) return '';
		return `drop-shadow(0 0px ${hovering ? 45 : 25}px ${rgba}`;
	}, [address, hovering]);

	const handleSliderChange = (value: number) => {
		setAmount(value.toFixed(0));
	};

	// Логика для определения параметров слайдера в зависимости от баланса
	const sliderParams = useMemo(() => {
		const balanceNumber = valueToNumber(balance);
		if (balanceNumber <= 1000) {
			return {
				min: 0,
				max: 100,
				value: 0,
			};
		}
		return {
			min: 1000,
			max: balanceNumber - 1,
			value: Number(amount),
		};
	}, [balance, amount]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={'flex flex-col grow justify-between duration-300 lg:max-w-[300px]'}
		>
			<div className={'hidden uppercase text-xl items-center justify-center w-full font-semibold gap-2 z-5 my-2 sm:flex'}>
				{t('title')}
				<LuckyRound className={'w-5 h-5 text-secondary-foreground'} />
			</div>
			<div
				onMouseEnter={() => {
					setHovering(true);
				}}
				onMouseLeave={() => {
					setHovering(false);
				}}
				style={{ filter: isMobile ? '' : compiledShadow }}
				className={cn('rounded-xl bg-background-light border-border border p-4 relative w-full duration-300')}
			>
				<h4 className={'font-medium text-center text-gray-500 text-xs '}>{t('amount')}</h4>
				<div className={'flex items-center gap-2 mt-2'}>
					<NumericInput
						className={'border-secondary-foreground text-white'}
						scale="lg"
						placeholder={t('placeholder.Amount')}
						hasError={address !== ZeroAddress && parseEther(amount) > balance}
						value={amount}
						onValueChange={handleBetChange}
					/>

					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={handleBet}
						whileHover={{ scale: 1.03 }}
						disabled={Number(amount) === 0 || isPending || balance < parseEther(amount)}
						className={
							'text-xs font-semibold flex flex-col hover:scale-110 items-center justify-center text-center w-full h-[50px] bg-primary rounded-lg text-primary-foreground disabled:grayscale disabled:pointer-events-none duration-300 sm:hidden'
						}
					>
						{isPending ? (
							<Loader size={30} color={'black'} className={'animate-spin'} />
						) : (
							<span className={'flex flex-row items-center text-base uppercase'}>
								{t('bet')}
								<DotLottieReact
									src={`${ASSETS_IPFS_BASE_URL}/lightning-bolt.lottie`}
									autoplay={true}
									style={{ width: '16px', height: '16px', bottom: 0, left: 0 }}
								/>
							</span>
						)}
					</motion.button>
				</div>

				<div className={cn('relative mt-4 h-[24px]', balance === 0n && 'grayscale pointer-events-none')}>
					<Slider
						min={sliderParams.min}
						max={sliderParams.max}
						value={[balance > 0n ? sliderParams.value : 0]}
						defaultValue={[sliderParams.value]}
						disabled={balance <= 0n}
						onValueChange={(value: number[]) => {
							handleSliderChange(value[0]);
						}}
					/>
				</div>

				<h4 className={'font-medium text-gray-500 text-xs text-center mt-[10px] hidden sm:block'}>{t('expected')}</h4>
				<p className={'mt-1 md:mt-5 text-center font-semibold text-secondary-foreground'}>
					<span className={'text-white flex justify-center items-center gap-1'}>
						<span className={'sm:hidden'}>{t('win')}:</span>
						{expectedWinning.toLocaleString()}
						<Bet className={'text-secondary-foreground'} />
					</span>
				</p>
				<div className={'text-center text-secondary-foreground font-thin text-xs'}>
					{(coef === Number.POSITIVE_INFINITY || Number.isNaN(coef) ? 0 : coef).toFixed(3)}x
				</div>
				<motion.button
					whileTap={{ scale: 0.95 }}
					onClick={handleBet}
					whileHover={{ scale: 1.03 }}
					disabled={Number(amount) === 0 || isPending || valueToNumber(balance) < Number(amount)}
					className={
						'hidden text-xs font-semibold flex-col items-center justify-center text-center w-full h-[40px] bg-primary mt-[30px] min-w-[210px] rounded-lg text-primary-foreground disabled:grayscale disabled:pointer-events-none duration-300 sm:flex'
					}
				>
					{isPending ? (
						<Loader size={30} color={'black'} className={'animate-spin'} />
					) : (
						<span className={'flex flex-row items-center text-base uppercase'}>
							{t('bet')}
							<DotLottieReact
								src={`${ASSETS_IPFS_BASE_URL}/lightning-bolt.lottie`}
								autoplay={true}
								style={{ width: '16px', height: '16px', bottom: 0, left: 0 }}
							/>
						</span>
					)}
				</motion.button>
			</div>

			<div className={cn('block rounded-xl bg-background-light p-3 relative w-full lg:w-full mt-3 border-border border')}>
				<div className={'grid grid-cols-2 gap-2 text-xs'}>
					<div className={'bg-background py-2 text-center flex flex-col gap-1 rounded-[8px]'}>
						<div className={'text-gray-500'}>{t('activeBets')}</div>
						<Tooltip>
							<div className={'text-secondary-foreground font-semibold flex justify-center gap-1'}>
								<TooltipTrigger>
									{millify(valueToNumber(myBetVolume))} ({myPercent}%)
								</TooltipTrigger>
								<TooltipContent className={'font-semibold'}>{myBetVolume > 0 && valueToNumber(myBetVolume).toLocaleString()}</TooltipContent>
							</div>
						</Tooltip>
					</div>
					<div className={'bg-background py-2 text-center flex flex-col gap-1 rounded-[8px]'}>
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
