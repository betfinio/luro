import { cn } from '@betfinio/components/lib';
import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ETHSCAN } from '@/src/global.ts';
import { useLuroFee } from '@/src/lib/query';

export const FeeNotice: FC<{ className?: string }> = ({ className }) => {
	const { data } = useLuroFee();
	const { t } = useTranslation('luro');

	if (!data) return null;

	const feePercent = Number(data.feeBps) / 100;
	const poolUrl = `${ETHSCAN}/address/${data.liquidityPool}`;

	return (
		<div className={cn('text-center text-sm text-gray-400 py-2', className)}>
			<Trans
				t={t}
				i18nKey="feeStaking"
				values={{ fee: feePercent }}
				components={{
					b: <strong className="text-white" />,
					// biome-ignore lint/a11y/useAnchorContent: content is injected by Trans component
					link: <a href={poolUrl} target="_blank" rel="noreferrer" className="underline hover:opacity-80" />,
				}}
			/>
		</div>
	);
};
