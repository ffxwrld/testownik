import { useEffect, useState, useCallback } from 'react';

// Custom event for programmatic opening/closing
const SPOTLIGHT_EVENT = 'testownik:spotlight:toggle';

export function openSpotlight() {
  window.dispatchEvent(new CustomEvent(SPOTLIGHT_EVENT, { detail: true }));
}

export function closeSpotlight() {
  window.dispatchEvent(new CustomEvent(SPOTLIGHT_EVENT, { detail: false }));
}

export function toggleSpotlight() {
  window.dispatchEvent(new CustomEvent(SPOTLIGHT_EVENT, { detail: 'toggle' }));
}

export function useSpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoruj jeśli użytkownik pisze w inpucie
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Cmd+K lub Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      // ? dla skrótów (shift + /)
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // ESC zamyka
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'toggle') {
        setIsOpen((prev) => !prev);
      } else {
        setIsOpen(customEvent.detail);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener(SPOTLIGHT_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(SPOTLIGHT_EVENT, handleCustomEvent);
    };
  }, [isOpen]);

  return {
    isOpen,
    close: useCallback(() => setIsOpen(false), []),
    open: useCallback(() => setIsOpen(true), [])
  };
}
