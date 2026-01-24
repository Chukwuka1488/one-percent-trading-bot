import type { ReactNode } from 'react';
import { Text } from '../atoms';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Text as="h1" variant="h1" className="text-profit mb-2">
          One Percent
        </Text>
        <Text variant="body-sm" color="muted">
          Trading Bot Dashboard
        </Text>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-surface rounded-xl border border-border p-8 shadow-glass">
        {/* Card Header */}
        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && (
              <Text as="h2" variant="h2" className="mb-2">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant="body-sm" color="muted">
                {subtitle}
              </Text>
            )}
          </div>
        )}

        {/* Card Content */}
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8">
        <Text variant="caption" color="muted">
          Secure trading automation
        </Text>
      </div>
    </div>
  );
}
