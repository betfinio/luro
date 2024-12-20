import logger from '@/src/config/logger.ts';
import { type LuroInterval, animateNewBet, getCurrentRound, handleError, useLuroAddress } from '@/src/lib';
import type { LuroBet, PlaceBetParams, Round, WheelState, WinnerInfo } from '@/src/lib/types.ts';
import { Route } from '@/src/routes/luro/$interval.tsx';
import { LuckyRoundABI, ZeroAddress } from '@betfinio/abi';
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
	const luroAddress = useLuroAddress();

	const resetObservedBet = () => {
		queryClient.setQueryData(['luro', luroAddress, 'bets', 'newBet'], ZeroAddress);
	};

	const query = useQuery<{ address: Address; strength: number }>({
		queryKey: ['luro', luroAddress, 'bets', 'newBet'],
		initialData: { address: ZeroAddress, strength: 0 },
	});

	useWatchContractEvent({
		abi: LuckyRoundABI,
		address: luroAddress,
		eventName: 'BetCreated',
		args: {
			round: BigInt(round),
		},
		onLogs: async (betLogs) => {
			animateNewBet(betLogs[0]?.args?.player ?? ZeroAddress, 10, queryClient, luroAddress);
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round'] });
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bets'] });
		},
	});

	return { query, resetObservedBet };
};

export const usePlaceBet = () => {
	const { t: errors } = useTranslation('shared', { keyPrefix: 'errors' });
	const { t } = useTranslation('luro', { keyPrefix: 'toast' });
	const queryClient = useQueryClient();
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useMutation<WriteContractReturnType, WriteContractErrorType, PlaceBetParams>({
		mutationKey: ['luro', luroAddress, 'bets', 'place'],
		mutationFn: (params) => placeBet(params, config),
		onError: (e) => {
			toast({
				// @ts-ignore
				title: errors('default'),
				variant: 'destructive',
				// @ts-ignore
				description: errors(e.cause?.reason),
			});
		},
		onMutate: () => logger.log('placeBet'),
		onSuccess: async (data) => {
			const { update, id } = toast({
				title: t('placeBet.title') as string,
				description: t('placeBet.description') as string,
				variant: 'loading',
				duration: 10000,
			});
			const receipt = await waitForTransactionReceipt(config.getClient(), { hash: data });

			if (receipt.status === 'reverted') {
				update({
					id,
					variant: 'destructive',
					description: '',
					title: t('transactionFailed.title'),
					action: getTransactionLink(data),
					duration: 5000,
				});
				return;
			}
			update({
				id,
				variant: 'default',
				description: t('betPlaced.description'),
				title: t('betPlaced.title'),
				action: getTransactionLink(data),
				duration: 5000,
			});
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bets', 'round'] });
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round'] });
		},
		onSettled: () => logger.log('placeBet settled'),
	});
};

export const useStartRound = (round: number) => {
	const queryClient = useQueryClient();
	const { t: errors } = useTranslation('shared', { keyPrefix: 'errors' });
	const { t } = useTranslation('luro', { keyPrefix: 'toast' });
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useMutation<WriteContractReturnType, WriteContractErrorType>({
		mutationKey: ['luro', luroAddress, 'round', 'start'],
		mutationFn: () => startRound(luroAddress, round, config),
		onError: (e) => handleError(e, errors),
		onMutate: () => logger.log('Start round'),
		onSuccess: async (data) => {
			const { update, id } = toast({
				title: t('startingRound.title'),
				description: t('startingRound.description'),
				variant: 'loading',
				duration: 10000,
			});
			const receipt = await waitForTransactionReceipt(config.getClient(), { hash: data });

			if (receipt.status === 'reverted') {
				update({
					id,
					variant: 'destructive',
					description: '',
					title: t('transactionFailed.title'),
					action: getTransactionLink(data),
					duration: 5000,
				});
				return;
			}
			update({
				id,
				variant: 'default',
				description: t('roundRequested.title'),
				title: t('roundRequested.title'),
				action: getTransactionLink(data),
				duration: 5000,
			});
			queryClient.setQueryData(['luro', luroAddress, 'requested', round], true);
		},
		onSettled: () => logger.log('Round start settled'),
	});
};

export const useRoundRequested = (round: number) => {
	const luroAddress = useLuroAddress();

	return useQuery<boolean>({
		queryKey: ['luro', luroAddress, 'requested', round],
		initialData: false,
	});
};

export const useRoundBets = (round: number) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<LuroBet[]>({
		queryKey: ['luro', luroAddress, 'bets', 'round', round],
		queryFn: () => fetchRoundBets(luroAddress, round, config),
	});
};

export const useRoundBank = (round: number) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<bigint>({
		queryKey: ['luro', luroAddress, 'round', 'bank', round],
		queryFn: async () =>
			(await readContract(config, {
				abi: LuckyRoundABI,
				address: luroAddress,
				functionName: 'roundBank',
				args: [BigInt(round)],
			})) as bigint,
	});
};

