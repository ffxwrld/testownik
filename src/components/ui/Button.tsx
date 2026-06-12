import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg',
    secondary:
      'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-100 focus:ring-zinc-400 shadow',
    danger:
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md',
    ghost:
      'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:ring-zinc-400',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-md',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3',
  };

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
          className="animate-spin w-4 h-4"
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
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
