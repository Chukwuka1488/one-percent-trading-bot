import { NavItem } from '../molecules';
import { Text, Icon } from '../atoms';
import type { IconName } from '../atoms';

interface NavSection {
  title?: string;
  items: {
    label: string;
    icon: IconName;
    href: string;
    badge?: string | number;
  }[];
}

interface SidebarProps {
  sections: NavSection[];
  currentPath: string;
  botStatus?: 'running' | 'stopped' | 'error';
  onNavClick?: (href: string) => void;
}

export function Sidebar({
  sections,
  currentPath,
  botStatus = 'stopped',
  onNavClick,
}: SidebarProps) {
  const statusColors = {
    running: 'bg-profit',
    stopped: 'bg-white/30',
    error: 'bg-loss',
  };

  const statusLabels = {
    running: 'Bot Running',
    stopped: 'Bot Stopped',
    error: 'Bot Error',
  };

  return (
    <aside className="sticky-sidebar w-sidebar bg-charcoal-300 border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-profit/20 flex items-center justify-center">
            <Icon name="chart" size="lg" className="text-profit" />
          </div>
          <div>
            <Text variant="h4" className="leading-none">
              OnePercent
            </Text>
            <Text variant="caption" color="muted">
              Trading Bot
            </Text>
          </div>
        </div>
      </div>

      {/* Bot Status */}
      <div className="px-4 py-3 mx-4 mt-4 glass-card-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[botStatus]} animate-pulse-slow`} />
          <Text variant="caption" color="muted">
            {statusLabels[botStatus]}
          </Text>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {sections.map((section, index) => (
          <div key={index}>
            {section.title && (
              <Text
                variant="caption"
                color="muted"
                className="uppercase tracking-wider px-4 mb-2 block"
              >
                {section.title}
              </Text>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  badge={item.badge}
                  isActive={currentPath === item.href}
                  onClick={() => onNavClick?.(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <NavItem
          label="Settings"
          icon="settings"
          href="/settings"
          isActive={currentPath === '/settings'}
          onClick={() => onNavClick?.('/settings')}
        />
      </div>
    </aside>
  );
}
