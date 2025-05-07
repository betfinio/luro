import type { LuroInterval } from './lib/types.ts';

export const PARTNER = import.meta.env.PUBLIC_PARTNER_ADDRESS;
export const ETHSCAN = import.meta.env.PUBLIC_ETHSCAN;
export const LURO = import.meta.env.PUBLIC_LUCKY_ROUND_ADDRESS;
export const LURO_5MIN = import.meta.env.PUBLIC_LUCKY_ROUND_5MIN_ADDRESS;
export const BETS_MEMORY = import.meta.env.PUBLIC_BETS_MEMORY_ADDRESS;
export const PUBLIC_BRANCH = import.meta.env.PUBLIC_BRANCH;
export const PUBLIC_DEPLOYED = import.meta.env.PUBLIC_DEPLOYED;

export const STAKING_FEE = 36n;
export const BONUS_FEE = 50n;

export const NET_COEF = 1000n - STAKING_FEE - BONUS_FEE;

export const types: LuroInterval[] = ['5m', '1d'];
