import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '../test/hookTester';
import { useP2PTransfer } from './useP2PTransfer';
import { SavedSessionMetadata } from '../models/types';

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        if (cb) cb('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
      send: vi.fn().mockResolvedValue(true),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../utils/session', () => ({
  loadSession: vi.fn().mockResolvedValue({
    id: 'test-session-1',
    baseName: 'Biologia Test',
    questions: [],
    queue: [],
    done: [],
    doneStats: [],
    repeatMode: 1,
    elapsedSeconds: 0,
    totalFirstAttempts: 0,
    totalFirstCorrect: 0,
    startedAt: new Date().toISOString(),
    phase: 'test',
    currentQuestionIndex: 0,
    shuffledAnswerOrder: [],
  }),
}));

vi.mock('../utils/parser', () => ({
  exportSessionToZip: vi.fn().mockResolvedValue(new Blob(['mock-zip'])),
  importSessionFromZip: vi.fn().mockResolvedValue({
    sessionId: 'imported-1',
    session: {
      id: 'imported-1',
      baseName: 'Biologia Test',
      questions: [],
    },
  }),
}));

const mockSessionMeta: SavedSessionMetadata = {
  id: 'test-session-1',
  baseName: 'Biologia Test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  totalQuestions: 10,
  completedQuestions: 5,
  currentPhase: 'test',
};

describe('useP2PTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with idle status and clean values', () => {
    const { result } = renderHook(() => useP2PTransfer());
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.roomCode).toBeNull();
  });

  it('starts sending, enters waiting_for_peer, and generates a 6-digit room code', async () => {
    const { result } = renderHook(() => useP2PTransfer());

    let code = '';
    await act(async () => {
      code = await result.current.startSending(mockSessionMeta);
    });
    expect(result.current.status).toBe('waiting_for_peer');
    expect(result.current.roomCode).toMatch(/^\d{6}$/);
    expect(code).toBe(result.current.roomCode);
  });

  it('rejects invalid room code format when receiving', async () => {
    const { result } = renderHook(() => useP2PTransfer());

    let res: unknown = undefined;
    await act(async () => {
      res = await result.current.startReceiving('123'); // too short
    });
    expect(res).toBeNull();
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toContain('6 cyfr');
  });

  it('resets state to idle on cancel', async () => {
    const { result } = renderHook(() => useP2PTransfer());

    await act(async () => {
      await result.current.startSending(mockSessionMeta);
    });
    expect(result.current.status).toBe('waiting_for_peer');

    act(() => {
      result.current.cancel();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.roomCode).toBeNull();
    expect(result.current.progress).toBe(0);
  });
});
