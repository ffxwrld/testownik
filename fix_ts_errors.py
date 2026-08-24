import re

# 1. Fix App.tsx
with open('src/App.tsx', 'r') as f:
    app_content = f.read()

# Fix handleSaveToTestownik
app_content = app_content.replace(
    "const sessionId = saveSession(newSession);",
    "const sessionId = await saveSession(newSession);"
)

# Fix handleRestartSession
old_restart = """  const handleRestartSession = useCallback((sessionId: string, newRepeatMode?: number) => {
    const saved = loadSession(sessionId);
    if (!saved) return;
    const modeToUse = newRepeatMode ?? saved.repeatMode;
    const fresh = buildInitialSession(saved.questions, modeToUse, saved.baseName);
    saveSession(fresh, sessionId);
    setCurrentSessionId(sessionId);
    setSession(fresh);
    setPhase('test');
  }, []);"""

new_restart = """  const handleRestartSession = useCallback(async (sessionId: string, newRepeatMode?: number) => {
    const saved = await loadSession(sessionId);
    if (!saved) return;
    const modeToUse = newRepeatMode ?? saved.repeatMode;
    const fresh = buildInitialSession(saved.questions, modeToUse, saved.baseName);
    await saveSession(fresh, sessionId);
    setCurrentSessionId(sessionId);
    setSession(fresh);
    setPhase('test');
  }, []);"""
app_content = app_content.replace(old_restart, new_restart)

# Fix handleRenameSession
old_rename = """  const handleRenameSession = useCallback((sessionId: string, newName: string) => {
    renameSession(sessionId, newName);
  }, []);"""

new_rename = """  const handleRenameSession = useCallback(async (sessionId: string, newName: string) => {
    await renameSession(sessionId, newName);
  }, []);"""
app_content = app_content.replace(old_rename, new_rename)

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

# 2. Fix HomeView.tsx
with open('src/components/HomeView.tsx', 'r') as f:
    home_content = f.read()

old_state = """  const [savedSessions, setSavedSessions] = useState(
    getAllSessionMetadata()
  );"""

new_state = """  const [savedSessions, setSavedSessions] = useState<SavedSessionMetadata[]>([]);"""
home_content = home_content.replace(old_state, new_state)

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(home_content)

