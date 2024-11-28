import logger from '@/src/config/logger.ts';
import { LURO, LURO_5MIN } from '@/src/global.ts';
import { type LuroInterval, animateNewBet, getCurrentRound, handleError } from '@/src/lib';
import type { LuroBet, PlaceBetParams, Round, WheelState, WinnerInfo } from '@/src/lib/types.ts';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { LuckyRoundContract, ZeroAddress } from '@betfinio/abi';
import { toast } from '@betfinio/components/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type WriteContractReturnType, readContract } from '@wagmi/core';
import { getTransactionLink } from 'betfinio_app/helpers';
import { useTranslation } from 'react-i18next';
import type { Address, WriteContractErrorType } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import { useAccount, useConfig, useWatchContractEvent } from 'wagmi';
import {
	calculateRound,
	claimBonus,
	distributeBonus,
	fetchAvailableBonus,
	fetchBetsCount,
	fetchBonusDistribution,
	fetchRound,
	fetchRoundBets,
	fetchRounds,
	fetchRoundsByPlayer,
	fetchTotalVolume,
	getRoundWinnerByOffset,
	placeBet,
	startRound,
} from '../api';
import { fetchWinner, fetchWinners } from '../gql';

export const useObserveBet = (round: number) => {
	const queryClient = useQueryClient();
	const resetObservedBet = () => {
		queryClient.setQueryData(['luro', address, 'bets', 'newBet'], ZeroAddress);
	};
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	const query = useQuery<{ address: Address; strength: number }>({
		queryKey: ['luro', address, 'bets', 'newBet'],
		initialData: { address: ZeroAddress, strength: 0 },
	});

	const luro = interval === '1d' ? LURO : LURO_5MIN;
	useWatchContractEvent({
		abi: LuckyRoundContract.abi,
		address: luro,
		eventName: 'BetCreated',
		args: {
			round: BigInt(round),
		},
		onLogs: async (betLogs) => {
			// @ts-ignore
			animateNewBet(betLogs[0]?.args?.player ?? ZeroAddress, 10, queryClient, address);
			await queryClient.invalidateQueries({ queryKey: ['luro', luro, 'round'] });
			await queryClient.invalidateQueries({ queryKey: ['luro', luro, 'bets'] });
		},
	});

	return { query, resetObservedBet };
};

export const usePlaceBet = () => {
	const { t } = useTranslation('shared', { keyPrefix: 'errors' });
	const queryClient = useQueryClient();
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useMutation<WriteContractReturnType, WriteContractErrorType, PlaceBetParams>({
		mutationKey: ['luro', address, 'bets', 'place'],
		mutationFn: (params) => placeBet(params, config),
		onError: (e) => {
			toast({
				// @ts-ignore
				title: t('default'),
				variant: 'destructive',
				// @ts-ignore
				description: t(e.cause?.reason),
			});
		},
		onMutate: () => logger.log('placeBet'),
		onSuccess: async (data) => {
			const { update } = toast({
				title: 'Placing a bet',
				description: 'Transaction is pending',
				variant: 'loading',
				duration: 10000,
			});
			const receipt = await waitForTransactionReceipt(config.getClient(), { hash: data });

			if (receipt.status === 'reverted') {
				update({
					variant: 'destructive',
					description: '',
					title: 'Transaction failed',
					action: getTransactionLink(data),
					duration: 5000,
				});
				return;
			}
			update({ variant: 'default', description: 'Transaction is confirmed', title: 'Bet placed', action: getTransactionLink(data), duration: 5000 });
			await queryClient.invalidateQueries({ queryKey: ['luro', address, 'bets', 'round'] });
			await queryClient.invalidateQueries({ queryKey: ['luro', address, 'round'] });
		},
		onSettled: () => logger.log('placeBet settled'),
	});
};

