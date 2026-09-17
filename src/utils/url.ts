/**
 * Zwraca bezpośredni adres URL do dołączenia do pokoju multiplayer.
 * W przeglądarce używa bieżącego origin, a w Electronie (file://) skonfigurowanego VITE_PUBLIC_APP_URL lub fallbacku domenowego.
 */
export function getRoomJoinUrl(roomCode: string): string {
  if (!roomCode) return '';

  const isElectron = typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    window.location.origin === 'null' ||
    Boolean(window.electron)
  );

  let baseUrl = 'https://testownik.app';

  if (isElectron) {
    if (import.meta.env?.VITE_PUBLIC_APP_URL) {
      baseUrl = import.meta.env.VITE_PUBLIC_APP_URL;
    }
  } else if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    baseUrl = window.location.origin;
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/multiplayer?room=${encodeURIComponent(roomCode.trim().toUpperCase())}`;
}

/**
 * Zwraca bezpośredni adres URL do odebrania bazy pytań P2P.
 * Prowadzi do widoku nauki z parametrem share=XXXXXX.
 */
export function getShareJoinUrl(shareCode: string): string {
  if (!shareCode) return '';

  const isElectron = typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    window.location.origin === 'null' ||
    Boolean(window.electron)
  );

  let baseUrl = 'https://testownik.app';

  if (isElectron) {
    if (import.meta.env?.VITE_PUBLIC_APP_URL) {
      baseUrl = import.meta.env.VITE_PUBLIC_APP_URL;
    }
  } else if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    baseUrl = window.location.origin;
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/nauka?share=${encodeURIComponent(shareCode.trim().toUpperCase())}`;
}

