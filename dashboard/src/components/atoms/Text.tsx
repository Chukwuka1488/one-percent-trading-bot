import type { ReactNode, ElementType } from 'react';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption' | 'mono';
type TextColor = 'default' | 'muted' | 'profit' | 'loss';

interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<TextVariant, string> = {
  h1: 'text-3xl font-bold tracking-tight',
  h2: 'text-2xl font-semibold tracking-tight',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-medium',
  body: 'text-base font-normal',
  'body-sm': 'text-sm font-normal',
  caption: 'text-xs font-normal',
  mono: 'text-sm font-mono',
};

const colorStyles: Record<TextColor, string> = {
  default: 'text-white',
  muted: 'text-white/60',
  profit: 'text-profit',
  loss: 'text-loss',
};

const defaultElements: Record<TextVariant, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
  'body-sm': 'p',
  caption: 'span',
  mono: 'span',
};

export function Text({
  variant = 'body',
  color = 'default',
  as,
  children,
  className = '',
}: TextProps) {
  const Component = as || defaultElements[variant];

  return (
    <Component
      className={`
        ${variantStyles[variant]}
        ${colorStyles[color]}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
