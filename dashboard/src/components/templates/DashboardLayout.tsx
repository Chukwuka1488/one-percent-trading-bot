import type { ReactNode } from 'react';
import { Sidebar, Header } from '../organisms';
import type { IconName } from '../atoms';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  balance?: string;
  currentPath: string;
  botStatus?: 'running' | 'stopped' | 'error';
  onNavClick?: (href: string) => void;
  onRefresh?: () => void;
  onStartBot?: () => void;
  onStopBot?: () => void;
  isLoading?: boolean;
}

const navSections = [
  {
    items: [
      { label: 'Dashboard', icon: 'chart' as IconName, href: '/' },
      { label: 'Trades', icon: 'trendUp' as IconName, href: '/trades' },
      { label: 'Signals', icon: 'alert' as IconName, href: '/signals' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Performance', icon: 'chart' as IconName, href: '/performance' },
      { label: 'History', icon: 'refresh' as IconName, href: '/history' },
    ],
  },
];

export function DashboardLayout({
  children,
  title,
  subtitle,
  balance,
  currentPath,
  botStatus = 'stopped',
  onNavClick,
  onRefresh,
  onStartBot,
  onStopBot,
  isLoading,
}: DashboardLayoutProps) {
  const isBotRunning = botStatus === 'running';

  return (
    <div className="flex min-h-screen bg-charcoal">
      {/* Sidebar */}
      <Sidebar
        sections={navSections}
        currentPath={currentPath}
        botStatus={botStatus}
        onNavClick={onNavClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          title={title}
          subtitle={subtitle}
          balance={balance}
          onRefresh={onRefresh}
          onStartBot={onStartBot}
          onStopBot={onStopBot}
          isBotRunning={isBotRunning}
          isLoading={isLoading}
        />

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
