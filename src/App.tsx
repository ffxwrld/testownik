import { useState, useEffect, useCallback, FC } from 'react';
import { mapQuestionsToEditingFormat, mapEditingFormatToQuestions } from './utils/adapters';
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
import { CreatorView, type EditingQuestion, } from './components/CreatorView';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from './components/auth/AuthGuard';
import { ProfileView } from './components/social/ProfileView';
import { FriendsList } from './components/social/FriendsList';
import { LeaderboardView } from './components/social/LeaderboardView';
import { useSync } from './hooks/useSync';

import { DarkModeToggle } from './components/DarkModeToggle';
import { ThemePicker } from './components/ThemePicker';
import { FormatInfoModal } from './components/FormatInfoModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

type AppPhase = 'home' | 'test' | 'summary' | 'creator' | 'profile' | 'friends' | 'leaderboard';

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const FOOTER_HEIGHT_PX = 40;

function applyZoom(level: number): number {
  const clamped = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level)) * 10) / 10;
  // @ts-ignore
  if (typeof window !== 'undefined' && window.electron?.zoom?.set) {
    // @ts-ignore
    window.electron.zoom.set(clamped);
  } else if (typeof document !== 'undefined') {
    // Fallback dla przeglądarki (dev mode bez electrona) lub braku restartu
    document.documentElement.style.zoom = String(clamped);
  }
  localStorage.setItem('testownik_zoom', String(clamped));
  return clamped;
}

import { Toaster, toast } from 'sonner';

