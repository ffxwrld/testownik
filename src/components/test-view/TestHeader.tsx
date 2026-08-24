import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Clock } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { formatTime } from '../../utils/session';

interface TestHeaderProps {
  onOpenSettings?: () => void;
  progressPercent: number;
  doneCount: number;
  totalQuestions: number;
  elapsed: number;
  confirmQuit: boolean;
  onQuitToggle: () => void;
  onQuitConfirm: () => void;
}

export const TestHeader: FC<TestHeaderProps> = ({
  onOpenSettings,
  progressPercent,
  doneCount,
  totalQuestions,
  elapsed,
  confirmQuit,
  onQuitToggle,
  onQuitConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2.5">
          <div className="flex items-center gap-2">
            {confirmQuit ? (
              <>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1 hidden sm:inline-block animate-fadeIn">
                  {t('test.quitConfirmPrompt')}
                </span>
                <button
                  onClick={onQuitConfirm}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium animate-fadeIn shadow-sm shadow-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  {t('test.yes')}
                </button>
                <button
                  onClick={onQuitToggle}
                  className="px-2 sm:px-3 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium animate-fadeIn"
                >
                  {t('test.no')}
                </button>
              </>
            ) : (
              <button
                onClick={onQuitToggle}
                className="group p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={t('test.quit')}
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>


          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={onOpenSettings}
              className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              <span className="hidden sm:inline">{t('test.completed')} </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {doneCount}
              </span>
              /{totalQuestions}
            </span>

            <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 sm:px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="font-mono text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>
        </div>

        <ProgressBar value={progressPercent} size="sm" color="emerald" />
      </div>
    </header>
  );
};