export const useStartRound = (round: number) => {
	const queryClient = useQueryClient();
	const { t } = useTranslation('shared', { keyPrefix: 'errors' });
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;

	return useMutation<WriteContractReturnType, WriteContractErrorType>({
		mutationKey: ['luro', address, 'round', 'start'],
		mutationFn: () => startRound(address, round, config),
		onError: (e) => handleError(e, t),
		onMutate: () => logger.log('Start round'),
		onSuccess: async (data) => {
			const { update } = toast({
				title: 'Starting a round',
				description: 'Transaction is pending',
				variant: 'loading',
				duration: 10000,
			});
			const receipt = await waitForTransactionReceipt(config.getClient(), { hash: data });

			if (receipt.status === 'reverted') {
				update({
					variant: 'destructive',
					description: '',
					title: 'Transaction failed',
					action: getTransactionLink(data),
					duration: 5000,
				});
				return;
			}
			update({ variant: 'default', description: 'Transaction is confirmed', title: 'Round requested', action: getTransactionLink(data), duration: 5000 });
			queryClient.setQueryData(['luro', address, 'requested', round], true);
		},
		onSettled: () => logger.log('Round start settled'),
	});
};

export const useRoundRequested = (round: number) => {
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<boolean>({
		queryKey: ['luro', address, 'requested', round],
		initialData: false,
	});
};

export const useRoundBets = (round: number) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<LuroBet[]>({
		queryKey: ['luro', address, 'bets', 'round', round],
		queryFn: () => fetchRoundBets(address, round, config),
	});
};

export const useRoundBank = (round: number) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<bigint>({
		queryKey: ['luro', address, 'round', 'bank', round],
		queryFn: async () =>
			(await readContract(config, {
				abi: LuckyRoundContract.abi,
				address: address,
				functionName: 'roundBank',
				args: [BigInt(round)],
			})) as bigint,
	});
};

export const useRoundBonusShare = (round: number) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<bigint>({
		queryKey: ['luro', address, 'round', 'bonus', round],
		queryFn: async () => {
			return (await readContract(config, {
				abi: LuckyRoundContract.abi,
				address: address,
				functionName: 'roundBonusShares',
				args: [BigInt(round)],
			})) as bigint;
		},
	});
};

export const useDistributeBonus = () => {
	const { t } = useTranslation('shared', { keyPrefix: 'errors' });
	const queryClient = useQueryClient();
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useMutation<WriteContractReturnType, WriteContractErrorType, { round: number }>({
		mutationKey: ['luro', 'bonus', 'distribute'],
		mutationFn: (params) => distributeBonus({ ...params, address }, config),
		onError: (e) => {
			handleError(e, t);
		},
		onMutate: () => logger.log('distribute bonus'),
		onSuccess: async (data) => {
			await queryClient.invalidateQueries({ queryKey: ['luro', 'bonus'] });
		},
		onSettled: () => logger.log('placeBet settled'),
	});
};

export const useBonusDistribution = (round: number) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<boolean>({
		queryKey: ['luro', address, 'bonus', 'distribution', round],
		queryFn: () => fetchBonusDistribution(address, round, config),
	});
};

export const useAvailableBonus = (address: Address) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const luro = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery({
		queryKey: ['luro', luro, 'bonus', 'available'],
		queryFn: () => fetchAvailableBonus(luro, address, config),
	});
};

export const useClaimBonus = () => {
	const { t } = useTranslation('shared', { keyPrefix: 'errors' });
	const queryClient = useQueryClient();
	const config = useConfig();
	const { interval } = Route.useParams();
	const { address: player = ZeroAddress } = useAccount();
	const luro = interval === '1d' ? LURO : LURO_5MIN;
	return useMutation<WriteContractReturnType, WriteContractErrorType>({
		mutationKey: ['luro', luro, 'bonus', 'claim'],
		mutationFn: () => claimBonus({ player, address: luro }, config),
		onError: (e) => {
			toast({
				// @ts-ignore
				title: t(e.cause?.reason),
				variant: 'destructive',
				// @ts-ignore
				description: t(e.cause?.reason),
			});
		},
		onMutate: () => logger.log('bonusClaim'),
		onSuccess: async (data) => {
			logger.log(data);
			const { update } = toast({
				title: 'Claiming bonus',
				description: 'Transaction is pending',
				variant: 'loading',
				duration: 10000,
			});
			await waitForTransactionReceipt(config.getClient(), { hash: data });
			update({ variant: 'default', description: 'Transaction is confirmed', title: 'Bonus claimed!', action: getTransactionLink(data), duration: 5000 });
			queryClient.invalidateQueries({ queryKey: ['luro', luro, 'bonus', 'available'] });
		},
		onSettled: () => logger.log('bonusClaim settled'),
	});
};

