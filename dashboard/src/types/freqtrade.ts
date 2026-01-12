/**
 * Freqtrade API Types
 * Based on Freqtrade REST API v1
 * Docs: https://www.freqtrade.io/en/stable/rest-api/
 */

// Bot Status
export interface BotState {
  state: 'running' | 'stopped' | 'reload_config';
  running: boolean;
  dry_run: boolean;
  trading_mode: string;
  max_open_trades: number;
  stake_currency: string;
  stake_amount: number;
  available_balance: number;
}

// Open Trade
export interface Trade {
  trade_id: number;
  pair: string;
  base_currency: string;
  quote_currency: string;
  is_open: boolean;
  exchange: string;
  amount: number;
  amount_requested: number;
  stake_amount: number;
  strategy: string;
  timeframe: string;
  fee_open: number;
  fee_open_cost: number;
  fee_open_currency: string;
  fee_close: number;
  fee_close_cost: number | null;
  fee_close_currency: string | null;
  open_date: string;
  open_timestamp: number;
  open_rate: number;
  open_rate_requested: number;
  close_date: string | null;
  close_timestamp: number | null;
  close_rate: number | null;
  close_rate_requested: number | null;
  close_profit: number | null;
  close_profit_pct: number | null;
  close_profit_abs: number | null;
  profit_ratio: number;
  profit_pct: number;
  profit_abs: number;
  current_rate: number;
  stop_loss_abs: number;
  stop_loss_pct: number;
  stop_loss_ratio: number;
  stoploss_order_id: string | null;
  stoploss_last_update: string | null;
  initial_stop_loss_abs: number;
  initial_stop_loss_pct: number;
  initial_stop_loss_ratio: number;
  min_rate: number;
  max_rate: number;
  leverage: number;
  is_short: boolean;
  trading_mode: string;
  orders: TradeOrder[];
}

export interface TradeOrder {
  order_id: string;
  status: string;
  amount: number;
  average: number;
  filled: number;
  remaining: number;
  cost: number;
  order_date: string;
  order_timestamp: number;
  order_filled_date: string | null;
  order_type: string;
  side: 'buy' | 'sell';
}

// Profit Summary
export interface Profit {
  profit_closed_coin: number;
  profit_closed_percent_mean: number;
  profit_closed_ratio_mean: number;
  profit_closed_percent_sum: number;
  profit_closed_ratio_sum: number;
  profit_closed_percent: number;
  profit_closed_ratio: number;
  profit_closed_fiat: number;
  profit_all_coin: number;
  profit_all_percent_mean: number;
  profit_all_ratio_mean: number;
  profit_all_percent_sum: number;
  profit_all_ratio_sum: number;
  profit_all_percent: number;
  profit_all_ratio: number;
  profit_all_fiat: number;
  trade_count: number;
  closed_trade_count: number;
  first_trade_date: string;
  first_trade_timestamp: number;
  latest_trade_date: string;
  latest_trade_timestamp: number;
  avg_duration: string;
  best_pair: string;
  best_rate: number;
  winning_trades: number;
  losing_trades: number;
}

// Balance
export interface Balance {
  currency: string;
  free: number;
  balance: number;
  used: number;
  est_stake: number;
  stake: string;
  side: string;
  leverage: number;
  is_position: boolean;
  position: number;
}

export interface BalanceResponse {
  currencies: Balance[];
  total: number;
  symbol: string;
  value: number;
  stake: string;
  note: string;
  starting_capital: number;
  starting_capital_ratio: number;
  starting_capital_pct: number;
  starting_capital_fiat: number;
  starting_capital_fiat_ratio: number;
  starting_capital_fiat_pct: number;
}

// Bot Configuration
export interface BotConfig {
  version: string;
  strategy: string;
  strategy_version: string | null;
  dry_run: boolean;
  trading_mode: string;
  short_allowed: boolean;
  stake_currency: string;
  stake_amount: number;
  available_capital: number;
  stake_currency_decimals: number;
  max_open_trades: number;
  minimal_roi: Record<string, number>;
  stoploss: number;
  trailing_stop: boolean;
  trailing_stop_positive: number | null;
  trailing_stop_positive_offset: number;
  trailing_only_offset_is_reached: boolean;
  timeframe: string;
  timeframe_ms: number;
  timeframe_min: number;
  exchange: string;
  state: string;
  runmode: string;
  position_adjustment_enable: boolean;
  max_entry_position_adjustment: number;
  bot_name: string;
  api_server?: {
    enabled: boolean;
    listen_ip_address: string;
    listen_port: number;
  };
}

// API Response Types
export interface StatusResponse {
  trades: Trade[];
}

export interface TradesResponse {
  trades: Trade[];
  trades_count: number;
  offset: number;
  total_trades: number;
}

// Force Sell Request
export interface ForceSellRequest {
  tradeid: number | 'all';
  ordertype?: 'market' | 'limit';
}

// API Error
export interface ApiError {
  error: string;
}

// Generic API Response
export type ApiResponse<T> = T | ApiError;

// Helper type guard
export function isApiError(response: unknown): response is ApiError {
  return typeof response === 'object' && response !== null && 'error' in response;
}
