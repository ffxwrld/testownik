import { type FC, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glass?: boolean;
  variant?: 'default' | 'hero';
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6',
  xl: 'p-6 sm:p-8',
};

export const Card: FC<CardProps> = ({
  children,
  className,
  padding = 'lg',
  glass = false,
  variant = 'default',
  ...rest
}) => {
  return (
    <div
      {...rest}
      className={cn(
        variant === 'hero' ? 'rounded-3xl' : 'rounded-2xl',
        'border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs transition-colors duration-150',
        glass
          ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl'
          : 'bg-white dark:bg-zinc-900',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
};
