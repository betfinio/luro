import { fetchBalance } from '@/src/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useConfig } from 'wagmi';

/**
 *  Example of hook that reads data from fetcher(api
 */

export const useBalance = (address: Address) => {
	const config = useConfig();
	return useQuery<bigint>({
		queryKey: ['template', 'balance', address],
		queryFn: () => fetchBalance(address, config),
	});
};
