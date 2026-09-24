import { FC, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { AuthGuard } from './components/auth/AuthGuard';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';

// Primary landing views remain synchronous for zero-latency initial load
import { DashboardView } from './components/DashboardView';
import { LearnView as HomeView } from './components/LearnView';

// Heavy / secondary views code-split via React.lazy
const ScheduleView = lazy(() => import('./components/ScheduleView').then(m => ({ default: m.ScheduleView })));
const TestView = lazy(() => import('./components/TestView').then(m => ({ default: m.TestView })));
const SummaryView = lazy(() => import('./components/SummaryView').then(m => ({ default: m.SummaryView })));
const CreatorView = lazy(() => import('./components/CreatorView').then(m => ({ default: m.CreatorView })));
const ProfileView = lazy(() => import('./components/social/ProfileView').then(m => ({ default: m.ProfileView })));
const StatsView = lazy(() => import('./components/StatsView').then(m => ({ default: m.StatsView })));
const FriendsView = lazy(() => import('./components/social/FriendsView').then(m => ({ default: m.FriendsView })));
const GameHubView = lazy(() => import('./components/game/GameHubView').then(m => ({ default: m.GameHubView })));
const SoloGameView = lazy(() => import('./components/game/SoloGameView').then(m => ({ default: m.SoloGameView })));
const FlashcardsView = lazy(() => import('./components/FlashcardsView').then(m => ({ default: m.FlashcardsView })));

const ViewLoadingFallback: FC = () => (
  <div className="flex-1 flex items-center justify-center min-h-[300px] w-full">
    <div className="w-8 h-8 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
  </div>
);

import { SoloGameMode } from './utils/arcadeStorage';
import { Question } from './models/types';
import { MainLayout } from './components/layout/MainLayout';
import { CommandPalette } from './components/common/CommandPalette';
import { DarkModeToggle } from './components/DarkModeToggle';
import { ThemePicker } from './components/ThemePicker';
import { FormatInfoModal } from './components/FormatInfoModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsOfServiceModal } from './components/TermsOfServiceModal';
import { LegalOnboardingModal } from './components/LegalOnboardingModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useAppOrchestrator, AppPhase } from './hooks/useAppOrchestrator';

export type { AppPhase };

const App: FC = () => {
  const { t } = useTranslation();
  const {
    displayPhase,
    setPhase,
    session,
    currentSessionId,
    homeTab,
    setHomeTab,
    creatorInitialQuestions,
    creatorInitialBaseName,
    creatorInitialImages,
    creatorSourceSessionId,
    resetCreatorState,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    showFormatInfo,
    setShowFormatInfo,
    showPrivacyPolicy,
    setShowPrivacyPolicy,
    showTermsOfService,
    setShowTermsOfService,
    showMobileSettings,
    setShowMobileSettings,
    isDark,
    handleStartSession,
    handleResetSession,
    handleResumeSession,
    handleDeleteSession,
    handleEditInCreator,
    handleSaveToTestownik,
    handleSessionUpdate,
    handleQuit,
    handleNewTest,
    handleRestartSession,
    handleRenameSession,
    handleFlashcards,
  } = useAppOrchestrator();

  const [activeSoloGame, setActiveSoloGame] = useState<{
    mode: SoloGameMode;
    questions: Question[];
    sessionId: string;
  } | null>(null);

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1, 
      transition: { duration: 0.15, ease: 'easeOut' as const }
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.1, ease: 'easeIn' as const }
    }
  };

  const pageTransition = {}; // not needed when transitions are in variants

  const content = (() => {
    if (activeSoloGame) {
      return (
        <motion.div
          key="solo-game"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className="flex-1 flex flex-col w-full h-full min-h-0 bg-zinc-50 dark:bg-black"
        >
          <SoloGameView
            mode={activeSoloGame.mode}
            questions={activeSoloGame.questions}
            sessionId={activeSoloGame.sessionId}
            onExit={() => setActiveSoloGame(null)}
          />
        </motion.div>
      );
    }

    if (displayPhase === 'test') {
      if (!session || !currentSessionId) {
        return <ViewLoadingFallback />;
      }
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
    if (displayPhase === 'summary') {
      if (!session || !currentSessionId) {
        return <ViewLoadingFallback />;
      }
      return (
        <motion.div key="summary" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col">
          <SummaryView
            session={session}
            sessionId={currentSessionId}
            onNewTest={handleNewTest}
            onRestartSession={handleRestartSession}
          />
        </motion.div>
      );
    }
    if (displayPhase === 'flashcards' && session) {
      return (
        <motion.div key="flashcards" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col w-full h-full min-h-0 bg-zinc-50 dark:bg-black">
          <FlashcardsView 
            session={session} 
            sessionId={currentSessionId!}
            onExit={() => setPhase('learn')} 
          />
        </motion.div>
      );
    }
    
    if (displayPhase === 'creator') {
      return (
        <motion.div key="creator" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col min-h-0">
          <CreatorView 
            onQuit={() => {
              resetCreatorState();
              setPhase('learn');
            }}
            initialQuestions={creatorInitialQuestions || undefined}
            initialBaseName={creatorInitialBaseName || undefined}
            initialImageNames={creatorInitialImages || undefined}
            sourceSessionId={creatorSourceSessionId || undefined}
            onSaveToTestownik={handleSaveToTestownik}
          />
        </motion.div>
      );
    }
    
    // Social and Home views use the persistent MainLayout
    if (['dashboard', 'learn', 'profile', 'friends', 'stats', 'multiplayer', 'schedule'].includes(displayPhase)) {
      return (
        <motion.div key="main-layout" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition} className="flex-1 flex flex-col w-full h-full">
          <MainLayout 
             
            onNavigate={(p) => {
              if (p === 'settings') {
                setShowMobileSettings(true);
              } else {
                setPhase(p);
              }
            }}
          >
            
            <div className="flex-1 flex flex-col h-full">
              <Suspense fallback={<ViewLoadingFallback />}>
                {displayPhase === 'dashboard' && (
                  <DashboardView 
                    onStartSession={(id) => handleResumeSession(id)}
                    onResetSession={(id) => handleResetSession(id)}
                  />
                )}
                {displayPhase === 'learn' && (
                  <HomeView
                    activeTab={homeTab}
                    onTabChange={setHomeTab}
                    onStartSession={handleStartSession}
                    onResumeSession={handleResumeSession}
                    onDeleteSession={handleDeleteSession}
                    onRenameSession={handleRenameSession}
                    onRestartSession={handleRestartSession}
                    onFlashcards={handleFlashcards}
                    onEnterCreator={() => {
                      resetCreatorState();
                      setPhase('creator');
                    }}
                    onEditInCreator={handleEditInCreator}
                  />
                )}
                {displayPhase === 'stats' && (
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <StatsView />
                  </AuthGuard>
                )}
                {displayPhase === 'multiplayer' && (
                  <GameHubView 
                    onStartSession={(id) => handleResetSession(id)} 
                    onStartSoloGame={(mode, questions, sessionId) => {
                      setActiveSoloGame({ mode, questions, sessionId });
                    }}
                    onNavigateToAuth={() => setPhase('profile')}
                  />
                )}
                {displayPhase === 'schedule' && (
                  <ScheduleView onResumeSession={handleResumeSession} />
                )}
                {displayPhase === 'profile' && (
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <ProfileView 
                      onOpenSettings={() => setShowMobileSettings(true)} 
                    />
                  </AuthGuard>
                )}
                {displayPhase === 'friends' && (
                  <AuthGuard onCancel={() => setPhase('dashboard')}>
                    <FriendsView />
                  </AuthGuard>
                )}
              </Suspense>
            </div>
            
          </MainLayout>
        </motion.div>
      );
    }

    return <ViewLoadingFallback />;
  })();

  return (
    <GlobalErrorBoundary>
      <div className={`flex flex-col ${displayPhase === 'creator' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      <Toaster theme={isDark ? 'dark' : 'light'} richColors position="top-center" />
      <div 
        className={`flex-1 flex flex-col pb-0 md:pb-[40px] ${displayPhase === 'creator' ? 'min-h-0' : ''}`}
      >
        <AnimatePresence mode="wait">
          <Suspense fallback={<ViewLoadingFallback />}>
            {content}
          </Suspense>
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
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('settings.title')}</h3>
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
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.questionFormat')}</span>
                  <button
                    onClick={() => { setShowMobileSettings(false); setShowFormatInfo(true); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                  >
                    {t('settings.view')}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.language')}</span>
                  <LanguageSwitcher />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.colorTheme')}</span>
                  <ThemePicker />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.darkMode')}</span>
                  <DarkModeToggle />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.uiScale')}</span>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                    <button
                      onClick={zoomOut}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition shadow-sm"
                    >
                      −
                    </button>
                    <button
                      onClick={resetZoom}
                      className="px-2 h-8 flex items-center justify-center rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition font-mono tabular-nums shadow-sm min-w-[3.5rem]"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                    <button
                      onClick={zoomIn}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    {t('settings.privacyPolicy')}
                  </button>
                  <button
                    onClick={() => setShowTermsOfService(true)}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    {t('termsModal.title')}
                  </button>
                </div>
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
      <AnimatePresence>
        {showTermsOfService && (
          <TermsOfServiceModal onClose={() => setShowTermsOfService(false)} />
        )}
      </AnimatePresence>
      <LegalOnboardingModal />
      <CommandPalette />
    </div>
  </GlobalErrorBoundary>
  );
};

export default App;
