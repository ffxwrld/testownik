import { type FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

interface FormatInfoModalProps {
  onClose: () => void;
}

export const FormatInfoModal: FC<FormatInfoModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('components.formatInfo.title')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={t('components.formatInfo.close')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            {t('components.formatInfo.description')}
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {t('components.formatInfo.line1Title')}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t('components.formatInfo.line1Desc')}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {t('components.formatInfo.line2Title')}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t('components.formatInfo.line2Desc')}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {t('components.formatInfo.line3Title')}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t('components.formatInfo.line3Desc')}
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {t('components.formatInfo.exampleTitle')}
              </h4>
              <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
{`X0100
Stolica Polski to:
[img]mapa.png[/img]
Kraków
Warszawa
Poznań
Wrocław`}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end bg-zinc-50 dark:bg-zinc-900/50">
          <Button variant="primary" onClick={onClose}>
            {t('components.formatInfo.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
