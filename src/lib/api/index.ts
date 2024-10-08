import { TOKEN } from '@/src/globals.ts';
import { TokenContract } from '@betfinio/abi';
import { type Config, readContract } from '@wagmi/core';
import type { Address } from 'viem';

/**
 *  Example of function that reads data from blockchain
 */

export const fetchBalance = async (address: Address, config: Config): Promise<bigint> => {
	return (await readContract(config, {
		address: TOKEN,
		abi: TokenContract.abi,
		functionName: 'balanceOf',
		args: [address],
	})) as bigint;
};
