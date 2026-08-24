import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update useEffect for initial load
old_effect = """  useEffect(() => {
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      const saved = loadSession(sessionId);
      if (saved) {
        setCurrentSessionId(sessionId);
        setSession(saved);
      }
    }
  }, []);"""

new_effect = """  useEffect(() => {
    const init = async () => {
      const sessionId = getCurrentSessionId();
      if (sessionId) {
        const saved = await loadSession(sessionId);
        if (saved) {
          setCurrentSessionId(sessionId);
          setSession(saved);
        }
      }
    };
    init();
  }, []);"""
content = content.replace(old_effect, new_effect)

# 2. Update handleStartSession
old_start = """  const handleStartSession = useCallback(
    async (questions: Question[], repeatMode: number, baseName: string, images: Record<string, Blob> = {}) => {
      const newSession = buildInitialSession(questions, repeatMode, baseName);
      const sessionId = saveSession(newSession);
      
      if (Object.keys(images).length > 0) {
        const { saveSessionImages } = await import('./utils/db');
        await saveSessionImages(sessionId, images);
      }

      setCurrentSessionId(sessionId);
      setSession(newSession);
      setPhase('test');
    },
    []
  );"""

new_start = """  const handleStartSession = useCallback(
    async (questions: Question[], repeatMode: number, baseName: string, images: Record<string, Blob> = {}) => {
      const newSession = buildInitialSession(questions, repeatMode, baseName);
      const sessionId = await saveSession(newSession);
      
      if (Object.keys(images).length > 0) {
        const { saveSessionImages } = await import('./utils/db');
        await saveSessionImages(sessionId, images);
      }

      setCurrentSessionId(sessionId);
      setSession(newSession);
      setPhase('test');
    },
    []
  );"""
content = content.replace(old_start, new_start)

# 3. Update handleResumeSession
old_resume = """  const handleResumeSession = useCallback((sessionId: string) => {
    const saved = loadSession(sessionId);
    if (!saved) return;
    setCurrentSessionId(sessionId);
    setSession(saved);
    setPhase(saved.phase === 'summary' ? 'summary' : 'test');
  }, []);"""

new_resume = """  const handleResumeSession = useCallback(async (sessionId: string) => {
    const saved = await loadSession(sessionId);
    if (!saved) return;
    setCurrentSessionId(sessionId);
    setSession(saved);
    setPhase(saved.phase === 'summary' ? 'summary' : 'test');
  }, []);"""
content = content.replace(old_resume, new_resume)

# 4. Update handleDeleteSession
old_delete = """  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    if (sessionId === currentSessionId) {
      setCurrentSessionId(null);
      setSession(null);
      setPhase('home');
    }
  }, [currentSessionId]);"""

new_delete = """  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    if (sessionId === currentSessionId) {
      setCurrentSessionId(null);
      setSession(null);
      setPhase('home');
    }
  }, [currentSessionId]);"""
content = content.replace(old_delete, new_delete)

# 5. Update handleEditInCreator
old_edit = """  const handleEditInCreator = useCallback(async (sessionId: string) => {
    const saved = loadSession(sessionId);
    if (!saved) return;"""

new_edit = """  const handleEditInCreator = useCallback(async (sessionId: string) => {
    const saved = await loadSession(sessionId);
    if (!saved) return;"""
content = content.replace(old_edit, new_edit)

with open('src/App.tsx', 'w') as f:
    f.write(content)