const App: FC = () => {
  const { t } = useTranslation();
  const { triggerSync } = useSync();
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
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  useEffect(() => {
    applyZoom(zoomLevel);
    // @ts-ignore
    if (window.electron?.updater) {
      // @ts-ignore
      window.electron.updater.onUpdateAvailable(() => {
        toast.loading(t('updater.downloading'), { description: t('updater.downloadingDesc'), id: 'update-toast' });
      });
      // @ts-ignore
      window.electron.updater.onUpdateDownloaded(() => {
        toast.success(t('updater.ready'), {
          description: t('updater.readyDesc'),
          id: 'update-toast',
          duration: Infinity,
          action: {
            label: t('updater.restartBtn'),
            // @ts-ignore
            onClick: () => window.electron.updater.restartApp()
          }
        });
      });
      // @ts-ignore
      if (window.electron.updater.onUpdateAvailableMac) {
        // @ts-ignore
        window.electron.updater.onUpdateAvailableMac(() => {
          toast.info(t('updater.macAvailable'), {
            description: t('updater.macAvailableDesc'),
            duration: Infinity,
            action: {
              label: t('updater.downloadBtn'),
              onClick: () => window.open('https://github.com/ffxwrld/testownik/releases/latest', '_blank')
            }
          });
        });
      }
    }
  }, [t]);

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
  }, []);

  const handleStartSession = useCallback(
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
  );

  const handleResumeSession = useCallback(async (sessionId: string) => {
    const saved = await loadSession(sessionId);
    if (!saved) return;
    setCurrentSessionId(sessionId);
    setSession(saved);
    setPhase(saved.phase === 'summary' ? 'summary' : 'test');
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    if (sessionId === currentSessionId) {
      setCurrentSessionId(null);
      setSession(null);
      setPhase('home');
    }
  }, [currentSessionId]);

  const handleEditInCreator = useCallback(async (sessionId: string) => {
    const saved = await loadSession(sessionId);
    if (!saved) return;
    
    const editingQuestions = mapQuestionsToEditingFormat(saved.questions);
    
    const { getAllSessionImages } = await import('./utils/db');
    const images = await getAllSessionImages(sessionId);
    
    setCreatorInitialQuestions(editingQuestions);
    setCreatorInitialBaseName(saved.baseName);
    setCreatorInitialImages(images);
    setPhase('creator');
  }, []);

  const handleSaveToTestownik = useCallback(async (editingQuestions: EditingQuestion[], baseName: string, images: Record<string, Blob> = {}) => {
    try {
      const questions = mapEditingFormatToQuestions(editingQuestions);
      
      const newSession = buildInitialSession(questions, 1, baseName);
      const sessionId = await saveSession(newSession);
      
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
      toast.error('Wystąpił błąd podczas zapisywania: ' + err.message);
    }
  }, []);

  const handleSessionUpdate = useCallback((updated: SessionState) => {
    setSession(updated);
    if (updated.phase === 'summary') {
      setPhase('summary'); triggerSync();
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

  const handleRestartSession = useCallback(async (sessionId: string, newRepeatMode?: number) => {
    const saved = await loadSession(sessionId);
    if (!saved) return;
    const modeToUse = newRepeatMode ?? saved.repeatMode;
    const fresh = buildInitialSession(saved.questions, modeToUse, saved.baseName);
    await saveSession(fresh, sessionId);
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
    session?.phase === 'summary' && phase === 'test' ? 'summary' : phase;

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] as const }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15, ease: [0.32, 0, 0.67, 0] as const }
    }
  };

  const pageTransition = {}; // not needed when transitions are in variants

  const content = (() => {
    if (displayPhase === 'test' && session && currentSessionId) {
      return (
        <motion.div key="test" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col">
          <TestView
          onOpenSettings={() => setShowMobileSettings(true)}
            session={session}
            sessionId={currentSessionId}
            onSessionUpdate={handleSessionUpdate}
            onQuit={handleQuit}
          />
        </motion.div>
      );
    }
    if (displayPhase === 'summary' && session && currentSessionId) {
      return (
        <motion.div key="summary" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col">
          <SummaryView
            session={session}
            sessionId={currentSessionId}
            onNewTest={handleNewTest}
          />
        </motion.div>
      );
    }
    if (displayPhase === 'creator') {
      return (
        <motion.div key="creator" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col min-h-0">
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
        </motion.div>
      );
    }
    if (displayPhase === 'profile') {
      return (
        <motion.div key="profile" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col">
          <AuthGuard onCancel={() => setPhase('home')}>
            <ProfileView onBack={() => setPhase('home')} />
          </AuthGuard>
        </motion.div>
      );
    }
    if (displayPhase === 'friends') {
      return (
        <motion.div key="friends" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col">
          <AuthGuard onCancel={() => setPhase('home')}>
            <FriendsList onBack={() => setPhase('home')} />
          </AuthGuard>
        </motion.div>
      );
    }
    if (displayPhase === 'leaderboard') {
      return (
        <motion.div key="leaderboard" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col">
          <AuthGuard onCancel={() => setPhase('home')}>
            <LeaderboardView onBack={() => setPhase('home')} />
          </AuthGuard>
        </motion.div>
      );
    }
    return (
      <motion.div key="home" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col">
        <HomeView
          onOpenSettings={() => setShowMobileSettings(true)}
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
          onOpenProfile={() => setPhase('profile')}
          onOpenFriends={() => setPhase('friends')}
          onOpenLeaderboard={() => setPhase('leaderboard')}
        />
      </motion.div>
    );
  })();

  return (
    <div className={`flex flex-col ${displayPhase === 'creator' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <div 
        className={`flex-1 flex flex-col pb-0 md:pb-[40px] ${displayPhase === 'creator' ? 'min-h-0' : ''}`}
      >
        <AnimatePresence mode="wait">
          {content}
        </AnimatePresence>
      </div>

      <footer
        className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl saturate-150 border-t border-zinc-200/50 dark:border-zinc-800/50"
        style={{ height: `${FOOTER_HEIGHT_PX}px` }}
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
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-150 text-base leading-none select-none"
          >
            −
          </button>
          <button
            onClick={() => setZoomLevel(applyZoom(1))}
            className="px-1.5 h-6 flex items-center justify-center rounded-md text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-150 font-mono tabular-nums min-w-[2.8rem]"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={() => setZoomLevel(prev => applyZoom(prev + ZOOM_STEP))}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-150 text-base leading-none select-none"
          >
            +
          </button>
        </div>
      </footer>
      

      {/* Mobile Settings Modal */}
      <AnimatePresence>
        {showMobileSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
            onClick={() => setShowMobileSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ustawienia</h3>
                <button
                  onClick={() => setShowMobileSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Format pytań</span>
                  <button
                    onClick={() => { setShowMobileSettings(false); setShowFormatInfo(true); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                  >
                    Zobacz
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Język</span>
                  <LanguageSwitcher />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Motyw koloru</span>
                  <ThemePicker />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tryb ciemny</span>
                  <DarkModeToggle />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {showFormatInfo && (
        <FormatInfoModal onClose={() => setShowFormatInfo(false)} />
      )}
      <Toaster position="bottom-right" richColors theme="system" />
    </div>
  );
};

export default App;