export const useWinners = () => {
	const { interval } = Route.useParams();
	const luro = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<WinnerInfo[]>({
		queryKey: ['luro', luro, 'winners'],
		queryFn: () => fetchWinners(luro),
	});
};

export const useWinner = (round: number) => {
	const { interval } = Route.useParams();
	const luro = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<WinnerInfo | null>({
		queryKey: ['luro', luro, 'winners', round],
		queryFn: () => fetchWinner(luro, round),
	});
};

export const useRoundWinner = (round: number) => {
	const { data: bets } = useRoundBets(round);
	const { data: roundData } = useRound(round);

	const offset = roundData?.winnerOffset;
	return getRoundWinnerByOffset(bets ?? [], offset || 0n);
};

export const useRound = (round: number) => {
	const { address = ZeroAddress } = useAccount();
	const config = useConfig();
	const { interval } = Route.useParams();
	const luro = interval === '1d' ? LURO : LURO_5MIN;

	return useQuery<Round>({
		queryKey: ['luro', luro, 'round', round],
		queryFn: () => {
			return fetchRound(luro, round, address, config.getClient());
		},
	});
};

export const useLuroState = (round: number) => {
	const queryClient = useQueryClient();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	const state = useQuery<WheelState>({
		queryKey: ['luro', address, 'state', round],
		initialData: { state: 'standby' },
	});
	const updateState = async (st: WheelState, round: number) => {
		logger.log('SET WHEEL STATE DATA', st, round);
		queryClient.setQueryData(['luro', address, 'state', round], st);
		if (st.state === 'stopped') {
			await queryClient.invalidateQueries({ queryKey: ['luro', address, 'rounds'] });
			await queryClient.invalidateQueries({ queryKey: ['luro', address, 'winners'] });
		}
	};

	return { state, updateState };
};

export interface ICurrentRoundInfo {
	betsCount: number;
	usersCount: number;
	volume: number;
}

export const useVisibleRound = () => {
	const queryClient = useQueryClient();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	const fetchRound = async (): Promise<number> => {
		await queryClient.invalidateQueries({ queryKey: ['luro', address, 'bets', 'round'] });
		return getCurrentRound(interval as LuroInterval);
	};

	return useQuery({
		queryKey: ['luro', address, 'visibleRound'],
		queryFn: fetchRound,
		initialData: getCurrentRound(interval as LuroInterval),
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});
};

export const useRounds = (player: Address, onlyPlayers = false) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<Round[]>({
		queryKey: ['luro', address, 'rounds', player, onlyPlayers],
		queryFn: () => fetchRounds(address, player, onlyPlayers, config.getClient()),
	});
};
export const usePlayerRounds = (player: Address) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<Round[]>({
		queryKey: ['luro', address, 'rounds', player],
		queryFn: () => fetchRoundsByPlayer(address, player, config.getClient()),
	});
};

export const useTotalVolume = () => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<bigint>({
		queryKey: ['luro', address, 'totalVolume'],
		queryFn: () => fetchTotalVolume(address, config),
	});
};
export const useBetsCount = () => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;
	return useQuery<number>({
		queryKey: ['luro', address, 'betsCount'],
		queryFn: () => fetchBetsCount(address, config),
	});
};

export const useCalculate = (round: number) => {
	const config = useConfig();
	const { interval } = Route.useParams();
	const address = interval === '1d' ? LURO : LURO_5MIN;

	return useMutation({
		mutationKey: ['luro', address, 'calculate'],
		mutationFn: () => calculateRound(address, round, config),
		onMutate: () => logger.log('calculate'),
		onSuccess: async (data) => {
			logger.log(data);
		},
		onSettled: () => logger.log('calculate settled'),
		onError: (e) => logger.error(e),
	});
};