export const useRoundBonusShare = (round: number) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<bigint>({
		queryKey: ['luro', luroAddress, 'round', 'bonus', round],
		queryFn: async () => {
			return (await readContract(config, {
				abi: LuckyRoundABI,
				address: luroAddress,
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
	const luroAddress = useLuroAddress();

	return useMutation<WriteContractReturnType, WriteContractErrorType, { round: number }>({
		mutationKey: ['luro', 'bonus', 'distribute'],
		mutationFn: (params) => distributeBonus({ ...params, address: luroAddress }, config),
		onError: (e) => {
			handleError(e, t);
		},
		onMutate: () => logger.log('distribute bonus'),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bonus'] });
		},
		onSettled: () => logger.log('placeBet settled'),
	});
};

export const useBonusDistribution = (round: number) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<boolean>({
		queryKey: ['luro', luroAddress, 'bonus', 'distribution', round],
		queryFn: () => fetchBonusDistribution(luroAddress, round, config),
	});
};

export const useAvailableBonus = (address: Address) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery({
		queryKey: ['luro', luroAddress, 'bonus', 'available'],
		queryFn: () => fetchAvailableBonus(luroAddress, address, config),
	});
};

export const useClaimBonus = () => {
	const { t: errors } = useTranslation('shared', { keyPrefix: 'errors' });
	const { t } = useTranslation('luro', { keyPrefix: 'toast' });
	const queryClient = useQueryClient();
	const config = useConfig();
	const luroAddress = useLuroAddress();

	const { address: player = ZeroAddress } = useAccount();

	return useMutation<WriteContractReturnType, WriteContractErrorType>({
		mutationKey: ['luro', luroAddress, 'bonus', 'claim'],
		mutationFn: () => claimBonus({ player, address: luroAddress }, config),
		onError: (e) => {
			toast({
				// @ts-ignore
				title: errors(e.cause?.reason),
				variant: 'destructive',
				// @ts-ignore
				description: errors(e.cause?.reason),
			});
		},
		onMutate: () => logger.log('bonusClaim'),
		onSuccess: async (data) => {
			logger.log(data);
			const { update, id } = toast({
				title: t('claimingBonus.title'),
				description: t('claimingBonus.description'),
				variant: 'loading',
				duration: 10000,
			});
			await waitForTransactionReceipt(config.getClient(), { hash: data });
			update({
				id,
				variant: 'default',
				description: t('bonusClaimed.description'),
				title: t('bonusClaimed.title'),
				action: getTransactionLink(data),
				duration: 5000,
			});
			queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bonus', 'available'] });
		},
		onSettled: () => logger.log('bonusClaim settled'),
	});
};

export const useWinners = () => {
	const luroAddress = useLuroAddress();

	return useQuery<WinnerInfo[]>({
		queryKey: ['luro', luroAddress, 'winners'],
		queryFn: () => fetchWinners(luroAddress),
	});
};

export const useWinner = (round: number) => {
	const luroAddress = useLuroAddress();

	return useQuery<WinnerInfo | null>({
		queryKey: ['luro', luroAddress, 'winners', round],
		queryFn: () => fetchWinner(luroAddress, round),
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
	const luroAddress = useLuroAddress();

	return useQuery<Round>({
		queryKey: ['luro', luroAddress, 'round', round],
		queryFn: () => {
			return fetchRound(luroAddress, BigInt(round), address, config.getClient());
		},
	});
};

export const useLuroState = (round: number) => {
	const queryClient = useQueryClient();
	const luroAddress = useLuroAddress();

	const state = useQuery<WheelState>({
		queryKey: ['luro', luroAddress, 'state', round],
		initialData: { state: 'standby' },
	});
	const updateState = async (st: WheelState, round: number) => {
		logger.log('SET WHEEL STATE DATA', st, round);
		queryClient.setQueryData(['luro', luroAddress, 'state', round], st);
		if (st.state === 'stopped') {
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'rounds'] });
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'winners'] });
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
	const luroAddress = useLuroAddress();

	const fetchRound = async (): Promise<number> => {
		await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bets', 'round'] });
		return getCurrentRound(interval as LuroInterval);
	};
	return useQuery({
		queryKey: ['luro', luroAddress, 'visibleRound'],
		queryFn: fetchRound,
		initialData: getCurrentRound(interval as LuroInterval),
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});
};

export const useRounds = (player: Address, onlyPlayers = false) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<Round[]>({
		queryKey: ['luro', luroAddress, 'rounds', player, onlyPlayers],
		queryFn: () => fetchRounds(luroAddress, player, onlyPlayers, config.getClient()),
	});
};
export const usePlayerRounds = (player: Address) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<Round[]>({
		queryKey: ['luro', luroAddress, 'rounds', player],
		queryFn: () => fetchRoundsByPlayer(luroAddress, player, config.getClient()),
	});
};

export const useTotalVolume = () => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<bigint>({
		queryKey: ['luro', luroAddress, 'totalVolume'],
		queryFn: () => fetchTotalVolume(luroAddress, config),
	});
};
export const useBetsCount = () => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<number>({
		queryKey: ['luro', luroAddress, 'betsCount'],
		queryFn: () => fetchBetsCount(luroAddress, config),
	});
};

export const useCalculate = (round: number) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useMutation({
		mutationKey: ['luro', luroAddress, 'calculate'],
		mutationFn: () => calculateRound(luroAddress, round, config),
		onMutate: () => logger.log('calculate'),
		onSuccess: async (data) => {
			logger.log(data);
		},
		onSettled: () => logger.log('calculate settled'),
		onError: (e) => logger.error(e),
	});
};
