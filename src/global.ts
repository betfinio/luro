import type { Address } from 'viem';
import type { LuroInterval } from './lib/types.ts';

export const PARTNER: Address = import.meta.env.PUBLIC_PARTNER_ADDRESS as Address;
export const ETHSCAN: string = import.meta.env.PUBLIC_ETHSCAN as string;
export const LURO: Address = import.meta.env.PUBLIC_LUCKY_ROUND_ADDRESS as Address;
export const LURO_5MIN: Address = import.meta.env.PUBLIC_LUCKY_ROUND_5MIN_ADDRESS as Address;
export const BETS_MEMORY: Address = import.meta.env.PUBLIC_BETS_MEMORY_ADDRESS as Address;

export const STAKING_FEE = 36n;
export const BONUS_FEE = 50n;

export const NET_COEF = 1000n - STAKING_FEE - BONUS_FEE;

export const types: LuroInterval[] = ['5m', '1d'];

export const ASSETS_IPFS_BASE_URL = 'https://ipfs.io/ipfs/bafybeie2rznelu7cvml7divpm2e57rngvzjobhq55yrtvzk3ajizbl2y6y';
