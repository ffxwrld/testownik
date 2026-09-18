import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '../test/hookTester';
import { useMultiplayer } from './useMultiplayer';

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        if (cb) cb('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
      send: vi.fn().mockResolvedValue('ok'),
      track: vi.fn().mockResolvedValue('ok'),
      presenceState: vi.fn(() => ({})),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('./useProfile', () => ({
  useProfile: () => ({
    profile: {
      id: 'host-123',
      username: 'TesterHost',
      avatar_url: 'https://example.com/avatar.png',
    },
    loading: false,
    updateProfile: vi.fn(),
  }),
}));

describe('useMultiplayer Poker Mode', () => {
  it('switches game mode to poker correctly', () => {
    const { result } = renderHook(() => useMultiplayer());

    act(() => {
      result.current.setGameMode('poker');
    });

    expect(result.current.gameMode).toBe('poker');
    expect(result.current.pokerState.phase).toBe('wager');
  });

  it('starts poker game and initializes rounds and chips', async () => {
    const { result } = renderHook(() => useMultiplayer());

    await act(async () => {
      await result.current.joinRoom('654321', true);
    });

    act(() => {
      result.current.setGameMode('poker');
      result.current.startRace(5);
    });

    expect(result.current.raceStarted).toBe(true);
    expect(result.current.pokerState.currentRound).toBe(1);
    expect(result.current.pokerState.totalRounds).toBe(5);
    expect(result.current.pokerState.phase).toBe('wager');
    expect(result.current.pokerState.chips['host-123']).toBe(1000);
  });

  it('handles submitPokerWager and optimistic updates', async () => {
    const { result } = renderHook(() => useMultiplayer());

    await act(async () => {
      await result.current.joinRoom('654321', true);
    });

    act(() => {
      result.current.setGameMode('poker');
      result.current.startRace(5);
    });

    act(() => {
      result.current.submitPokerWager(250);
    });

    expect(result.current.pokerState.wagers['host-123']).toBe(250);
  });

  it('advances to answering when all players have wagered', async () => {
    const { result } = renderHook(() => useMultiplayer());

    await act(async () => {
      await result.current.joinRoom('654321', true);
    });

    act(() => {
      result.current.setGameMode('poker');
      result.current.startRace(5);
    });

    act(() => {
      result.current.submitPokerWager(200);
    });

    expect(result.current.pokerState.phase).toBe('answering');
    expect(result.current.pokerState.timeLeftSeconds).toBe(15);
  });

  it('advances to showdown and calculates chip delta on answer', async () => {
    const { result } = renderHook(() => useMultiplayer());

    await act(async () => {
      await result.current.joinRoom('654321', true);
    });

    act(() => {
      result.current.setGameMode('poker');
      result.current.startRace(5);
    });

    act(() => {
      result.current.submitPokerWager(300);
    });

    expect(result.current.pokerState.phase).toBe('answering');

    act(() => {
      result.current.submitPokerAnswer([1], true);
    });

    expect(result.current.pokerState.phase).toBe('showdown');
    expect(result.current.pokerState.chips['host-123']).toBe(1300);
    expect(result.current.pokerState.roundResults?.['host-123']).toEqual({
      isCorrect: true,
      chipDelta: 300,
    });
  });
});
