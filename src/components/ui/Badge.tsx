import { type FC, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const variants = {
  default:
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
  success:
    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  warning:
    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  danger:
    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  info:
    'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400',
  neutral:
    'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
};

export const Badge: FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
