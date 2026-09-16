import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isSoundMuted, setSoundMuted, toggleSoundMuted, playWrongSound } from './sound';

// Mock localStorage
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  },
};

const eventListeners: Record<string, Function[]> = {};
const mockWindow = {
  addEventListener: (event: string, fn: Function) => {
    eventListeners[event] = eventListeners[event] || [];
    eventListeners[event].push(fn);
  },
  removeEventListener: (event: string, fn: Function) => {
    if (eventListeners[event]) {
      eventListeners[event] = eventListeners[event].filter(f => f !== fn);
    }
  },
  dispatchEvent: (event: { type: string; detail?: unknown }) => {
    const fns = eventListeners[event.type] || [];
    fns.forEach(fn => fn(event));
    return true;
  },
};

class MockCustomEvent {
  type: string;
  detail: unknown;
  constructor(type: string, init?: { detail?: unknown }) {
    this.type = type;
    this.detail = init?.detail;
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(globalThis, 'CustomEvent', {
  value: MockCustomEvent,
  writable: true,
});

describe('sound utils', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('defaults to unmuted', () => {
    expect(isSoundMuted()).toBe(false);
  });

  it('sets and toggles mute state correctly', () => {
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);

    const toggled = toggleSoundMuted();
    expect(toggled).toBe(false);
    expect(isSoundMuted()).toBe(false);
  });

  it('dispatches testownik-sound-toggle custom event on mute changes', () => {
    const listener = vi.fn();
    window.addEventListener('testownik-sound-toggle', listener);

    setSoundMuted(true);
    expect(listener).toHaveBeenCalledTimes(1);

    toggleSoundMuted();
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener('testownik-sound-toggle', listener);
  });

  it('does not crash when playing sounds in Node / test environment without Web Audio', () => {
    expect(() => {
      playWrongSound();
    }).not.toThrow();
  });
});
