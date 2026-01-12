import { Icon, Text } from '../atoms';
import type { IconName } from '../atoms';

type StatTrend = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: IconName;
  trend?: StatTrend;
  trendValue?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend = 'neutral',
  trendValue,
  className = '',
}: StatCardProps) {
  const trendColors: Record<StatTrend, string> = {
    up: 'text-profit',
    down: 'text-loss',
    neutral: 'text-white/40',
  };

  const trendIcons: Record<StatTrend, IconName> = {
    up: 'trendUp',
    down: 'trendDown',
    neutral: 'chart',
  };

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <Text variant="caption" color="muted" className="uppercase tracking-wider">
          {label}
        </Text>
        {icon && (
          <Icon name={icon} size="md" className="text-white/30" />
        )}
      </div>

      <div className="flex items-end justify-between">
        <Text variant="h2" className="font-mono tabular-nums">
          {value}
        </Text>

        {trendValue && (
          <div className={`flex items-center gap-1 ${trendColors[trend]}`}>
            <Icon name={trendIcons[trend]} size="sm" />
            <Text variant="body-sm" className={trendColors[trend]}>
              {trendValue}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
