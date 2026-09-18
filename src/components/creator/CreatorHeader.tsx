import { FC, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FloppyDisk } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { BackButton } from '../common/BackButton';

interface CreatorHeaderProps {
  onQuit: () => void;
  onSaveClick: () => void;
  questionsCount: number;
  onToggleSidebar?: () => void;
  baseName: string;
  setBaseName: (name: string) => void;
  onExportZip?: () => void;
  isExportingZip?: boolean;
}

export const CreatorHeader: FC<CreatorHeaderProps> = ({ 
  onQuit, 
  onSaveClick, 
  questionsCount, 
  baseName, 
  setBaseName, 
  onToggleSidebar,
  onExportZip,
  isExportingZip
}) => {
  const { t } = useTranslation();
  const [isMac, setIsMac] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  return (
    <header className="flex-shrink-0 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-2 sm:px-4 lg:px-6 z-10 relative">
      <div className="flex items-center gap-1 sm:gap-4 flex-1">
        <BackButton
          onClick={onQuit}
          label={t('creator.back')}
          variant="ghost"
          enableEscapeKey={false}
          className="px-2 sm:px-3"
        />
        
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="md:hidden px-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 relative">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </Button>

        <div className="hidden sm:block h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        
        {/* On mobile, this replaces the title with the input. On desktop, it's just a styled input */}
        <div className="flex-1 flex justify-center sm:justify-start items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder={t('creator.packNamePlaceholder', 'Nazwa bazy...')}
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            className="w-full max-w-[200px] sm:max-w-[300px] text-center sm:text-left text-lg font-bold bg-transparent border-none rounded-md px-2 py-1 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden sm:inline-block text-xs font-semibold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md whitespace-nowrap">
          {t('home.questionsCount', '{{count}} pytań', { count: questionsCount })}
        </span>
        {onExportZip && (
          <Button
            variant="secondary"
            onClick={onExportZip}
            disabled={isExportingZip}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 text-zinc-700 dark:text-zinc-200 cursor-pointer"
            title={t('creator.downloadZip')}
          >
            <Download className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span className="hidden md:inline">{t('creator.downloadZip')}</span>
          </Button>
        )}
        <Button variant="primary" onClick={onSaveClick} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent flex items-center justify-center sm:gap-2 px-2 sm:pl-3 sm:pr-2.5 cursor-pointer">
          <div className="flex items-center">
            <FloppyDisk className="w-4 h-4 sm:mr-1.5 shrink-0" />
            <span className="hidden sm:inline">{t('creator.saveToApp')}</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-sans text-emerald-900 bg-emerald-400/50 rounded-md border border-emerald-400/30">
            {isMac ? '⌘' : 'Ctrl'} S
          </kbd>
        </Button>
      </div>
    </header>
  );
};
