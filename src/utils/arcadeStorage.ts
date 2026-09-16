export type SoloGameMode = 'sudden-death' | 'time-attack' | 'zen';

export interface SoloModeRecord {
  highScore: number;
  bestStreak: number;
  totalGamesPlayed: number;
  lastPlayedAt?: string;
}

export interface SoloGameResult {
  mode: SoloGameMode;
  sessionId: string;
  score: number;
  streak: number;
  totalAnswered: number;
  correctCount: number;
  durationSeconds: number;
}

export interface SaveResultResponse {
  isNewHighScore: boolean;
  isNewBestStreak: boolean;
  record: SoloModeRecord;
}

const STORAGE_PREFIX = 'testownik_arcade_record_';

function getStorageKey(mode: SoloGameMode, sessionId?: string): string {
  const scope = sessionId ? sessionId : 'global';
  return `${STORAGE_PREFIX}${mode}_${scope}`;
}

const DEFAULT_RECORD: SoloModeRecord = {
  highScore: 0,
  bestStreak: 0,
  totalGamesPlayed: 0,
};

export function getSoloModeRecord(mode: SoloGameMode, sessionId?: string): SoloModeRecord {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_RECORD };
  try {
    const raw = localStorage.getItem(getStorageKey(mode, sessionId));
    if (!raw) return { ...DEFAULT_RECORD };
    const parsed = JSON.parse(raw);
    return {
      highScore: typeof parsed.highScore === 'number' ? parsed.highScore : 0,
      bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
      totalGamesPlayed: typeof parsed.totalGamesPlayed === 'number' ? parsed.totalGamesPlayed : 0,
      lastPlayedAt: parsed.lastPlayedAt,
    };
  } catch {
    return { ...DEFAULT_RECORD };
  }
}

export function saveSoloGameResult(result: SoloGameResult): SaveResultResponse {
  const existing = getSoloModeRecord(result.mode, result.sessionId);
  const isNewHighScore = result.score > existing.highScore;
  const isNewBestStreak = result.streak > existing.bestStreak;

  const updatedRecord: SoloModeRecord = {
    highScore: Math.max(existing.highScore, result.score),
    bestStreak: Math.max(existing.bestStreak, result.streak),
    totalGamesPlayed: existing.totalGamesPlayed + 1,
    lastPlayedAt: new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(
        getStorageKey(result.mode, result.sessionId),
        JSON.stringify(updatedRecord)
      );

      // Also update global aggregate for this mode
      const globalExisting = getSoloModeRecord(result.mode);
      const globalRecord: SoloModeRecord = {
        highScore: Math.max(globalExisting.highScore, result.score),
        bestStreak: Math.max(globalExisting.bestStreak, result.streak),
        totalGamesPlayed: globalExisting.totalGamesPlayed + 1,
        lastPlayedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        getStorageKey(result.mode),
        JSON.stringify(globalRecord)
      );
    } catch (e) {
      console.error('Failed to save arcade record:', e);
    }
  }

  return {
    isNewHighScore,
    isNewBestStreak,
    record: updatedRecord,
  };
}
