import logger from '@/src/config/logger';
import { ZeroAddress, valueToNumber } from '@betfinio/abi';
import { createFileRoute } from '@tanstack/react-router';
import { useBalance } from 'betfinio_app/lib/query/token';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

export const Route = createFileRoute('/')({
	component: () => <Index />,
});

function Index() {
	const { t } = useTranslation('luro');
	const { address = ZeroAddress } = useAccount();
	const { data: balance = 0n } = useBalance(address);
	logger.success('Hello, world!');
	return (
		<div className={'border border-red-roulette px-4 py-2 rounded-md text-white h-full'}>
			{t('title')}
			<div className={'border border-yellow-400 p-4'}>Your balance: {valueToNumber(balance)} POL</div>
		</div>
	);
}
