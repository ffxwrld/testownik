import { describe, it, expect, beforeEach } from 'vitest';
import { getSoloModeRecord, saveSoloGameResult } from './arcadeStorage';

// Setup mock localStorage in Node environment
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

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('arcadeStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('returns default zero records if nothing is saved', () => {
    const record = getSoloModeRecord('sudden-death', 'session-123');
    expect(record.highScore).toBe(0);
    expect(record.bestStreak).toBe(0);
    expect(record.totalGamesPlayed).toBe(0);
  });

  it('saves result and detects new high score and new best streak', () => {
    const res1 = saveSoloGameResult({
      mode: 'sudden-death',
      sessionId: 'session-123',
      score: 500,
      streak: 5,
      totalAnswered: 6,
      correctCount: 5,
      durationSeconds: 30,
    });

    expect(res1.isNewHighScore).toBe(true);
    expect(res1.isNewBestStreak).toBe(true);
    expect(res1.record.highScore).toBe(500);
    expect(res1.record.bestStreak).toBe(5);
    expect(res1.record.totalGamesPlayed).toBe(1);

    const res2 = saveSoloGameResult({
      mode: 'sudden-death',
      sessionId: 'session-123',
      score: 300,
      streak: 7,
      totalAnswered: 8,
      correctCount: 7,
      durationSeconds: 40,
    });

    expect(res2.isNewHighScore).toBe(false);
    expect(res2.isNewBestStreak).toBe(true);
    expect(res2.record.highScore).toBe(500);
    expect(res2.record.bestStreak).toBe(7);
    expect(res2.record.totalGamesPlayed).toBe(2);
  });
});
