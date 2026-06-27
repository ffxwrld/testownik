import { type FC } from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
}

const colors = {
  blue: 'bg-primary-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const sizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export const ProgressBar: FC<ProgressBarProps> = ({
  value,
  className,
  color = 'emerald',
  size = 'md',
  animated = true,
  showLabel = false,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          <span>Postęp</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-zinc-200 dark:bg-zinc-700/60 overflow-hidden',
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            colors[color],
            animated && 'ease-out'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
