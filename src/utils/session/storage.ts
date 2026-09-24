import { get, set, del } from 'idb-keyval';
import { SessionState, SavedSessionMetadata } from '@/models/types';
import { deleteSessionImages } from '@/utils/db';
import { 
  SESSIONS_STORAGE_KEY, 
  SESSIONS_IDB_KEY, 
  SESSIONS_META_IDB_KEY, 
  SESSION_PREFIX, 
  CURRENT_SESSION_ID_KEY, 
  SCHEMA_VERSION, 
  extractMetadata 
} from './constants';
import { prepareSpacedRepetitionQueue } from './spacedRepetition';

export const _sessionCache = new Map<string, SessionState>();
export let _metaCache: SavedSessionMetadata[] | null = null;
export let _idbMigrated = false;

export function _resetSessionStorageForTesting(): void {
  _sessionCache.clear();
  _metaCache = null;
  _idbMigrated = false;
}

function generateSessionId(): string {
  return Date.now().toString(36);
}

async function ensureMigrated(): Promise<void> {
  if (_idbMigrated) return;

  try {
    const existingMeta = await get<SavedSessionMetadata[]>(SESSIONS_META_IDB_KEY);
    if (existingMeta && Array.isArray(existingMeta)) {
      _metaCache = existingMeta;
      _idbMigrated = true;
      return;
    }

    let oldSessions = await get<Record<string, SessionState>>(SESSIONS_IDB_KEY);

    if (!oldSessions) {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        try {
          oldSessions = JSON.parse(raw);
          localStorage.removeItem(SESSIONS_STORAGE_KEY);
        } catch (e) {
          console.error('Migration from localStorage failed:', e);
        }
      }
    }

    if (oldSessions && typeof oldSessions === 'object') {
      const metaList: SavedSessionMetadata[] = [];
      const promises: Promise<unknown>[] = [];

      for (const [id, session] of Object.entries(oldSessions)) {
        if (session && typeof session === 'object' && session.version === SCHEMA_VERSION) {
          const meta = extractMetadata(id, session);
          metaList.push(meta);
          _sessionCache.set(id, session);
          promises.push(set(`${SESSION_PREFIX}${id}`, session));
        }
      }

      metaList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      _metaCache = metaList;
      promises.push(set(SESSIONS_META_IDB_KEY, metaList));
      promises.push(del(SESSIONS_IDB_KEY));
      await Promise.all(promises);
    } else {
      _metaCache = [];
      await set(SESSIONS_META_IDB_KEY, []);
    }

    _idbMigrated = true;
  } catch (err) {
    console.error('Session storage migration error:', err);
    _idbMigrated = true;
  }
}

export async function saveSession(session: SessionState, sessionId?: string): Promise<string> {
  try {
    await ensureMigrated();
    const id = sessionId || generateSessionId();
    session.updatedAt = new Date().toISOString();

    _sessionCache.set(id, session);
    await set(`${SESSION_PREFIX}${id}`, session);

    const meta = extractMetadata(id, session);
    const metaList = _metaCache ? [..._metaCache] : [];
    const existingIdx = metaList.findIndex(m => m.id === id);
    if (existingIdx >= 0) {
      metaList[existingIdx] = meta;
    } else {
      metaList.unshift(meta);
    }
    metaList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    _metaCache = metaList;
    await set(SESSIONS_META_IDB_KEY, metaList);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('session-metadata-changed'));
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CURRENT_SESSION_ID_KEY, id);
    }
    return id;
  } catch (err) {
    console.warn('Could not save session:', err);
    return '';
  }
}

export async function loadSession(sessionId?: string): Promise<SessionState | null> {
  try {
    const id = sessionId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_SESSION_ID_KEY) : null);
    if (!id) return null;

    if (_sessionCache.has(id)) {
      return _sessionCache.get(id)!;
    }

    await ensureMigrated();
    let session = await get<SessionState>(`${SESSION_PREFIX}${id}`);
    
    if (!session) {
      const oldSessions = await get<Record<string, SessionState>>(SESSIONS_IDB_KEY);
      if (oldSessions && oldSessions[id]) {
        session = oldSessions[id];
        await set(`${SESSION_PREFIX}${id}`, session);
      }
    }

    if (!session || session.version !== SCHEMA_VERSION) return null;
    
    const finalSession = session.repeatMode === 'spaced' ? prepareSpacedRepetitionQueue(session) : session;
    _sessionCache.set(id, finalSession);
    return finalSession;
  } catch {
    return null;
  }
}

export async function loadAllSessions(): Promise<Record<string, SessionState>> {
  try {
    await ensureMigrated();
    const metadata = await getAllSessionMetadata();
    const result: Record<string, SessionState> = {};
    await Promise.all(
      metadata.map(async (meta) => {
        const session = await loadSession(meta.id);
        if (session) {
          result[meta.id] = session;
        }
      })
    );
    return result;
  } catch (err) {
    console.error('Failed to load sessions from IDB:', err);
    return {};
  }
}

export async function saveAllSessions(sessions: Record<string, SessionState>): Promise<void> {
  await ensureMigrated();
  const metaList: SavedSessionMetadata[] = [];
  const promises: Promise<unknown>[] = [];

  for (const [id, session] of Object.entries(sessions)) {
    if (session && typeof session === 'object') {
      _sessionCache.set(id, session);
      promises.push(set(`${SESSION_PREFIX}${id}`, session));
      metaList.push(extractMetadata(id, session));
    }
  }

  metaList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  _metaCache = metaList;
  promises.push(set(SESSIONS_META_IDB_KEY, metaList));
  await Promise.all(promises);
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await ensureMigrated();
    _sessionCache.delete(sessionId);
    await del(`${SESSION_PREFIX}${sessionId}`);

    if (_metaCache) {
      _metaCache = _metaCache.filter(m => m.id !== sessionId);
      await set(SESSIONS_META_IDB_KEY, _metaCache);
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('session-metadata-changed'));
      }
    }

    if (typeof localStorage !== 'undefined' && localStorage.getItem(CURRENT_SESSION_ID_KEY) === sessionId) {
      localStorage.removeItem(CURRENT_SESSION_ID_KEY);
    }
    
    await deleteSessionImages(sessionId);
  } catch (err) {
    console.error('Could not delete session:', err);
  }
}

export async function saveSessionEphemeral(session: SessionState, sessionId: string): Promise<string> {
  _sessionCache.set(sessionId, session);
  return sessionId;
}

export async function deleteEphemeralSession(sessionId: string): Promise<void> {
  _sessionCache.delete(sessionId);
}

export async function getAllSessionMetadata(): Promise<SavedSessionMetadata[]> {
  try {
    await ensureMigrated();
    if (_metaCache) return _metaCache;
    const meta = await get<SavedSessionMetadata[]>(SESSIONS_META_IDB_KEY);
    _metaCache = meta || [];
    return _metaCache;
  } catch (err) {
    console.error('Failed to load session metadata:', err);
    return [];
  }
}

export async function renameSession(sessionId: string, newBaseName: string): Promise<void> {
  try {
    const session = await loadSession(sessionId);
    if (!session) return;
    
    session.baseName = newBaseName;
    await saveSession(session, sessionId);
  } catch (err) {
    console.error('Could not rename session:', err);
  }
}

export function getCurrentSessionId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(CURRENT_SESSION_ID_KEY);
}
