import { ZeroAddress } from '@betfinio/abi';
import type { FC } from 'react';

import { NET_COEF } from '@/src/global';
import { useRound } from '@/src/lib/query';
import { usePlayerRoundInfo, useRoundBank, useRoundBets, useRoundBonusShare, useRoundWinner } from '@/src/lib/query';
import { valueToNumber } from '@betfinio/abi';
import { BetValue } from '@betfinio/components';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { BackToGameButton } from '../BackToGameButton';

export const RoundResultScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	const { data: roundData } = useRound(round);
	const { address = ZeroAddress } = useAccount();

	const { data: bets = [] } = useRoundBets(round);
	const { data: volume = 0n } = useRoundBank(round);
	const { data: bonusShare = 0n } = useRoundBonusShare(round);
	const { data: playerInfo = { bets: 0, volume: 0n } } = usePlayerRoundInfo(BigInt(round));

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

	if (!roundData) return null;

	if (playerInfo.bets === 0) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.3 }}
				className={'grow flex flex-col gap-5 items-center justify-center min-h-[290px] md:min-h-[390px]'}
			>
				<div className={'flex flex-col w-3/4 h-[200px] items-center justify-center border rounded-[10px] border-secondary-foreground'}>
					<div className={'text-xl font-semibold mb-4'}>{t('over')}</div>
					<div className={'w-full flex flex-row items-center justify-center gap-1'}>
						{t('couldWin')}
						<BetValue className={'text-secondary-foreground text-sm'} value={valueToNumber((roundData.total.volume * NET_COEF) / 1000n)} withIcon />
					</div>
					<div className={'text-bonus text-xs'}>+ {t('bonus')}</div>
				</div>

				<BackToGameButton />
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
				<div className={'flex flex-col w-3/4 h-[200px] items-center justify-center border rounded-[10px] border-secondary-foreground'}>
					<div className={'text-xl font-semibold mb-4'}>{t('youWin')}</div>
					<div className={'w-full flex flex-row items-center justify-center gap-1'}>
						<BetValue
							className={'text-secondary-foreground text-lg font-semibold'}
							value={valueToNumber((roundData.total.volume * NET_COEF) / 1000n)}
							withIcon
						/>
					</div>
					<div className={'text-bonus text-sm flex flex-row items-center justify-center gap-1'}>
						+bonus <BetValue value={bonus?.bonus || 0} withIcon />
					</div>

					<div className={'text-muted-foreground text-xs mt-2'}>{t('total')}</div>
					<BetValue
						className={'text-secondary-foreground text-lg font-semibold'}
						value={valueToNumber((roundData.total.volume * NET_COEF) / 1000n) + (bonus?.bonus ?? 0)}
						withIcon
					/>
				</div>

				<BackToGameButton />
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
			<div className={'flex flex-col w-3/4 h-[200px] items-center justify-center border rounded-[10px] border-secondary-foreground'}>
				<div className={'text-xl font-semibold mb-4'}>{t('yourBonus')}</div>
				<div className={'text-bonus text-sm flex flex-row items-center justify-center gap-1'}>
					+<BetValue value={bonus?.bonus ?? 0} withIcon />
				</div>
			</div>

			<BackToGameButton />
		</motion.div>
	);
};
