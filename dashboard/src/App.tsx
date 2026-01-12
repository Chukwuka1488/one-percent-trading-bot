import { DashboardLayout, StatCard, TradeTable } from './components';
import { useDashboardData, useStartBot, useStopBot } from './hooks';
import { useBotStore } from './stores';
import type { Trade } from './types';

// Helper to format currency
function formatCurrency(value: number, currency = 'USDT'): string {
  return `$${value.toFixed(2)} ${currency}`;
}

// Helper to format percentage
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Transform Freqtrade trade to our UI format
function transformTrade(trade: Trade) {
  const isProfit = trade.profit_abs >= 0;
  return {
    id: trade.trade_id.toString(),
    pair: trade.pair,
    side: trade.is_short ? 'sell' as const : 'buy' as const,
    amount: trade.amount.toFixed(6),
    entryPrice: `$${trade.open_rate.toFixed(2)}`,
    currentPrice: `$${trade.current_rate.toFixed(2)}`,
    pnl: `${isProfit ? '+' : ''}$${trade.profit_abs.toFixed(2)}`,
    pnlPercent: formatPercent(trade.profit_pct),
    status: trade.is_open ? 'open' as const : 'closed' as const,
    timestamp: new Date(trade.open_date).toLocaleString(),
  };
}

function App() {
  const { currentPath, status, setCurrentPath } = useBotStore();
  const { openTrades, profit, balance, isLoading, refetch } = useDashboardData();
  const startBot = useStartBot();
  const stopBot = useStopBot();

  // Map status for UI (connecting -> stopped for display)
  const displayStatus = status === 'connecting' ? 'stopped' : status;

  // Transform trades for UI
  const trades = openTrades.map(transformTrade);

  // Calculate stats
  const totalBalance = balance?.total ?? 0;
  const todayPnl = profit?.profit_all_coin ?? 0;
  const todayPnlPercent = profit?.profit_all_percent ?? 0;
  const winRate = profit
    ? (profit.winning_trades / (profit.winning_trades + profit.losing_trades) * 100) || 0
    : 0;

  const handleStartBot = () => {
    startBot.mutate();
  };

  const handleStopBot = () => {
    stopBot.mutate();
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Trading overview"
      balance={formatCurrency(totalBalance, balance?.stake ?? 'USDT')}
      currentPath={currentPath}
      botStatus={displayStatus}
      onNavClick={setCurrentPath}
      onRefresh={refetch}
      onStartBot={handleStartBot}
      onStopBot={handleStopBot}
      isLoading={isLoading}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Balance"
          value={formatCurrency(totalBalance)}
          icon="wallet"
          trend={todayPnl >= 0 ? 'up' : 'down'}
          trendValue={formatPercent(todayPnlPercent)}
        />
        <StatCard
          label="Open Trades"
          value={openTrades.length.toString()}
          icon="chart"
          trend="neutral"
        />
        <StatCard
          label="Today's PnL"
          value={`${todayPnl >= 0 ? '+' : ''}$${todayPnl.toFixed(2)}`}
          icon={todayPnl >= 0 ? 'trendUp' : 'trendDown'}
          trend={todayPnl >= 0 ? 'up' : 'down'}
          trendValue={formatPercent(todayPnlPercent)}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(0)}%`}
          icon="check"
          trend={winRate >= 50 ? 'up' : 'down'}
          trendValue={`${profit?.winning_trades ?? 0}W / ${profit?.losing_trades ?? 0}L`}
        />
      </div>

      {/* Trade Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Open Trades</h2>
        <TradeTable
          trades={trades}
          isLoading={isLoading}
          onTradeClick={(trade) => console.log('Clicked trade:', trade.id)}
          emptyMessage={status === 'stopped' ? 'Bot is stopped' : 'No open trades'}
        />
      </div>
    </DashboardLayout>
  );
}

export default App;
