import { Text, Badge, Icon, Spinner } from '../atoms';

export interface Signal {
  id: string;
  symbol: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  summary: string;
  source: string;
  timestamp: string;
  keyPoints?: string[];
}

interface SignalListProps {
  signals: Signal[];
  isLoading?: boolean;
  maxItems?: number;
  className?: string;
  onSignalClick?: (signal: Signal) => void;
}

function getDirectionBadge(direction: Signal['direction']) {
  switch (direction) {
    case 'bullish':
      return <Badge variant="profit">Bullish</Badge>;
    case 'bearish':
      return <Badge variant="loss">Bearish</Badge>;
    default:
      return <Badge variant="default">Neutral</Badge>;
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 70) return 'text-profit';
  if (confidence >= 40) return 'text-yellow-400';
  return 'text-loss';
}

function SignalItem({
  signal,
  onClick,
}: {
  signal: Signal;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        p-4 border-b border-border last:border-b-0
        transition-default
        ${isClickable ? 'cursor-pointer hover:bg-white/5' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon
            name={signal.direction === 'bullish' ? 'trendUp' : signal.direction === 'bearish' ? 'trendDown' : 'chart'}
            size="sm"
            className={signal.direction === 'bullish' ? 'text-profit' : signal.direction === 'bearish' ? 'text-loss' : 'text-white/40'}
          />
          <Text variant="body-sm" className="font-medium">
            {signal.symbol}
          </Text>
          {getDirectionBadge(signal.direction)}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <Text variant="caption" color="muted">Confidence</Text>
            <Text variant="body-sm" className={`font-mono ${getConfidenceColor(signal.confidence)}`}>
              {signal.confidence}%
            </Text>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Text variant="body-sm" color="muted" className="mb-2 line-clamp-2">
        {signal.summary}
      </Text>

      {/* Key Points (if available) */}
      {signal.keyPoints && signal.keyPoints.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {signal.keyPoints.slice(0, 3).map((point, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-white/5 text-white/60 rounded"
            >
              {point}
            </span>
          ))}
          {signal.keyPoints.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-white/5 text-white/40 rounded">
              +{signal.keyPoints.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Text variant="caption" color="muted">
          {signal.source}
        </Text>
        <Text variant="caption" color="muted">
          {signal.timestamp}
        </Text>
      </div>
    </div>
  );
}

export function SignalList({
  signals,
  isLoading = false,
  maxItems = 5,
  className = '',
  onSignalClick,
}: SignalListProps) {
  const displaySignals = signals.slice(0, maxItems);

  if (isLoading) {
    return (
      <div className={`glass-card p-8 flex items-center justify-center ${className}`}>
        <Spinner size="lg" className="text-profit" />
      </div>
    );
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="alert" size="md" className="text-white/40" />
          <Text variant="h4">Recent Signals</Text>
        </div>
        {signals.length > 0 && (
          <Badge variant="default">{signals.length}</Badge>
        )}
      </div>

      {/* Signal List */}
      {displaySignals.length > 0 ? (
        <div className="divide-y divide-border">
          {displaySignals.map((signal) => (
            <SignalItem
              key={signal.id}
              signal={signal}
              onClick={onSignalClick ? () => onSignalClick(signal) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Icon name="alert" size="lg" className="text-white/20 mx-auto mb-2" />
          <Text color="muted">No signals yet</Text>
          <Text variant="caption" color="muted">
            Signals from the n8n pipeline will appear here
          </Text>
        </div>
      )}

      {/* Footer - Show more */}
      {signals.length > maxItems && (
        <div className="px-4 py-2 border-t border-border text-center">
          <Text variant="caption" color="muted">
            Showing {maxItems} of {signals.length} signals
          </Text>
        </div>
      )}
    </div>
  );
}
