import type { Address } from 'viem';
import type { LuroInterval } from './lib/types.ts';

export const PARTNER: Address = import.meta.env.PUBLIC_PARTNER_ADDRESS as Address;
export const ETHSCAN: string = import.meta.env.PUBLIC_ETHSCAN as string;
export const LURO: Address = import.meta.env.PUBLIC_LUCKY_ROUND_ADDRESS as Address;
export const LURO_5MIN: Address = import.meta.env.PUBLIC_LUCKY_ROUND_5MIN_ADDRESS as Address;
export const CORE: Address = import.meta.env.PUBLIC_CORE_ADDRESS as Address;
export const LURO_STRATEGY: Address = import.meta.env.PUBLIC_LUCKY_ROUND_STRATEGY_ADDRESS as Address;
export const LURO_5MIN_STRATEGY: Address = import.meta.env.PUBLIC_LUCKY_ROUND_5MIN_STRATEGY_ADDRESS as Address;

export const types: LuroInterval[] = ['210s']; // '1d' hidden

export const ASSETS_IPFS_BASE_URL = 'https://ipfs.io/ipfs/bafybeie2rznelu7cvml7divpm2e57rngvzjobhq55yrtvzk3ajizbl2y6y';
