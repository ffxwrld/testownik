import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          {icon && (
            <span className="shrink-0 text-primary-600 dark:text-primary-400 [&>svg]:w-7 [&>svg]:h-7 flex items-center">
              {icon}
            </span>
          )}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
            {subtitle}
          </div>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap sm:flex-nowrap shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};
