import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'profit' | 'loss' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/70',
  profit: 'bg-profit/20 text-profit',
  loss: 'bg-loss/20 text-loss',
  warning: 'bg-yellow-500/20 text-yellow-400',
  info: 'bg-blue-500/20 text-blue-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
