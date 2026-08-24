import re

with open('src/utils/session.ts', 'r') as f:
    content = f.read()

# 1. Add idb-keyval import
if "import { get, set } from 'idb-keyval';" not in content:
    content = "import { get, set } from 'idb-keyval';\n" + content

# 2. Rewrite cache and loadAllSessions
old_cache_logic = """let _sessionsCache: Record<string, SessionState> | null = null;
let _sessionsCacheRaw: string | null = null;

function loadAllSessions(): Record<string, SessionState> {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return {};
    if (raw === _sessionsCacheRaw && _sessionsCache) return _sessionsCache;
    _sessionsCache = JSON.parse(raw) as Record<string, SessionState>;
    _sessionsCacheRaw = raw;
    return _sessionsCache;
  } catch {
    return {};
  }
}

function invalidateSessionsCache(): void {
  _sessionsCache = null;
  _sessionsCacheRaw = null;
}"""

new_cache_logic = """const SESSIONS_IDB_KEY = 'testownik_sessions_db';
let _sessionsCache: Record<string, SessionState> | null = null;
let _idbMigrated = false;

export async function loadAllSessions(): Promise<Record<string, SessionState>> {
  if (_sessionsCache) return _sessionsCache;

  try {
    let sessions = await get<Record<string, SessionState>>(SESSIONS_IDB_KEY);

    if (!sessions && !_idbMigrated) {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          await set(SESSIONS_IDB_KEY, parsed);
          sessions = parsed;
          localStorage.removeItem(SESSIONS_STORAGE_KEY);
        } catch (e) {
          console.error('Migration failed:', e);
        }
      }
      _idbMigrated = true;
    }

    if (!sessions) sessions = {};
    _sessionsCache = sessions;
    return sessions;
  } catch (err) {
    console.error('Failed to load sessions from IDB:', err);
    return _sessionsCache || {};
  }
}

async function saveAllSessions(sessions: Record<string, SessionState>) {
  _sessionsCache = sessions;
  await set(SESSIONS_IDB_KEY, sessions);
}

function invalidateSessionsCache(): void {
  _sessionsCache = null;
}"""
content = content.replace(old_cache_logic, new_cache_logic)

# 3. Rewrite saveSession
old_saveSession = """export function saveSession(session: SessionState, sessionId?: string): string {
  try {
    const id = sessionId || generateSessionId();
    const sessions = loadAllSessions();
    sessions[id] = session;
    const serialized = JSON.stringify(sessions);
    localStorage.setItem(SESSIONS_STORAGE_KEY, serialized);
    invalidateSessionsCache();
    localStorage.setItem(CURRENT_SESSION_ID_KEY, id);
    return id;
  } catch (err) {
    console.warn('Could not save session:', err);
    return '';
  }
}"""

new_saveSession = """export async function saveSession(session: SessionState, sessionId?: string): Promise<string> {
  try {
    const id = sessionId || generateSessionId();
    const sessions = await loadAllSessions();
    sessions[id] = session;
    await saveAllSessions(sessions);
    localStorage.setItem(CURRENT_SESSION_ID_KEY, id);
    return id;
  } catch (err) {
    console.warn('Could not save session:', err);
    return '';
  }
}"""
content = content.replace(old_saveSession, new_saveSession)

# 4. Rewrite loadSession
old_loadSession = """export function loadSession(sessionId?: string): SessionState | null {
  try {
    const id = sessionId || localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!id) return null;
    
    const sessions = loadAllSessions();
    const session = sessions[id];
    if (!session) return null;
    
    if (session.version !== SCHEMA_VERSION) return null;
    return session;
  } catch {
    return null;
  }
}"""

new_loadSession = """export async function loadSession(sessionId?: string): Promise<SessionState | null> {
  try {
    const id = sessionId || localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!id) return null;
    
    const sessions = await loadAllSessions();
    const session = sessions[id];
    if (!session) return null;
    
    if (session.version !== SCHEMA_VERSION) return null;
    return session;
  } catch {
    return null;
  }
}"""
content = content.replace(old_loadSession, new_loadSession)

# 5. Rewrite deleteSession
old_deleteSession = """export function deleteSession(sessionId: string): void {
  try {
    const sessions = loadAllSessions();
    delete sessions[sessionId];
    const serialized = JSON.stringify(sessions);
    localStorage.setItem(SESSIONS_STORAGE_KEY, serialized);
    invalidateSessionsCache();
    
    deleteSessionImages(sessionId).catch(err => console.warn('Failed to delete images:', err));

    const currentId = localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (currentId === sessionId) {
      localStorage.removeItem(CURRENT_SESSION_ID_KEY);
    }
  } catch (err) {
    console.warn('Could not delete session:', err);
  }
}"""

new_deleteSession = """export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const sessions = await loadAllSessions();
    delete sessions[sessionId];
    await saveAllSessions(sessions);
    
    deleteSessionImages(sessionId).catch(err => console.warn('Failed to delete images:', err));

    const currentId = localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (currentId === sessionId) {
      localStorage.removeItem(CURRENT_SESSION_ID_KEY);
    }
  } catch (err) {
    console.warn('Could not delete session:', err);
  }
}"""
content = content.replace(old_deleteSession, new_deleteSession)

# 6. Rewrite getAllSessionMetadata
old_getAllSessionMetadata = """export function getAllSessionMetadata(): SavedSessionMetadata[] {
  try {
    const sessions = loadAllSessions();
    return Object.entries(sessions)
      .map(([id, session]) => ({
        id,
        baseName: session.baseName || 'Baza pytań',
        createdAt: session.startedAt,
        totalQuestions: session.questions.length,
        completedQuestions: session.done.length,
        currentPhase: session.phase as 'test' | 'summary',
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}"""

new_getAllSessionMetadata = """export async function getAllSessionMetadata(): Promise<SavedSessionMetadata[]> {
  try {
    const sessions = await loadAllSessions();
    return Object.entries(sessions)
      .map(([id, session]) => ({
        id,
        baseName: session.baseName || 'Baza pytań',
        createdAt: session.startedAt,
        totalQuestions: session.questions.length,
        completedQuestions: session.done.length,
        currentPhase: session.phase as 'test' | 'summary',
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}"""
content = content.replace(old_getAllSessionMetadata, new_getAllSessionMetadata)

# 7. Rewrite renameSession
old_renameSession = """export function renameSession(sessionId: string, newBaseName: string): void {
  try {
    const sessions = loadAllSessions();
    if (sessions[sessionId]) {
      sessions[sessionId] = { ...sessions[sessionId], baseName: newBaseName };
      const serialized = JSON.stringify(sessions);
      localStorage.setItem(SESSIONS_STORAGE_KEY, serialized);
      invalidateSessionsCache();
    }
  } catch (err) {
    console.warn('Could not rename session:', err);
  }
}"""

new_renameSession = """export async function renameSession(sessionId: string, newBaseName: string): Promise<void> {
  try {
    const sessions = await loadAllSessions();
    if (sessions[sessionId]) {
      sessions[sessionId] = { ...sessions[sessionId], baseName: newBaseName };
      await saveAllSessions(sessions);
    }
  } catch (err) {
    console.warn('Could not rename session:', err);
  }
}"""
content = content.replace(old_renameSession, new_renameSession)

with open('src/utils/session.ts', 'w') as f:
    f.write(content)

