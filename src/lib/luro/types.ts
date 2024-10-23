import type { Address } from 'viem';

export type LuroBet = {
	player: Address;
	address: Address;
	amount: bigint;
};

export type LuroAuthor = LuroBet & {
	betsNumber: number;
};

export interface WheelStandBy {
	state: 'standby';
}

export interface WheelWaitingForBlock {
	state: 'waiting';
}

export interface WheelSpinning {
	state: 'spinning';
}

export interface WheelLanded {
	state: 'landed';
	round: number;
	winnerOffset: number;
	bet: string;
}

export interface WheelStopped {
	state: 'stopped';
	result: number;
	bet: string;
}

export type WheelState = WheelSpinning | WheelLanded | WheelStandBy | WheelWaitingForBlock | WheelStopped;

export interface Round {
	round: number;
	total: {
		volume: bigint;
		bets: bigint;
		bonus: bigint;
		staking: bigint;
	};
	player: {
		bets: bigint;
		volume: bigint;
		bonus: bigint;
	};
	status: RoundStatusEnum;
	winner?: WinnerInfo;
	winnerOffset?: bigint;
	address: Address;
}

export interface WinnerInfo {
	bet: Address;
	offset: number;
	player: Address;
	tx: Address;
	round: number;
}

export interface RoundModalPlayer {
	player: Address;
	count: number;
	volume: bigint;
	win: bigint;
	bonus: bigint;
}

export enum RoundStatusEnum {
	Pending = 0,
	Spinning = 1,
	Finished = 2,
}
export interface PlaceBetParams {
	round: number;
	amount: number;
	player: Address;
	address: Address;
}

export interface BonusClaimParams {
	player: Address;
	address: Address;
}

export interface CustomLuroBet {
	id: Address;
	label: Address;
	value: number;
	color: string;
	betsNumber?: number;
}
