import { type FC, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glass?: boolean;
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const Card: FC<CardProps> = ({
  children,
  className,
  padding = 'lg',
  glass = false,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border',
        glass
          ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-white/20 dark:border-zinc-700/50'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/60',
        'shadow-sm',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
};
