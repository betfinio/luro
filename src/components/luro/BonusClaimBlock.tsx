import type { FC } from 'react';

import { ZeroAddress, valueToNumber } from '@betfinio/abi';
import { BetValue } from 'betfinio_app/BetValue';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useAvailableBonus, useClaimBonus } from '../../lib/query';

const BonusClaimBlock: FC = () => {
	const { t } = useTranslation('luro', { keyPrefix: 'bonusClaimBlock' });
	const { address = ZeroAddress } = useAccount();
	const { mutate: claim, isPending } = useClaimBonus();
	const { data: availableBonus = 0n } = useAvailableBonus(address);

	const handleClaim = async () => {
		if (availableBonus === 0n) return;
		claim();
	};
	return (
		<div className={'border border-gray-800 min-h-[100px] bg-primaryLight flex flex-row items-center justify-between rounded-xl p-4 mt-5 md:px-8'}>
			<div className={'flex flex-col items-start justify-between'}>
				<span className={'text-gray-400 text-sm'}>{t('available')}</span>
				<BetValue value={valueToNumber(availableBonus)} className={'text-blue-500 text-xl'} withIcon />
			</div>
			<button
				type={'button'}
				onClick={handleClaim}
				disabled={availableBonus === 0n || isPending}
				className={
					'px-4 py-2 min-w-[100px] rounded-lg border border-yellow-400 hover:bg-yellow-400 hover:text-black duration-300 disabled:grayscale disabled:cursor-not-allowed'
				}
			>
				{t('claim')}
			</button>
		</div>
	);
};

export default BonusClaimBlock;
