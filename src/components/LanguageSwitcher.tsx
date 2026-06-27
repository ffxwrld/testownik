import { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(newLang);
    localStorage.setItem('testownik_language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-2 h-6 flex items-center justify-center rounded-md text-xs font-semibold text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150"
      title={i18n.language === 'pl' ? 'Switch to English' : 'Przełącz na Polski'}
      aria-label="Toggle language"
    >
      {i18n.language === 'pl' ? 'PL' : 'EN'}
    </button>
  );
};
