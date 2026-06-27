import { type FC, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const THEMES = [
  { id: 'blue', name: 'Niebieski', colorClass: 'bg-blue-500' },
  { id: 'violet', name: 'Fioletowy', colorClass: 'bg-violet-500' },
  { id: 'rose', name: 'Różowy', colorClass: 'bg-rose-500' },
  { id: 'emerald', name: 'Szmaragdowy', colorClass: 'bg-emerald-500' },
  { id: 'amber', name: 'Bursztynowy', colorClass: 'bg-amber-500' },
];

export const ThemePicker: FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'blue';
    const stored = localStorage.getItem('testownik_theme');
    return stored || 'blue';
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'blue') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('testownik_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
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

  const activeThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div className="relative flex items-center" ref={pickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 group"
        aria-label={t('theme.selectTheme')}
        title={t('theme.selectTheme')}
      >
        <div className={`w-3.5 h-3.5 rounded-full ${activeThemeObj.colorClass} shadow-sm group-hover:scale-110 transition-transform duration-200 ring-2 ring-transparent group-hover:ring-zinc-200 dark:group-hover:ring-zinc-700`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 -translate-y-2 mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-2 flex gap-2 animate-fadeIn z-50">
          {THEMES.map((themeItem) => (
            <button
              key={themeItem.id}
              onClick={() => {
                setTheme(themeItem.id);
                setIsOpen(false);
              }}
              title={t(`theme.colors.${themeItem.id}`)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${
                theme === themeItem.id ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-400 dark:ring-zinc-500' : 'hover:scale-110'
              }`}
            >
              <div className={`w-6 h-6 rounded-full ${themeItem.colorClass} shadow-sm`} />
            </button>
          ))}
          <div className="absolute -bottom-1.5 right-2 w-3 h-3 bg-white dark:bg-zinc-900 border-b border-r border-zinc-200 dark:border-zinc-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
};
