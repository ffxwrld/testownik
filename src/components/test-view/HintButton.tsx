import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, X } from '@phosphor-icons/react';
import { generateHint } from '../../utils/ai';

import { useTranslation } from 'react-i18next';

interface HintButtonProps {
  questionText: string;
  options: string[];
}

export const HintButton: React.FC<HintButtonProps> = ({ questionText, options }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset hint when question changes
  useEffect(() => {
    setHint(null);
    setError(null);
    setIsOpen(false);
  }, [questionText]);

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    if (isOffline) {
      setError('Włącz internet, aby skorzystać z pomocy sztucznej inteligencji.');
      return;
    }

    if (hint) return; // Already have the hint

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateHint(questionText, options, i18n.language);
      setHint(result);
    } catch (err: any) {
      if (err.message === 'OFFLINE') {
        setError('Włącz internet, aby skorzystać z pomocy sztucznej inteligencji.');
      } else {
        setError('Błąd połączenia. AI ma chwilową czkawkę.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-3 w-72 sm:w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-4 z-50 sm:origin-bottom origin-bottom-left"
          >
            {/* Triangle pointing down */}
            <div className="absolute -bottom-2 left-5 sm:left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-900 border-b border-r border-zinc-200 dark:border-zinc-700 rotate-45" />

            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Sparkle weight="fill" className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Tutor</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-zinc-700 dark:text-zinc-300 relative z-10 leading-relaxed">
              {isLoading ? (
                <div className="flex items-center gap-1 h-6">
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                </div>
              ) : error ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">{error}</span>
              ) : (
                <div className="flex flex-col gap-3">
                  <span>{hint}</span>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-tight border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    {t('legal.aiDisclaimer')}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        aria-label="Podpowiedź AI Tutor"
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors shadow-sm ${
          isOpen || hint 
            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' 
            : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-700'
        }`}
      >
        <Sparkle weight={isOpen || hint ? 'fill' : 'regular'} className="w-5 h-5" />
      </motion.button>
    </div>
  );
};
