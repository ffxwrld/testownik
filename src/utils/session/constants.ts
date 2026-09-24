import { SessionState, SavedSessionMetadata } from '@/models/types';

export const SESSIONS_STORAGE_KEY = 'testownik_sessions_v2';
export const SESSIONS_IDB_KEY = 'testownik_sessions_db';
export const SESSIONS_META_IDB_KEY = 'testownik_sessions_meta_v1';
export const SESSION_PREFIX = 'testownik_session_';
export const CURRENT_SESSION_ID_KEY = 'testownik_current_session_id';
export const SCHEMA_VERSION = 1;

export function extractMetadata(id: string, session: SessionState): SavedSessionMetadata {
  return {
    id,
    baseName: session.baseName || 'Baza pytań',
    createdAt: session.startedAt,
    updatedAt: session.updatedAt || session.startedAt,
    totalQuestions: session.questions?.length ?? 0,
    completedQuestions: session.done?.length ?? 0,
    currentPhase: (session.phase as 'test' | 'summary') || 'test',
    targetDate: session.targetDate,
    chunkConfig: session.chunkConfig,
    folderId: session.folderId,
  };
}
