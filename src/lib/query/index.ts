import { ZeroAddress } from '@betfinio/abi';
import { toast } from '@betfinio/components/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readContract, type WriteContractReturnType } from '@wagmi/core';
import { getTransactionLink, handleError } from 'betfinio_context/lib/helpers';
import { useTranslation } from 'react-i18next';
import type { Address, WriteContractErrorType } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import { useAccount, useConfig, useWatchContractEvent } from 'wagmi';
import logger from '@/src/config/logger.ts';
import { CORE } from '@/src/global.ts';
import { animateNewBet, getCurrentRound, useLuroAddress, useLuroStrategyAddress } from '@/src/lib';
import { CoreBetABI } from '@/src/lib/abi/CoreBetABI.ts';
import { LuckyRoundStrategyABI } from '@/src/lib/abi/LuckyRoundStrategyABI.ts';
import { PvPGameABI } from '@/src/lib/abi/PvPGameABI.ts';
import type { LuroBet, LuroInterval, PlaceBetParams, PlayerRoundInfo, Round, WheelState, WinnerInfo } from '@/src/lib/types.ts';
import { Route } from '@/src/routes/games/luro/$interval.tsx';
import { fetchPlayerRoundInfo, fetchRound, fetchRoundBets, fetchRounds, fetchRoundsByPlayer, getRoundWinnerByOffset, placeBet, spinRound } from '../api';
import { fetchRoundBetsGql, fetchWinner } from '../gql';

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
		abi: PvPGameABI,
		address: luroAddress,
		eventName: 'BetPlaced',
		args: {
			// no round filter on BetPlaced — roundId is not indexed
		},
		onLogs: async (betLogs) => {
			const log = betLogs[0];
			if (Number(log?.args?.roundId) !== round) return;
			animateNewBet(log?.args?.player ?? ZeroAddress, 10, queryClient, luroAddress);
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round'] });
			await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bets'] });
		},
	});

	return { query, resetObservedBet };
};

export const usePlaceBet = () => {
	const { t: tErrors } = useTranslation('shared', { keyPrefix: 'errors' });
	const { t: tLocalErrors } = useTranslation('luro', { keyPrefix: 'errors' });
	const { t } = useTranslation('luro', { keyPrefix: 'toast' });
	const queryClient = useQueryClient();
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useMutation<WriteContractReturnType, WriteContractErrorType, PlaceBetParams>({
		mutationKey: ['luro', luroAddress, 'bets', 'place'],
		mutationFn: (params) => placeBet(params, config),
		onError: (e) => toast.error(handleError(e, tErrors, tLocalErrors)),
		onMutate: () => logger.log('placeBet'),
		onSuccess: async (data) => {
			const promise = async () => {
				const receipt = await waitForTransactionReceipt(config.getClient(), { hash: data });
				if (receipt.status === 'reverted') {
					throw new Error('Transaction reverted');
				}
				await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bets', 'round'] });
				await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round'] });
			};

			toast.promise(promise, {
				loading: t('placeBet.title'),
				success: t('placeBet.title'),
				error: t('transactionFailed.title'),
				action: getTransactionLink(data),
			});
		},
		onSettled: () => logger.log('placeBet settled'),
	});
};

export const useStartRound = (round: number) => {
	const queryClient = useQueryClient();
	const { t: tErrors } = useTranslation('shared', { keyPrefix: 'errors' });
	const { t: tLocalErrors } = useTranslation('luro', { keyPrefix: 'errors' });
	const { t } = useTranslation('luro', { keyPrefix: 'toast' });
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useMutation<WriteContractReturnType, WriteContractErrorType>({
		mutationKey: ['luro', luroAddress, 'round', 'start'],
		mutationFn: () => spinRound(luroAddress, round, config),
		onError: (e) => toast.error(handleError(e, tErrors, tLocalErrors)),
		onMutate: () => logger.log('Start round'),
		onSuccess: async (data) => {
			const promise = async () => {
				const receipt = await waitForTransactionReceipt(config.getClient(), { hash: data });
				if (receipt.status === 'reverted') {
					throw new Error('Transaction reverted');
				}
				await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'bets', 'round'] });
				await queryClient.invalidateQueries({ queryKey: ['luro', luroAddress, 'round'] });
			};

			toast.promise(promise, {
				loading: t('startingRound.title'),
				success: t('startingRound.title'),
				error: t('transactionFailed.title'),
				action: getTransactionLink(data),
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

export const useRoundBetsGql = (round: number) => {
	const luroAddress = useLuroAddress();

	return useQuery<LuroBet[]>({
		queryKey: ['luro', luroAddress, 'bets', 'round', 'gql', round],
		queryFn: () => fetchRoundBetsGql(luroAddress, round),
	});
};

export const useRoundBank = (round: number) => {
	const config = useConfig();
	const strategyAddress = useLuroStrategyAddress();

	return useQuery<bigint>({
		queryKey: ['luro', strategyAddress, 'round', 'bank', round],
		queryFn: async () =>
			(await readContract(config, {
				abi: LuckyRoundStrategyABI,
				address: strategyAddress,
				functionName: 'roundBank',
				args: [BigInt(round)],
			})) as bigint,
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
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<Round>({
		queryKey: ['luro', luroAddress, 'round', round],
		queryFn: () => {
			return fetchRound(luroAddress, BigInt(round), config.getClient());
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

export const useRounds = (player: Address) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<Round[]>({
		queryKey: ['luro', luroAddress, 'rounds', player],
		queryFn: () => fetchRounds(luroAddress, player, config.getClient()),
	});
};
export const usePlayerRounds = (player: Address) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<Round[]>({
		queryKey: ['luro', luroAddress, 'playerRounds', player],
		queryFn: () => fetchRoundsByPlayer(luroAddress, player, config.getClient()),
	});
};

export const useLuroFee = () => {
	const config = useConfig();
	const luroAddress = useLuroAddress();

	return useQuery<{ feeBps: bigint; liquidityPool: Address }>({
		queryKey: ['luro', luroAddress, 'fee'],
		queryFn: async () => {
			const result = await readContract(config, {
				abi: CoreBetABI,
				address: CORE,
				functionName: 'getGameConfig',
				args: [luroAddress],
			});
			return { feeBps: result.feeBps, liquidityPool: result.liquidityPool };
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
};

export const usePlayerRoundInfo = (round: bigint) => {
	const config = useConfig();
	const luroAddress = useLuroAddress();
	const { address = ZeroAddress } = useAccount();

	return useQuery<PlayerRoundInfo>({
		queryKey: ['luro', luroAddress, 'playerRoundInfo', Number(round)],
		queryFn: () => fetchPlayerRoundInfo(luroAddress, address, round, config),
	});
};
