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
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from './components/auth/AuthGuard';
import { lazy, Suspense } from 'react';
import type { EditingQuestion } from './components/CreatorView';

const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const HomeView = lazy(() => import('./components/LearnView').then(m => ({ default: m.LearnView })));
const TestView = lazy(() => import('./components/TestView').then(m => ({ default: m.TestView })));
const SummaryView = lazy(() => import('./components/SummaryView').then(m => ({ default: m.SummaryView })));
const CreatorView = lazy(() => import('./components/CreatorView').then(m => ({ default: m.CreatorView })));
const ProfileView = lazy(() => import('./components/social/ProfileView').then(m => ({ default: m.ProfileView })));
const LeaderboardView = lazy(() => import('./components/social/LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const FriendsView = lazy(() => import('./components/social/FriendsView').then(m => ({ default: m.FriendsView })));
const ProgressView = lazy(() => import('./components/ProgressView').then(m => ({ default: m.ProgressView })));
const MultiplayerView = lazy(() => import('./components/multiplayer/MultiplayerView').then(m => ({ default: m.MultiplayerView })));
import { MainLayout } from './components/layout/MainLayout';
import { useSync } from './hooks/useSync';

import { DarkModeToggle } from './components/DarkModeToggle';
import { ThemePicker } from './components/ThemePicker';
import { FormatInfoModal } from './components/FormatInfoModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

export type AppPhase = 'dashboard' | 'learn' | 'test' | 'summary' | 'creator' | 'profile' | 'friends' | 'leaderboard' | 'progress' | 'multiplayer';

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;

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

  const [location, setLocation] = useLocation();
  const getPhaseFromLocation = (loc: string): AppPhase => {
    if (loc === '/nauka') return 'learn';
    if (loc === '/test') return 'test';
    if (loc === '/podsumowanie') return 'summary';
    if (loc === '/kreator') return 'creator';
    if (loc === '/profil') return 'profile';
    if (loc === '/progress') return 'progress';
    if (loc === '/multiplayer') return 'multiplayer';
    if (loc === '/znajomi') return 'friends';
    if (loc === '/ranking') return 'leaderboard';
    return 'dashboard';
  };
  let displayPhase = getPhaseFromLocation(location);

  const setPhase = (newPhase: AppPhase) => {
    const paths: Record<AppPhase, string> = { 
      dashboard: '/', learn: '/nauka', test: '/test', 
      summary: '/podsumowanie', creator: '/kreator', 
      profile: '/profil', friends: '/znajomi', leaderboard: '/ranking', progress: '/progress', multiplayer: '/multiplayer' 
    };
    setLocation(paths[newPhase]);
  };

  const [session, setSession] = useState<SessionState | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [homeTab, setHomeTab] = useState<'new'|'saved'>('new');
  const [creatorInitialQuestions, setCreatorInitialQuestions] = useState<EditingQuestion[] | null>(null);
  const [creatorInitialBaseName, setCreatorInitialBaseName] = useState<string | null>(null);
  const [creatorInitialImages, setCreatorInitialImages] = useState<string[] | null>(null);
  const [creatorSourceSessionId, setCreatorSourceSessionId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const stored = localStorage.getItem('testownik_zoom');
    return stored ? parseFloat(stored) : 1;
  });

  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
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

  
  const handleResetSession = async (id: string) => {
    const session = await loadSession(id);
    if (!session) return;
    
    const resetSession = {
      ...session,
      queue: session.questions.map(q => ({
        questionId: q.id,
        requiredCorrectStreak: session.repeatMode,
        consecutiveCorrect: 0,
        wrongCount: 0,
        firstAnswerWrong: false
      })),
      done: [],
      doneStats: [],
      elapsedSeconds: 0,
      totalFirstAttempts: 0,
      totalFirstCorrect: 0,
      phase: 'test' as const,
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await import('./utils/session').then(m => m.saveSession(resetSession, id));
    setSession(resetSession);
    setCurrentSessionId(id);
    setPhase('test');
  };

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
      setPhase('learn');
    }
  }, [currentSessionId]);

  const handleEditInCreator = useCallback(async (sessionId: string) => {
    const saved = await loadSession(sessionId);
    if (!saved) return;
    
    const editingQuestions = mapQuestionsToEditingFormat(saved.questions);
    
    const { getSessionImageNames } = await import('./utils/db');
    const imageNames = await getSessionImageNames(sessionId);
    
    setCreatorInitialQuestions(editingQuestions);
    setCreatorInitialBaseName(saved.baseName);
    setCreatorInitialImages(imageNames as any);
    setCreatorSourceSessionId(sessionId);
    setPhase('creator');
  }, []);

  const handleSaveToTestownik = useCallback(async (editingQuestions: EditingQuestion[], baseName: string, newImages: Record<string, Blob> = {}, existingImages: string[] = [], sourceSessionId?: string) => {
    try {
      const questions = mapEditingFormatToQuestions(editingQuestions);
      
      const newSession = buildInitialSession(questions, 1, baseName);
      const sessionId = await saveSession(newSession);
      
      const { saveSessionImages, copySessionImages } = await import('./utils/db');
      if (sourceSessionId && existingImages.length > 0) {
         await copySessionImages(sourceSessionId, sessionId, existingImages);
      }
      if (Object.keys(newImages).length > 0) {
        await saveSessionImages(sessionId, newImages);
      }

      setCurrentSessionId(sessionId);
      setSession(newSession);
      
      setCreatorInitialQuestions(null);
      setCreatorInitialBaseName(null);
      setCreatorInitialImages(null);
                setCreatorSourceSessionId(null);
      setHomeTab('saved');
      setPhase('learn');
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
    setPhase('learn');
  }, []);

  const handleNewTest = useCallback(() => {
    setCurrentSessionId(null);
    setSession(null);
    setPhase('learn');
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

  if (session?.phase === 'summary' && displayPhase === 'test') {
    displayPhase = 'summary';
  }

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring' as const, bounce: 0, duration: 0.4 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
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
                setCreatorSourceSessionId(null);
              setPhase('learn');
            }}
            initialQuestions={creatorInitialQuestions || undefined}
            initialBaseName={creatorInitialBaseName || undefined}
            initialImageNames={creatorInitialImages || undefined} sourceSessionId={creatorSourceSessionId || undefined}
            onSaveToTestownik={handleSaveToTestownik}
          />
        </motion.div>
      );
    }
    
    // Social and Home views use the persistent MainLayout
    if (['dashboard', 'learn', 'profile', 'friends', 'leaderboard', 'progress', 'multiplayer'].includes(displayPhase)) {
      return (
        <motion.div key="main-layout" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col w-full h-full">
          <MainLayout 
             
            onNavigate={(p) => {
              if (p === 'settings') {
                setShowMobileSettings(true);
              } else if (p === 'creator') {
                setCreatorInitialQuestions(null);
                setCreatorInitialBaseName(null);
                setCreatorInitialImages(null);
                setCreatorSourceSessionId(null);
                setPhase('creator');
              } else {
                setPhase(p as any);
              }
            }}
          >
            <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>}>
            <AnimatePresence mode="wait">
              {displayPhase === 'dashboard' && (
                <motion.div key="dashboard" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col h-full">
                  <DashboardView 
                    onStartSession={(id) => handleResumeSession(id)}
                    onResetSession={(id) => handleResetSession(id)}
                  />
                </motion.div>
              )}
              {displayPhase === 'learn' && (
                <motion.div key="learn" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col h-full">
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
                setCreatorSourceSessionId(null);
                      setPhase('creator');
                    }}
                    onEditInCreator={handleEditInCreator}
                  />
                </motion.div>
              )}
                            {displayPhase === 'progress' && (
                <motion.div key="progress" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col h-full">
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <ProgressView />
                  </AuthGuard>
                </motion.div>
              )}
                            {displayPhase === 'multiplayer' && (
                <motion.div key="multiplayer" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col h-full">
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <MultiplayerView onStartSession={(id) => handleResumeSession(id)} />
                  </AuthGuard>
                </motion.div>
              )}
              {displayPhase === 'profile' && (
                <motion.div key="profile" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col h-full">
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <ProfileView />
                  </AuthGuard>
                </motion.div>
              )}
              {displayPhase === 'leaderboard' && (
                <motion.div key="leaderboard" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col h-full">
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <LeaderboardView />
                  </AuthGuard>
                </motion.div>
              )}
              {displayPhase === 'friends' && (
                <motion.div key="friends" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col h-full">
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <FriendsView />
                  </AuthGuard>
                </motion.div>
              )}
            </AnimatePresence>
            </Suspense>
          </MainLayout>
        </motion.div>
      );
    }
  })();

  return (
    <div className={`flex flex-col ${displayPhase === 'creator' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      <div 
        className={`flex-1 flex flex-col pb-0 md:pb-[40px] ${displayPhase === 'creator' ? 'min-h-0' : ''}`}
      >
        <AnimatePresence mode="wait">
          {content}
        </AnimatePresence>
      </div>

      
      

      {/* Mobile Settings Modal */}
      <AnimatePresence>
        {showMobileSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
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
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Skala interfejsu</span>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                    <button
                      onClick={() => setZoomLevel(prev => applyZoom(prev - ZOOM_STEP))}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition shadow-sm"
                    >
                      −
                    </button>
                    <button
                      onClick={() => setZoomLevel(applyZoom(1))}
                      className="px-2 h-8 flex items-center justify-center rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition font-mono tabular-nums shadow-sm min-w-[3.5rem]"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => applyZoom(prev + ZOOM_STEP))}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-3">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  Polityka Prywatności
                </button>
                <a
                  href="https://github.com/ffxwrld"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-zinc-300 dark:text-zinc-600 hover:text-primary-500 transition-colors duration-150 font-mono"
                >
                  by fifi
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {showFormatInfo && (
          <FormatInfoModal onClose={() => setShowFormatInfo(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrivacyPolicy && (
          <PrivacyPolicyModal onClose={() => setShowPrivacyPolicy(false)} />
        )}
      </AnimatePresence>
      <Toaster position="bottom-right" richColors theme="system" />
    </div>
  );
};

export default App;
