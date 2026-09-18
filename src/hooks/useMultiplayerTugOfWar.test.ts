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

describe('useMultiplayer Tug of War & Game Modes', () => {
  it('initializes with default gameMode race and centered rope', () => {
    const { result } = renderHook(() => useMultiplayer());

    expect(result.current.gameMode).toBe('race');
    expect(result.current.tugState.ropePosition).toBe(0);
    expect(result.current.tugState.timeLeftSeconds).toBe(90);
    expect(result.current.tugState.winner).toBeNull();
  });

  it('changes game mode to tug_of_war when setGameMode is called by host', () => {
    const { result } = renderHook(() => useMultiplayer());

    act(() => {
      result.current.setGameMode('tug_of_war');
    });

    expect(result.current.gameMode).toBe('tug_of_war');
  });

  it('calculates pull delta and moves rope on pullRope', async () => {
    const { result } = renderHook(() => useMultiplayer());

    await act(async () => {
      await result.current.joinRoom('123456', true);
    });

    act(() => {
      result.current.setGameMode('tug_of_war');
      result.current.startRace();
    });

    // Host is Team A (index 0), so correct answer pulls towards -100 (-10 delta)
    act(() => {
      result.current.pullRope(true, 1);
    });

    expect(result.current.tugState.ropePosition).toBe(-10);

    // Combo streak >= 3 pulls with -15
    act(() => {
      result.current.pullRope(true, 3);
    });

    expect(result.current.tugState.ropePosition).toBe(-25);

    // Wrong answer slips towards opponent (+12)
    act(() => {
      result.current.pullRope(false, 0);
    });

    expect(result.current.tugState.ropePosition).toBe(-13);
  });
});
