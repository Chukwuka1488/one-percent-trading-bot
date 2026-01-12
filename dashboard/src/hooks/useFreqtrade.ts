/**
 * Freqtrade React Query Hooks
 * Data fetching and caching for Freqtrade API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { freqtradeApi } from '../services/freqtrade';
import { useBotStore } from '../stores/botStore';
import type { ForceSellRequest } from '../types/freqtrade';

// Query Keys
export const queryKeys = {
  openTrades: ['freqtrade', 'trades', 'open'] as const,
  tradeHistory: (limit: number, offset: number) => ['freqtrade', 'trades', 'history', limit, offset] as const,
  profit: ['freqtrade', 'profit'] as const,
  balance: ['freqtrade', 'balance'] as const,
  config: ['freqtrade', 'config'] as const,
  performance: ['freqtrade', 'performance'] as const,
  daily: (days: number) => ['freqtrade', 'daily', days] as const,
  logs: (limit: number) => ['freqtrade', 'logs', limit] as const,
};

// Polling intervals (ms)
const POLL_FAST = 5000;   // 5 seconds for trades
const POLL_MEDIUM = 15000; // 15 seconds for profit/balance
const POLL_SLOW = 60000;   // 60 seconds for config

/**
 * Hook: Open Trades
 * Fetches currently open trades with frequent polling
 */
export function useOpenTrades() {
  const { setConnected, setError, setLastUpdated } = useBotStore();

  return useQuery({
    queryKey: queryKeys.openTrades,
    queryFn: async () => {
      try {
        const trades = await freqtradeApi.getOpenTrades();
        setConnected(true);
        setError(null);
        setLastUpdated(new Date());
        return trades;
      } catch (error) {
        setConnected(false);
        setError(error instanceof Error ? error.message : 'Failed to fetch trades');
        throw error;
      }
    },
    refetchInterval: POLL_FAST,
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * Hook: Trade History
 * Fetches closed trades with pagination
 */
export function useTradeHistory(limit = 50, offset = 0) {
  return useQuery({
    queryKey: queryKeys.tradeHistory(limit, offset),
    queryFn: () => freqtradeApi.getTradeHistory(limit, offset),
    refetchInterval: POLL_MEDIUM,
  });
}

/**
 * Hook: Profit Summary
 * Fetches overall profit statistics
 */
export function useProfit() {
  return useQuery({
    queryKey: queryKeys.profit,
    queryFn: () => freqtradeApi.getProfit(),
    refetchInterval: POLL_MEDIUM,
  });
}

/**
 * Hook: Balance
 * Fetches wallet balances
 */
export function useBalance() {
  return useQuery({
    queryKey: queryKeys.balance,
    queryFn: () => freqtradeApi.getBalance(),
    refetchInterval: POLL_MEDIUM,
  });
}

/**
 * Hook: Bot Config
 * Fetches bot configuration
 */
export function useBotConfig() {
  const { setStatus } = useBotStore();

  return useQuery({
    queryKey: queryKeys.config,
    queryFn: async () => {
      const config = await freqtradeApi.getConfig();
      setStatus(config.state === 'running' ? 'running' : 'stopped');
      return config;
    },
    refetchInterval: POLL_SLOW,
  });
}

/**
 * Hook: Performance
 * Fetches performance by pair
 */
export function usePerformance() {
  return useQuery({
    queryKey: queryKeys.performance,
    queryFn: () => freqtradeApi.getPerformance(),
    refetchInterval: POLL_MEDIUM,
  });
}

/**
 * Hook: Daily Stats
 * Fetches daily profit statistics
 */
export function useDailyStats(days = 7) {
  return useQuery({
    queryKey: queryKeys.daily(days),
    queryFn: () => freqtradeApi.getDailyStats(days),
    refetchInterval: POLL_MEDIUM,
  });
}

/**
 * Hook: Start Bot
 * Mutation to start the trading bot
 */
export function useStartBot() {
  const queryClient = useQueryClient();
  const { setStatus } = useBotStore();

  return useMutation({
    mutationFn: () => freqtradeApi.startBot(),
    onSuccess: () => {
      setStatus('running');
      queryClient.invalidateQueries({ queryKey: ['freqtrade'] });
    },
    onError: (error) => {
      setStatus('error');
      console.error('Failed to start bot:', error);
    },
  });
}

/**
 * Hook: Stop Bot
 * Mutation to stop the trading bot
 */
export function useStopBot() {
  const queryClient = useQueryClient();
  const { setStatus } = useBotStore();

  return useMutation({
    mutationFn: () => freqtradeApi.stopBot(),
    onSuccess: () => {
      setStatus('stopped');
      queryClient.invalidateQueries({ queryKey: ['freqtrade'] });
    },
    onError: (error) => {
      setStatus('error');
      console.error('Failed to stop bot:', error);
    },
  });
}

/**
 * Hook: Force Sell
 * Mutation to force sell a trade
 */
export function useForceSell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ForceSellRequest) => freqtradeApi.forceSell(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.openTrades });
      queryClient.invalidateQueries({ queryKey: queryKeys.profit });
      queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

/**
 * Hook: Reload Config
 * Mutation to reload bot configuration
 */
export function useReloadConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => freqtradeApi.reloadConfig(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config });
    },
  });
}

/**
 * Combined hook for dashboard data
 * Fetches all data needed for the main dashboard
 */
export function useDashboardData() {
  const openTrades = useOpenTrades();
  const profit = useProfit();
  const balance = useBalance();
  const config = useBotConfig();

  return {
    openTrades: openTrades.data ?? [],
    profit: profit.data,
    balance: balance.data,
    config: config.data,
    isLoading: openTrades.isLoading || profit.isLoading || balance.isLoading,
    isError: openTrades.isError || profit.isError || balance.isError,
    error: openTrades.error || profit.error || balance.error,
    refetch: () => {
      openTrades.refetch();
      profit.refetch();
      balance.refetch();
      config.refetch();
    },
  };
}
