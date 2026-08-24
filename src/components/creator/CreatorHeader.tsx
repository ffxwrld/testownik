import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface CreatorHeaderProps {
  onQuit: () => void;
  onSaveClick: () => void;
  questionsCount: number;
}

export const CreatorHeader: FC<CreatorHeaderProps> = ({ onQuit, onSaveClick, questionsCount }) => {
  const { t } = useTranslation();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  return (
    <header className="flex-shrink-0 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 lg:px-6 z-10 relative">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onQuit} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('creator.quit')}
        </Button>
        <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400">
          <span className="hidden sm:inline">{t('creator.title')}</span><span className="sm:hidden">Kreator</span>
        </h1>
        <span className="text-xs font-semibold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md">
          {questionsCount} {questionsCount === 1 ? 'pytanie' : (questionsCount >= 2 && questionsCount <= 4 ? 'pytania' : 'pytań')}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={onSaveClick} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent flex items-center gap-2 pl-3 pr-2.5">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">{t('creator.saveToTestownik')}</span><span className="sm:hidden">Zapisz</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-sans text-emerald-900 bg-emerald-400/50 rounded-md border border-emerald-400/30">
            {isMac ? '⌘' : 'Ctrl'} S
          </kbd>
        </Button>
      </div>
    </header>
  );
};
