import type { SVGProps } from 'react';
import { icons, type IconName } from './iconPaths';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: IconSize;
  className?: string;
}

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

interface NamedIconProps extends Omit<IconProps, 'children'> {
  name: IconName;
}

export function Icon({ name, size = 'md', className = '', ...props }: NamedIconProps) {
  const dimension = sizeMap[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      width={dimension}
      height={dimension}
      className={className}
      {...props}
    >
      {icons[name]}
    </svg>
  );
}
