import { Icon, Text } from '../atoms';
import type { IconName } from '../atoms';

interface NavItemProps {
  label: string;
  icon: IconName;
  href?: string;
  isActive?: boolean;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
}

export function NavItem({
  label,
  icon,
  href,
  isActive = false,
  badge,
  onClick,
  className = '',
}: NavItemProps) {
  const Component = href ? 'a' : 'button';

  return (
    <Component
      href={href}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
        transition-default focus-ring
        ${isActive
          ? 'bg-profit/10 text-profit'
          : 'text-white/60 hover:text-white hover:bg-white/5'
        }
        ${className}
      `}
    >
      <Icon name={icon} size="md" />
      <Text variant="body-sm" className="flex-1 text-left">
        {label}
      </Text>
      {badge !== undefined && (
        <span
          className={`
            px-2 py-0.5 text-xs font-medium rounded-full
            ${isActive ? 'bg-profit/20 text-profit' : 'bg-white/10 text-white/60'}
          `}
        >
          {badge}
        </span>
      )}
    </Component>
  );
}
