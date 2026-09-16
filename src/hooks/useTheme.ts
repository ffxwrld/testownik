import { useState, useEffect, useCallback } from 'react';

export type ColorTheme = 'blue' | 'violet' | 'rose' | 'emerald' | 'amber';

export const THEMES: { id: ColorTheme; name: string; colorClass: string }[] = [
  { id: 'blue', name: 'Niebieski', colorClass: 'bg-blue-500' },
  { id: 'violet', name: 'Fioletowy', colorClass: 'bg-violet-500' },
  { id: 'rose', name: 'Różowy', colorClass: 'bg-rose-500' },
  { id: 'emerald', name: 'Szmaragdowy', colorClass: 'bg-emerald-500' },
  { id: 'amber', name: 'Bursztynowy', colorClass: 'bg-amber-500' },
];

export function getStoredTheme(): ColorTheme {
  if (typeof window === 'undefined') return 'blue';
  try {
    const stored = localStorage.getItem('testownik_theme') as ColorTheme | null;
    if (stored && THEMES.some(t => t.id === stored)) return stored;
  } catch {}
  return 'blue';
}

export function getStoredDark(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('testownik_dark');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {}
  return false;
}

export function applyThemeToDom(theme: ColorTheme, isDark: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Dark mode
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Accent color theme
  if (theme === 'blue') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ColorTheme>(getStoredTheme);
  const [isDark, setIsDarkState] = useState<boolean>(getStoredDark);

  // Synchronize with DOM and localStorage on state change
  useEffect(() => {
    applyThemeToDom(theme, isDark);
    try {
      localStorage.setItem('testownik_theme', theme);
      localStorage.setItem('testownik_dark', String(isDark));
    } catch {}
  }, [theme, isDark]);

  // Listen to OS prefers-color-scheme when user hasn't explicitly set a preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem('testownik_dark');
        if (stored === null) {
          setIsDarkState(e.matches);
        }
      } catch {}
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((newTheme: ColorTheme) => {
    setThemeState(newTheme);
  }, []);

  const setDark = useCallback((dark: boolean) => {
    setIsDarkState(dark);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDarkState(prev => !prev);
  }, []);

  return {
    theme,
    setTheme,
    isDark,
    setDark,
    toggleDark,
    themes: THEMES,
  };
}
