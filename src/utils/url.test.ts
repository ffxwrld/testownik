import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRoomJoinUrl, getShareJoinUrl } from './url';

describe('getRoomJoinUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://demo.testownik.app',
        protocol: 'https:',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('zwraca pusty ciąg gdy kod pokoju jest pusty', () => {
    expect(getRoomJoinUrl('')).toBe('');
  });

  it('generuje poprawny URL z origin przeglądarki', () => {
    const url = getRoomJoinUrl('123456');
    expect(url).toBe('https://demo.testownik.app/multiplayer?room=123456');
  });

  it('zamienia małe litery w kodzie na wielkie i usuwa spacje', () => {
    const url = getRoomJoinUrl(' ab12cd ');
    expect(url).toBe('https://demo.testownik.app/multiplayer?room=AB12CD');
  });

  it('używa fallbacku domenowego w środowisku Electron (file://)', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'null',
        protocol: 'file:',
      },
      electron: { app: { name: 'Testownik' } },
    });

    const url = getRoomJoinUrl('999888');
    expect(url).toBe('https://testownik.app/multiplayer?room=999888');
  });

  it('obsługuje brak globalnego window bez błędu', () => {
    vi.stubGlobal('window', undefined);
    const url = getRoomJoinUrl('777666');
    expect(url).toBe('https://testownik.app/multiplayer?room=777666');
  });
});

describe('getShareJoinUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://demo.testownik.app',
        protocol: 'https:',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('zwraca pusty ciąg gdy kod transferu jest pusty', () => {
    expect(getShareJoinUrl('')).toBe('');
  });

  it('generuje poprawny URL do odbioru paczki na /nauka?share=...', () => {
    const url = getShareJoinUrl('654321');
    expect(url).toBe('https://demo.testownik.app/nauka?share=654321');
  });

  it('używa fallbacku domenowego w środowisku Electron', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'null',
        protocol: 'file:',
      },
      electron: { app: { name: 'Testownik' } },
    });

    const url = getShareJoinUrl('333444');
    expect(url).toBe('https://testownik.app/nauka?share=333444');
  });
});

