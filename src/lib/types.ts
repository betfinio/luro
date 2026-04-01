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
	spinRequestedAt?: number;
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
	};
	status: RoundStatusEnum;
	address: Address;
	winnerOffset?: bigint;
	winnerAddress?: Address;
	winnerPayout?: bigint;
}

export interface PlayerRoundInfo {
	bets: number;
	volume: bigint;
}

export interface WinnerInfo {
	bet: Address;
	offset: number;
	player: Address;
	tx: Address;
	round: number;
	payout: bigint;
}

export interface RoundModalPlayer {
	player: Address;
	count: number;
	volume: bigint;
	win: bigint;
}

export enum RoundStatusEnum {
	None = 0,
	Open = 1,
	SpinRequested = 2,
	ResultReady = 3,
	Settled = 4,
	Cancelled = 5,
}

export interface PlaceBetParams {
	round: number;
	amount: number;
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

export type LuroInterval = '1d' | '5m';
