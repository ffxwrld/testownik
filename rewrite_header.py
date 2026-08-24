with open('src/components/creator/CreatorHeader.tsx', 'r') as f:
    content = f.read()

new_header = """import { FC, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface CreatorHeaderProps {
  onQuit: () => void;
  onSaveClick: () => void;
  questionsCount: number;
  baseName: string;
  setBaseName: (name: string) => void;
}

export const CreatorHeader: FC<CreatorHeaderProps> = ({ onQuit, onSaveClick, questionsCount, baseName, setBaseName }) => {
  const { t } = useTranslation();
  const [isMac, setIsMac] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  return (
    <header className="flex-shrink-0 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-2 sm:px-4 lg:px-6 z-10 relative">
      <div className="flex items-center gap-1 sm:gap-4 flex-1">
        <Button variant="ghost" size="sm" onClick={onQuit} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 px-2 sm:px-3">
          <svg className="w-5 h-5 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">{t('creator.quit')}</span>
        </Button>
        <div className="hidden sm:block h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        
        {/* On mobile, this replaces the title with the input. On desktop, it's just a styled input */}
        <div className="flex-1 flex justify-center sm:justify-start items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder="Nazwa bazy..."
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            className="w-full max-w-[200px] sm:max-w-[300px] text-center sm:text-left text-lg font-bold bg-transparent border-none rounded-md px-2 py-1 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden sm:inline-block text-xs font-semibold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md whitespace-nowrap">
          {questionsCount} {questionsCount === 1 ? 'pytanie' : (questionsCount >= 2 && questionsCount <= 4 ? 'pytania' : 'pytań')}
        </span>
        <Button variant="primary" onClick={onSaveClick} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent flex items-center justify-center sm:gap-2 px-2 sm:pl-3 sm:pr-2.5">
          <div className="flex items-center">
            <svg className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">{t('creator.saveToTestownik')}</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-sans text-emerald-900 bg-emerald-400/50 rounded-md border border-emerald-400/30">
            {isMac ? '⌘' : 'Ctrl'} S
          </kbd>
        </Button>
      </div>
    </header>
  );
};
"""

with open('src/components/creator/CreatorHeader.tsx', 'w') as f:
    f.write(new_header)
