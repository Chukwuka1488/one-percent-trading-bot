/**
 * Freqtrade API Service
 * Handles all communication with the Freqtrade REST API
 */

import type {
  BotState,
  Trade,
  Profit,
  BalanceResponse,
  BotConfig,
  StatusResponse,
  TradesResponse,
  ForceSellRequest,
  ApiError,
} from '../types/freqtrade';

// API Configuration
const API_BASE_URL = '/api/v1'; // Proxied through Vite
const AUTH_USERNAME = 'freqtrade';
const AUTH_PASSWORD = 'freqtrade';

// Create Basic Auth header
const getAuthHeader = (): string => {
  const credentials = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
  return `Basic ${credentials}`;
};

// Base fetch function with auth
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || 'Unknown error');
  }

  return response.json();
}

// API Methods
export const freqtradeApi = {
  // Bot State & Control
  async getState(): Promise<BotState> {
    return fetchApi<BotState>('/show_config');
  },

  async startBot(): Promise<{ status: string }> {
    return fetchApi('/start', { method: 'POST' });
  },

  async stopBot(): Promise<{ status: string }> {
    return fetchApi('/stop', { method: 'POST' });
  },

  async reloadConfig(): Promise<{ status: string }> {
    return fetchApi('/reload_config', { method: 'POST' });
  },

  // Trades
  async getOpenTrades(): Promise<Trade[]> {
    const response = await fetchApi<StatusResponse>('/status');
    return response.trades || [];
  },

  async getTradeHistory(limit = 50, offset = 0): Promise<TradesResponse> {
    return fetchApi<TradesResponse>(`/trades?limit=${limit}&offset=${offset}`);
  },

  async getTrade(tradeId: number): Promise<Trade> {
    return fetchApi<Trade>(`/trade/${tradeId}`);
  },

  async forceSell(request: ForceSellRequest): Promise<{ result: string }> {
    return fetchApi('/forcesell', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async forceEntry(pair: string, side: 'buy' | 'sell' = 'buy'): Promise<Trade> {
    return fetchApi('/forceenter', {
      method: 'POST',
      body: JSON.stringify({ pair, side }),
    });
  },

  // Profit & Balance
  async getProfit(): Promise<Profit> {
    return fetchApi<Profit>('/profit');
  },

  async getBalance(): Promise<BalanceResponse> {
    return fetchApi<BalanceResponse>('/balance');
  },

  // Configuration
  async getConfig(): Promise<BotConfig> {
    return fetchApi<BotConfig>('/show_config');
  },

  // Performance & Stats
  async getPerformance(): Promise<Array<{ pair: string; profit: number; count: number }>> {
    return fetchApi('/performance');
  },

  async getDailyStats(days = 7): Promise<Array<{ date: string; abs_profit: number; trade_count: number }>> {
    return fetchApi(`/daily?timescale=${days}`);
  },

  // Health Check
  async ping(): Promise<{ status: string }> {
    return fetchApi('/ping');
  },

  async getVersion(): Promise<{ version: string }> {
    return fetchApi('/version');
  },

  // Logs
  async getLogs(limit = 50): Promise<{ log_count: number; logs: string[] }> {
    return fetchApi(`/logs?limit=${limit}`);
  },

  // Locks
  async getLocks(): Promise<{ lock_count: number; locks: Array<{ pair: string; until: string; reason: string }> }> {
    return fetchApi('/locks');
  },

  async deleteLock(lockId: number): Promise<{ lock_id: number }> {
    return fetchApi(`/locks/${lockId}`, { method: 'DELETE' });
  },
};

export default freqtradeApi;
