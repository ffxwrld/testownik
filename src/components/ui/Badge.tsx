import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
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
      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    neutral:
      'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
  };

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
