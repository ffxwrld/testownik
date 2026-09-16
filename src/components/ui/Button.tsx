import { type FC, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary:
    'bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-500 shadow-xs',
  secondary:
    'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs focus:ring-zinc-400',
  danger:
    'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-xs',
  ghost:
    'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:ring-zinc-400',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500 shadow-xs',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 py-2.5 text-base gap-2 rounded-xl',
  xl: 'h-14 px-8 py-3 text-lg gap-3 rounded-2xl',
};

const base =
  'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin w-4 h-4 mr-1.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
