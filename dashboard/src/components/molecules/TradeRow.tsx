import { Badge, Icon, Text } from '../atoms';

type TradeStatus = 'open' | 'closed' | 'pending';
type TradeSide = 'buy' | 'sell';

interface TradeRowProps {
  pair: string;
  side: TradeSide;
  amount: string;
  entryPrice: string;
  currentPrice?: string;
  pnl?: string;
  pnlPercent?: string;
  status: TradeStatus;
  timestamp: string;
  onClick?: () => void;
}

export function TradeRow({
  pair,
  side,
  amount,
  entryPrice,
  currentPrice,
  pnl,
  pnlPercent,
  status,
  timestamp,
  onClick,
}: TradeRowProps) {
  const isProfit = pnl && !pnl.startsWith('-');
  const statusVariant = status === 'open' ? 'profit' : status === 'pending' ? 'warning' : 'default';

  return (
    <div
      onClick={onClick}
      className={`
        grid grid-cols-7 gap-4 items-center px-4 py-3
        border-b border-border last:border-b-0
        transition-default
        ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}
      `}
    >
      {/* Pair & Side */}
      <div className="col-span-2 flex items-center gap-3">
        <div
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${side === 'buy' ? 'bg-profit/20' : 'bg-loss/20'}
          `}
        >
          <Icon
            name={side === 'buy' ? 'trendUp' : 'trendDown'}
            size="sm"
            className={side === 'buy' ? 'text-profit' : 'text-loss'}
          />
        </div>
        <div>
          <Text variant="body-sm" className="font-medium">
            {pair}
          </Text>
          <Text variant="caption" color="muted" className="uppercase">
            {side}
          </Text>
        </div>
      </div>

      {/* Amount */}
      <Text variant="mono" className="tabular-nums">
        {amount}
      </Text>

      {/* Entry Price */}
      <Text variant="mono" color="muted" className="tabular-nums">
        {entryPrice}
      </Text>

      {/* Current Price */}
      <Text variant="mono" className="tabular-nums">
        {currentPrice || '-'}
      </Text>

      {/* PnL */}
      <div className="text-right">
        {pnl ? (
          <>
            <Text
              variant="mono"
              color={isProfit ? 'profit' : 'loss'}
              className="tabular-nums"
            >
              {pnl}
            </Text>
            {pnlPercent && (
              <Text
                variant="caption"
                color={isProfit ? 'profit' : 'loss'}
                className="tabular-nums"
              >
                {pnlPercent}
              </Text>
            )}
          </>
        ) : (
          <Text variant="mono" color="muted">-</Text>
        )}
      </div>

      {/* Status & Time */}
      <div className="text-right">
        <Badge variant={statusVariant} size="sm">
          {status}
        </Badge>
        <Text variant="caption" color="muted" className="block mt-1">
          {timestamp}
        </Text>
      </div>
    </div>
  );
}
