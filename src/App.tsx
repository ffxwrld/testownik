import { useState, useEffect, useCallback, FC } from 'react';
import { SessionState, Question } from './models/types';
import {
  buildInitialSession,
  loadSession,
  saveSession,
  deleteSession,
  getCurrentSessionId,
  renameSession,
} from './utils/session';
import { HomeView } from './components/HomeView';
import { TestView } from './components/TestView';
import { SummaryView } from './components/SummaryView';
import { CreatorView, EditingQuestion, EditingAnswer } from './components/CreatorView';
import { DarkModeToggle } from './components/DarkModeToggle';
import { ThemePicker } from './components/ThemePicker';
import { FormatInfoModal } from './components/FormatInfoModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

type AppPhase = 'home' | 'test' | 'summary' | 'creator';

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const FOOTER_HEIGHT_PX = 36;

function applyZoom(level: number): number {
  const clamped = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level)) * 10) / 10;
  // Zoom the html element — the browser always stretches html to fill the full
  // viewport, so zooming it never leaves an empty black area behind.
  document.documentElement.style.zoom = String(clamped);
  localStorage.setItem('testownik_zoom', String(clamped));
  return clamped;
}

const UpdaterNotification: FC = () => {
  const { t } = useTranslation();
  const [updateState, setUpdateState] = useState<'idle' | 'downloading' | 'ready' | 'mac-available'>('idle');
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // @ts-ignore
    if (window.electron?.updater) {
      // @ts-ignore
      window.electron.updater.onUpdateAvailable(() => setUpdateState('downloading'));
      // @ts-ignore
      window.electron.updater.onUpdateDownloaded(() => setUpdateState('ready'));
      // @ts-ignore
      if (window.electron.updater.onUpdateAvailableMac) {
        // @ts-ignore
        window.electron.updater.onUpdateAvailableMac(() => setUpdateState('mac-available'));
      }
    }
  }, []);

  if (updateState === 'idle' || closed) return null;

  return (
    <div className="fixed bottom-12 right-6 z-50 bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
      <button 
        onClick={() => setClosed(true)} 
        className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="flex items-start gap-3 mt-1">
        <div className="mt-0.5 flex-shrink-0 text-blue-500">
          <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
            {updateState === 'downloading' ? t('updater.downloading') : 
             updateState === 'ready' ? t('updater.ready') : 
             t('updater.macAvailable')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            {updateState === 'downloading' 
              ? t('updater.downloadingDesc')
              : updateState === 'ready'
              ? t('updater.readyDesc')
              : t('updater.macAvailableDesc')}
          </p>
          {updateState === 'ready' && (
            <button
              // @ts-ignore
              onClick={() => window.electron.updater.restartApp()}
              className="mt-3 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors w-full shadow-sm"
            >
              {t('updater.restartBtn')}
            </button>
          )}
          {updateState === 'mac-available' && (
            <button
              onClick={() => window.open('https://github.com/ffxwrld/testownik/releases/latest', '_blank')}
              className="mt-3 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors w-full shadow-sm"
            >
              {t('updater.downloadBtn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const App: FC = () => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<AppPhase>('home');
  const [session, setSession] = useState<SessionState | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [homeTab, setHomeTab] = useState<'new'|'saved'>('new');
  const [creatorInitialQuestions, setCreatorInitialQuestions] = useState<EditingQuestion[] | null>(null);
  const [creatorInitialBaseName, setCreatorInitialBaseName] = useState<string | null>(null);
  const [creatorInitialImages, setCreatorInitialImages] = useState<Record<string, Blob> | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const stored = localStorage.getItem('testownik_zoom');
    return stored ? parseFloat(stored) : 1;
  });

  const [showFormatInfo, setShowFormatInfo] = useState(false);

  useEffect(() => {
    document.documentElement.style.zoom = String(zoomLevel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoomLevel(prev => applyZoom(prev + ZOOM_STEP));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoomLevel(prev => applyZoom(prev - ZOOM_STEP));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoomLevel(applyZoom(1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      const saved = loadSession(sessionId);
      if (saved) {
        setCurrentSessionId(sessionId);
        setSession(saved);
      }
    }
  }, []);

  const handleStartSession = useCallback(
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
  );

  const handleResumeSession = useCallback((sessionId: string) => {
    const saved = loadSession(sessionId);
    if (!saved) return;
    setCurrentSessionId(sessionId);
    setSession(saved);
    setPhase(saved.phase === 'summary' ? 'summary' : 'test');
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    if (sessionId === currentSessionId) {
      setCurrentSessionId(null);
      setSession(null);
      setPhase('home');
    }
  }, [currentSessionId]);

  const handleEditInCreator = useCallback(async (sessionId: string) => {
    const saved = loadSession(sessionId);
    if (!saved) return;
    
    // Temporary mapping to avoid importing EditingQuestion type

    const editingQuestions = saved.questions.map((q, idx) => {
      const maskLine = q.id.split('_')[0] || 'X';
      const category = maskLine.charAt(0).toUpperCase() || 'X';
      let fn = q.sourceFile || '';
      if (fn.toLowerCase().endsWith('.txt')) fn = fn.slice(0, -4);
      
      return {
        id: Math.random().toString(36).slice(2, 9),
        filename: fn || `pytanie_${idx+1}`,
        text: q.text || '',
        category: category,
        answers: q.answers.map(a => ({
          id: Math.random().toString(36).slice(2, 9),
          text: a.text,
          isCorrect: a.isCorrect
        }))
      };
    });
    
    const { getAllSessionImages } = await import('./utils/db');
    const images = await getAllSessionImages(sessionId);
    
    setCreatorInitialQuestions(editingQuestions);
    setCreatorInitialBaseName(saved.baseName);
    setCreatorInitialImages(images);
    setPhase('creator');
  }, []);

  const handleSaveToTestownik = useCallback(async (editingQuestions: EditingQuestion[], baseName: string, images: Record<string, Blob> = {}) => {
    try {
      const questions: Question[] = editingQuestions.map((eq, idx) => {
        const binary = eq.answers.map((a: EditingAnswer) => a.isCorrect ? '1' : '0').join('');
        const maskLine = (eq.category || 'X') + binary;
        const filename = (eq.filename || '').trim() || `pytanie_${idx+1}`;
        const baseId = maskLine + '_' + filename.replace(/[^a-zA-Z0-9_-]/g, '_');
        const correctIndices = eq.answers.map((a: EditingAnswer, i: number) => a.isCorrect ? i : -1).filter((i: number) => i !== -1);
        
        return {
          id: baseId,
          sourceFile: filename + '.txt',
          text: eq.text,
          answers: eq.answers.map((a: EditingAnswer, i: number) => ({ id: `${filename}-ans-${i}`, text: a.text, isCorrect: a.isCorrect })),
          correctAnswerIndex: correctIndices[0] ?? 0,
          correctAnswerIndices: correctIndices
        };
      });
      
      const newSession = buildInitialSession(questions, 1, baseName);
      const sessionId = saveSession(newSession);
      
      if (Object.keys(images).length > 0) {
        const { saveSessionImages } = await import('./utils/db');
        await saveSessionImages(sessionId, images);
      }

      setCurrentSessionId(sessionId);
      setSession(newSession);
      
      setCreatorInitialQuestions(null);
      setCreatorInitialBaseName(null);
      setCreatorInitialImages(null);
      setHomeTab('saved');
      setPhase('home');
    } catch (err: any) {
      console.error(err);
      alert('Wystąpił błąd podczas zapisywania: ' + err.message);
    }
  }, []);

  const handleSessionUpdate = useCallback((updated: SessionState) => {
    setSession(updated);
    if (updated.phase === 'summary') {
      setPhase('summary');
    }
  }, []);

  const handleQuit = useCallback(() => {
    setPhase('home');
  }, []);

  const handleNewTest = useCallback(() => {
    setCurrentSessionId(null);
    setSession(null);
    setPhase('home');
  }, []);

  const handleRestartSession = useCallback((sessionId: string, newRepeatMode?: number) => {
    const saved = loadSession(sessionId);
    if (!saved) return;
    const modeToUse = newRepeatMode ?? saved.repeatMode;
    const fresh = buildInitialSession(saved.questions, modeToUse, saved.baseName);
    saveSession(fresh, sessionId);
    setCurrentSessionId(sessionId);
    setSession(fresh);
    setPhase('test');
  }, []);

  const handleRenameSession = useCallback((sessionId: string, newName: string) => {
    renameSession(sessionId, newName);
    if (sessionId === currentSessionId && session) {
      setSession({ ...session, baseName: newName });
    }
  }, [currentSessionId, session]);

  const displayPhase: AppPhase =
    session?.phase === 'summary' && phase !== 'home' ? 'summary' : phase;

  const content = (() => {
    if (displayPhase === 'test' && session && currentSessionId) {
      return (
        <TestView
          session={session}
          sessionId={currentSessionId}
          onSessionUpdate={handleSessionUpdate}
          onQuit={handleQuit}
        />
      );
    }
    if (displayPhase === 'summary' && session && currentSessionId) {
      return (
        <SummaryView
          session={session}
          sessionId={currentSessionId}
          onNewTest={handleNewTest}
        />
      );
    }
    if (displayPhase === 'creator') {
      return (
        <CreatorView 
          onQuit={() => {
            setCreatorInitialQuestions(null);
            setCreatorInitialBaseName(null);
            setCreatorInitialImages(null);
            setPhase('home');
          }}
          initialQuestions={creatorInitialQuestions || undefined}
          initialBaseName={creatorInitialBaseName || undefined}
          initialImages={creatorInitialImages || undefined}
          onSaveToTestownik={handleSaveToTestownik}
        />
      );
    }
    return (
      <HomeView
        activeTab={homeTab}
        onTabChange={setHomeTab}
        onStartSession={handleStartSession}
        onResumeSession={handleResumeSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onRestartSession={handleRestartSession}
        onEnterCreator={() => {
          setCreatorInitialQuestions(null);
          setCreatorInitialBaseName(null);
          setCreatorInitialImages(null);
          setPhase('creator');
        }}
        onEditInCreator={handleEditInCreator}
      />
    );
  })();

  // The footer is inside the zoomed <html> element, so it inherits the zoom.
  // We apply an inverse zoom to the footer to cancel out the html zoom,
  // making the footer always appear at the same physical size.
  const inverseZoom = Math.round((1 / zoomLevel) * 1000) / 1000;

  return (
    <div className="flex flex-col min-h-screen">
      {/* The main content container is flex-1 and flex-col so that views can take remaining space. 
          We add paddingBottom here so that content never hides behind the fixed footer. */}
      <div 
        className="flex-1 flex flex-col"
        style={{ paddingBottom: `${FOOTER_HEIGHT_PX / zoomLevel}px` }}
      >
        {content}
        <UpdaterNotification />
      </div>

      {/* ── Footer ── fixed, inverse-zoomed to always be the same visual size ── */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/80"
        style={{
          height: `${FOOTER_HEIGHT_PX}px`,
          zoom: inverseZoom,
        }}
      >
        <div className="flex items-center pl-5">
          <a
            href="https://github.com/ffxwrld"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors duration-150 font-mono"
          >
            by fifi
          </a>
        </div>

        <div className="flex items-center gap-2 pr-3">
          <button
            onClick={() => setShowFormatInfo(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('components.formatInfo.button')}
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <LanguageSwitcher />
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <ThemePicker />
          <DarkModeToggle />
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <button
            onClick={() => setZoomLevel(prev => applyZoom(prev - ZOOM_STEP))}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
            title="Pomniejsz (Cmd -)"
            aria-label="Pomniejsz"
          >
            −
          </button>
          <button
            onClick={() => setZoomLevel(applyZoom(1))}
            className="px-1.5 h-6 flex items-center justify-center rounded-md text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 font-mono tabular-nums min-w-[2.8rem]"
            title="Reset zoom (Cmd 0)"
            aria-label="Reset zoom"
            id="zoom-reset-btn"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={() => setZoomLevel(prev => applyZoom(prev + ZOOM_STEP))}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
            title="Powiększ (Cmd +)"
            aria-label="Powiększ"
          >
            +
          </button>
        </div>
      </footer>

      {showFormatInfo && (
        <FormatInfoModal onClose={() => setShowFormatInfo(false)} />
      )}
    </div>
  );
};

export default App;
