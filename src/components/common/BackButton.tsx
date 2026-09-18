import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export interface BackButtonProps {
  onClick: () => void;
  label?: string;
  showLabel?: boolean;
  className?: string;
  enableEscapeKey?: boolean;
  ariaLabel?: string;
  variant?: 'default' | 'ghost' | 'floating';
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label,
  showLabel = true,
  className = '',
  enableEscapeKey = true,
  ariaLabel,
  variant = 'default',
}) => {
  const { t } = useTranslation();
  const displayLabel = label ?? t('common.back', 'Wróć');
  useEffect(() => {
    if (!enableEscapeKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        onClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableEscapeKey, onClick]);

  const variantClasses = {
    default:
      'bg-zinc-100/90 hover:bg-zinc-200/90 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/50 backdrop-blur-md rounded-xl px-3 py-2',
    ghost:
      'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 rounded-xl px-2.5 py-2 border border-transparent',
    floating:
      'fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-md border border-zinc-200/70 dark:border-zinc-800/70 rounded-full px-3.5 py-2 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800',
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.18 }}
      onClick={onClick}
      aria-label={ariaLabel || displayLabel}
      className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-medium tracking-tight transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 cursor-pointer ${variantClasses[variant]} ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.25} />
      {showLabel && displayLabel && (
        <span className="truncate">{displayLabel}</span>
      )}
    </motion.button>
  );
};
