import { useState } from 'react';
import { DashboardLayout, StatCard, TradeTable } from './components';

// Mock data for demo
const mockTrades = [
  {
    id: '1',
    pair: 'BTC/USDT',
    side: 'buy' as const,
    amount: '0.0125',
    entryPrice: '$43,250.00',
    currentPrice: '$43,890.00',
    pnl: '+$8.00',
    pnlPercent: '+1.48%',
    status: 'open' as const,
    timestamp: '2 min ago',
  },
  {
    id: '2',
    pair: 'ETH/USDT',
    side: 'buy' as const,
    amount: '0.25',
    entryPrice: '$2,280.00',
    currentPrice: '$2,310.00',
    pnl: '+$7.50',
    pnlPercent: '+1.32%',
    status: 'open' as const,
    timestamp: '15 min ago',
  },
  {
    id: '3',
    pair: 'BTC/USDT',
    side: 'sell' as const,
    amount: '0.01',
    entryPrice: '$42,800.00',
    currentPrice: '$43,890.00',
    pnl: '-$10.90',
    pnlPercent: '-2.55%',
    status: 'closed' as const,
    timestamp: '1 hour ago',
  },
];

function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [botStatus, setBotStatus] = useState<'running' | 'stopped' | 'error'>('stopped');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleStartBot = () => {
    setBotStatus('running');
  };

  const handleStopBot = () => {
    setBotStatus('stopped');
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Trading overview"
      balance="$1,015.50 USDT"
      currentPath={currentPath}
      botStatus={botStatus}
      onNavClick={setCurrentPath}
      onRefresh={handleRefresh}
      onStartBot={handleStartBot}
      onStopBot={handleStopBot}
      isLoading={isLoading}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Balance"
          value="$1,015.50"
          icon="wallet"
          trend="up"
          trendValue="+1.55%"
        />
        <StatCard
          label="Open Trades"
          value="2"
          icon="chart"
          trend="neutral"
        />
        <StatCard
          label="Today's PnL"
          value="+$15.50"
          icon="trendUp"
          trend="up"
          trendValue="+1.55%"
        />
        <StatCard
          label="Win Rate"
          value="68%"
          icon="check"
          trend="up"
          trendValue="+2.3%"
        />
      </div>

      {/* Trade Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
        <TradeTable
          trades={mockTrades}
          isLoading={isLoading}
          onTradeClick={(trade) => console.log('Clicked trade:', trade.id)}
        />
      </div>
    </DashboardLayout>
  );
}

export default App;
