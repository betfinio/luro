import { BonusChart } from '@/src/components/luro/BonusChart.tsx';
import { ZeroAddress, valueToNumber } from '@betfinio/abi';
import { BetValue } from '@betfinio/components/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@betfinio/components/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleHelp } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useRoundBank, useRoundBets, useRoundBonusShare, useVisibleRound } from '../../lib/query';

export const BonusInfo = () => {
	const { t } = useTranslation('luro');
	const { data: round } = useVisibleRound();
	const { data: bets = [] } = useRoundBets(round);
	const { data: volume = 0n } = useRoundBank(round);
	const { data: bonusShare = 0n } = useRoundBonusShare(round);
	const { address = ZeroAddress } = useAccount();

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
	}, [bets, volume, address]);

	const myBonus = bonuses.reduce((acc, { bonus, bet }) => acc + (bet.player.toLowerCase() === address.toLowerCase() ? bonus : 0), 0);

	return (
		<AnimatePresence>
			<Tooltip>
				<motion.div initial={{ opacity: 0, y: -100 }} animate={{ opacity: 1, y: 0 }}>
					<div className={'flex items-center justify-between'}>
						<h1 className={'flex gap-1 my-2 text-lg font-semibold'}>
							{t('bonusInfo.title')}
							<span className={'text-secondary-foreground'}>
								<BetValue value={myBonus} precision={2} withIcon={true} />
							</span>
						</h1>
						<TooltipTrigger>
							<CircleHelp className={'text-secondary-foreground'} width={24} />
						</TooltipTrigger>
						<TooltipContent className={'border border-secondary-foreground rounded-lg bg-opacity-75 py-2 px-3'}>
							{/*todo: extract description*/}
							<div className={'text-sm italic'}>
								<div className={'text-center'}>
									The bonus represents <span className={'text-secondary-foreground'}>5%</span> of all bets{' '}
									<span className={'text-secondary-foreground'}>({valueToNumber(volume).toLocaleString()} BET)</span> that are split among players according to{' '}
									<span className={'text-secondary-foreground'}>order</span> and <span className={'text-secondary-foreground'}>size</span> of bets.
								</div>
								<div className={'text-center font-semibold text-secondary-foreground'}>{t('bonusInfo.info')}</div>
								<div className={'text-center font-semibold'}>{t('bonusInfo.everyPlayer')}</div>
							</div>
						</TooltipContent>
					</div>
					<div className={'bg-background-light rounded-xl p-4 border-border border'}>
						<div className={'relative'}>
							<div className={'lg:px-20 relative z-10'}>
								<BonusChart bonuses={bonuses} />
							</div>
							<div className={'hidden lg:block absolute bottom-0 w-full'}>
								<div className={'flex justify-between text-violet-500 text-xs font-semibold'}>
									<div className={'flex flex-col'}>
										<span>{t('bonusInfo.firstBet')}</span>
										<span className={'text-[10px] text-gray-500'}>
											{t('bonusInfo.coefficient')} x{bets.length}
										</span>
									</div>
									<div className={'flex flex-col'}>
										<span>{t('bonusInfo.lastBet')}</span>
										<span className={'text-[10px] text-gray-500'}>{t('bonusInfo.coefficient')} x1</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			</Tooltip>
		</AnimatePresence>
	);
};
