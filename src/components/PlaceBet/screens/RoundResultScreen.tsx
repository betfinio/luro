import { valueToNumber, ZeroAddress } from '@betfinio/abi';
import { BetValue } from '@betfinio/components';
import { motion } from 'motion/react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { usePlayerRoundInfo, useRound, useRoundBank, useRoundWinner } from '@/src/lib/query';
import { BackToGameButton } from '../BackToGameButton';

export const RoundResultScreen: FC<{ round: number }> = ({ round }) => {
	const { t } = useTranslation('luro', { keyPrefix: 'placeBet' });

	const { data: roundData } = useRound(round);
	const { address = ZeroAddress } = useAccount();

	const { data: volume = 0n } = useRoundBank(round);
	const { data: playerInfo = { bets: 0, volume: 0n } } = usePlayerRoundInfo(BigInt(round));

	const winner = useRoundWinner(round);

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
						<BetValue className={'text-secondary-foreground text-sm'} value={valueToNumber(volume)} withIcon />
					</div>
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
					<BetValue className={'text-secondary-foreground text-lg font-semibold'} value={valueToNumber(volume)} withIcon />
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
				<div className={'text-xl font-semibold mb-4'}>{t('over')}</div>
			</div>

			<BackToGameButton />
		</motion.div>
	);
};
