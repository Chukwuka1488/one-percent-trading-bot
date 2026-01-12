import { Text, Spinner } from '../atoms';
import { TradeRow } from '../molecules';

interface Trade {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: string;
  entryPrice: string;
  currentPrice?: string;
  pnl?: string;
  pnlPercent?: string;
  status: 'open' | 'closed' | 'pending';
  timestamp: string;
}

interface TradeTableProps {
  trades: Trade[];
  isLoading?: boolean;
  onTradeClick?: (trade: Trade) => void;
  emptyMessage?: string;
}

export function TradeTable({
  trades,
  isLoading = false,
  onTradeClick,
  emptyMessage = 'No trades found',
}: TradeTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <Spinner size="lg" className="text-profit" />
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Text color="muted">{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-charcoal-400 border-b border-border">
        <Text variant="caption" color="muted" className="col-span-2 uppercase tracking-wider">
          Pair
        </Text>
        <Text variant="caption" color="muted" className="uppercase tracking-wider">
          Amount
        </Text>
        <Text variant="caption" color="muted" className="uppercase tracking-wider">
          Entry
        </Text>
        <Text variant="caption" color="muted" className="uppercase tracking-wider">
          Current
        </Text>
        <Text variant="caption" color="muted" className="uppercase tracking-wider text-right">
          PnL
        </Text>
        <Text variant="caption" color="muted" className="uppercase tracking-wider text-right">
          Status
        </Text>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {trades.map((trade) => (
          <TradeRow
            key={trade.id}
            {...trade}
            onClick={onTradeClick ? () => onTradeClick(trade) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
