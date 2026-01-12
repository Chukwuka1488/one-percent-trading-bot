import { Button, Icon, Text } from '../atoms';

interface HeaderProps {
  title: string;
  subtitle?: string;
  balance?: string;
  onRefresh?: () => void;
  onStartBot?: () => void;
  onStopBot?: () => void;
  isBotRunning?: boolean;
  isLoading?: boolean;
}

export function Header({
  title,
  subtitle,
  balance,
  onRefresh,
  onStartBot,
  onStopBot,
  isBotRunning = false,
  isLoading = false,
}: HeaderProps) {
  return (
    <header className="sticky-header h-header px-6 flex items-center justify-between">
      {/* Left: Title */}
      <div>
        <Text variant="h3">{title}</Text>
        {subtitle && (
          <Text variant="body-sm" color="muted">
            {subtitle}
          </Text>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Balance */}
        {balance && (
          <div className="glass-card-sm px-4 py-2 flex items-center gap-2">
            <Icon name="wallet" size="sm" className="text-white/40" />
            <Text variant="mono" className="tabular-nums">
              {balance}
            </Text>
          </div>
        )}

        {/* Refresh */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
          >
            <Icon name="refresh" size="sm" />
          </Button>
        )}

        {/* Bot Control */}
        {(onStartBot || onStopBot) && (
          isBotRunning ? (
            <Button
              variant="danger"
              size="sm"
              onClick={onStopBot}
            >
              <Icon name="stop" size="sm" />
              Stop Bot
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onStartBot}
            >
              <Icon name="play" size="sm" />
              Start Bot
            </Button>
          )
        )}
      </div>
    </header>
  );
}
