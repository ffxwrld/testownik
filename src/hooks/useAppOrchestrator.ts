import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useSync } from './useSync';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import { SessionState, Question } from '../models/types';
import type { EditingQuestion } from '../components/CreatorView';
import { mapQuestionsToEditingFormat, mapEditingFormatToQuestions } from '../utils/adapters';
import {
  buildInitialSession,
  loadSession,
  saveSession,
  deleteSession,
  deleteEphemeralSession,
  getCurrentSessionId,
  renameSession,
} from '../utils/session';
import { useTheme } from './useTheme';

export type AppPhase =
  | 'dashboard'
  | 'learn'
  | 'test'
  | 'summary'
  | 'creator'
  | 'profile'
  | 'friends'
  | 'stats'
  | 'schedule'
  | 'multiplayer'
  | 'flashcards';

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;

export function applyZoom(level: number): number {
  const clamped = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level)) * 10) / 10;
  if (typeof window !== 'undefined' && window.electron?.zoom?.set) {
    window.electron.zoom.set(clamped);
  } else if (typeof document !== 'undefined') {
    // Fallback dla przeglądarki (dev mode bez electrona)
    document.documentElement.style.zoom = String(clamped);
  }
  localStorage.setItem('testownik_zoom', String(clamped));
  return clamped;
}

export function useAppOrchestrator() {
  const { t } = useTranslation();
  const { triggerSync } = useSync();
  const { broadcastTestProgress, roomCode, returnToLobby, returnToLobbyCount, cleanup: cleanupMultiplayer, isHost } = useMultiplayerContext();

  const [location, setLocation] = useLocation();

  const getPhaseFromLocation = (loc: string): AppPhase => {
    const cleanLoc = loc.split('?')[0];
    if (cleanLoc === '/nauka') return 'learn';
    if (cleanLoc === '/test') return 'test';
    if (cleanLoc === '/fiszki') return 'flashcards';
    if (cleanLoc === '/podsumowanie') return 'summary';
    if (cleanLoc === '/kreator') return 'creator';
    if (cleanLoc === '/profil') return 'profile';
    if (cleanLoc === '/statystyki') return 'stats';
    if (cleanLoc === '/multiplayer') return 'multiplayer';
    if (cleanLoc === '/znajomi') return 'friends';
    if (cleanLoc === '/harmonogram') return 'schedule';

    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('room') || searchParams.has('code')) {
          return 'multiplayer';
        }
        if (searchParams.has('share') || searchParams.has('receive')) {
          return 'learn';
        }
      } catch {
        // ignore
      }
    }

    return 'dashboard';
  };

  let displayPhase = getPhaseFromLocation(location);

  const setPhase = useCallback((newPhase: AppPhase) => {
    const paths: Record<AppPhase, string> = {
      dashboard: '/',
      learn: '/nauka',
      test: '/test',
      flashcards: '/fiszki',
      summary: '/podsumowanie',
      creator: '/kreator',
      profile: '/profil',
      friends: '/znajomi',
      stats: '/statystyki',
      schedule: '/harmonogram',
      multiplayer: '/multiplayer',
    };
    setLocation(paths[newPhase]);
  }, [setLocation]);

  const [session, setSession] = useState<SessionState | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [homeTab, setHomeTab] = useState<'new' | 'saved'>('new');
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
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const themeControls = useTheme();

  const zoomIn = useCallback(() => {
    setZoomLevel(prev => applyZoom(prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => applyZoom(prev - ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(applyZoom(1));
  }, []);

  // Apply zoom factor to document and Electron process
  useEffect(() => {
    applyZoom(zoomLevel);
  }, [zoomLevel]);

  // Electron auto-updater listeners with proper unsubscribe cleanup
  useEffect(() => {
    const updater = window.electron?.updater;
    if (!updater) return;

    const unsubs: Array<() => void> = [];

    const unsubAvailable = updater.onUpdateAvailable(() => {
      toast.loading(t('updater.downloading'), { description: t('updater.downloadingDesc'), id: 'update-toast' });
    });
    if (typeof unsubAvailable === 'function') unsubs.push(unsubAvailable);

    const unsubDownloaded = updater.onUpdateDownloaded(() => {
      toast.success(t('updater.ready'), {
        description: t('updater.readyDesc'),
        id: 'update-toast',
        duration: Infinity,
        action: {
          label: t('updater.restartBtn'),
          onClick: () => window.electron?.updater.restartApp(),
        },
      });
    });
    if (typeof unsubDownloaded === 'function') unsubs.push(unsubDownloaded);

    if (updater.onUpdateAvailableMac) {
      const unsubMac = updater.onUpdateAvailableMac(() => {
        toast.info(t('updater.macAvailable'), {
          description: t('updater.macAvailableDesc'),
          duration: Infinity,
          action: {
            label: t('updater.downloadBtn'),
            onClick: () => window.open('https://github.com/ffxwrld/testownik/releases/latest', '_blank'),
          },
        });
      });
      if (typeof unsubMac === 'function') unsubs.push(unsubMac);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [t]);

  // Global zoom keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomIn, zoomOut, resetZoom]);

  // Initial session restore from storage
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
    async (questions: Question[], repeatMode: number | 'spaced', baseName: string, images: Record<string, Blob> = {}, targetDate?: string) => {
      const newSession = buildInitialSession(questions, repeatMode, baseName, targetDate);
      const sessionId = await saveSession(newSession);

      if (Object.keys(images).length > 0) {
        const { saveSessionImages } = await import('../utils/db');
        await saveSessionImages(sessionId, images);
      }

      setCurrentSessionId(sessionId);
      setSession(newSession);
      setPhase('test');
    },
    [setPhase]
  );

  const handleResetSession = useCallback(
    async (id: string) => {
      const sessionData = await loadSession(id);
      if (!sessionData) return;

      const firstQ = sessionData.questions.find(q => q.id === sessionData.questions[0]?.id);
      const resetSession: SessionState = {
        ...sessionData,
        queue: sessionData.questions.map(q => ({
          questionId: q.id,
          requiredCorrectStreak: (typeof sessionData.repeatMode === 'number' && sessionData.repeatMode > 1) ? sessionData.repeatMode : 1,
          consecutiveCorrect: 0,
          wrongCount: 0,
          firstAnswerWrong: false,
        })),
        done: [],
        doneStats: [],
        elapsedSeconds: 0,
        totalFirstAttempts: 0,
        totalFirstCorrect: 0,
        phase: 'test',
        currentQuestionIndex: 0,
        shuffledAnswerOrder: firstQ ? Array.from({ length: firstQ.answers.length }, (_, i) => i) : [0, 1, 2, 3],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSession(resetSession, id);
      setSession(resetSession);
      setCurrentSessionId(id);
      setPhase('test');
    },
    [setPhase]
  );

  // Return to Lobby synchronization: when Host or Peer returns to lobby, return view to multiplayer
  const prevReturnToLobbyCountRef = useRef(returnToLobbyCount);
  useEffect(() => {
    if (returnToLobbyCount > prevReturnToLobbyCountRef.current && roomCode) {
      prevReturnToLobbyCountRef.current = returnToLobbyCount;
      setCurrentSessionId(null);
      setSession(null);
      setPhase('multiplayer');
    } else {
      prevReturnToLobbyCountRef.current = returnToLobbyCount;
    }
  }, [returnToLobbyCount, roomCode, setPhase]);

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      const saved = await loadSession(sessionId);
      if (!saved) return;
      setCurrentSessionId(sessionId);
      setSession(saved);
      setPhase(saved.phase === 'summary' ? 'summary' : 'test');
    },
    [setPhase]
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      await deleteSession(sessionId);
      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);
        setSession(null);
        setPhase('learn');
      }
    },
    [currentSessionId, setPhase]
  );

  const handleEditInCreator = useCallback(
    async (sessionId: string) => {
      const saved = await loadSession(sessionId);
      if (!saved) return;

      const editingQuestions = mapQuestionsToEditingFormat(saved.questions);

      const { getSessionImageNames } = await import('../utils/db');
      const imageNames = await getSessionImageNames(sessionId);

      setCreatorInitialQuestions(editingQuestions);
      setCreatorInitialBaseName(saved.baseName);
      setCreatorInitialImages(imageNames);
      setCreatorSourceSessionId(sessionId);
      setPhase('creator');
    },
    [setPhase]
  );

  const resetCreatorState = useCallback(() => {
    setCreatorInitialQuestions(null);
    setCreatorInitialBaseName(null);
    setCreatorInitialImages(null);
    setCreatorSourceSessionId(null);
  }, []);

  const handleSaveToTestownik = useCallback(
    async (
      editingQuestions: EditingQuestion[],
      baseName: string,
      newImages: Record<string, Blob> = {},
      existingImages: string[] = [],
      sourceSessionId?: string
    ) => {
      try {
        const questions = mapEditingFormatToQuestions(editingQuestions);

        const newSession = buildInitialSession(questions, 1, baseName);
        const sessionId = await saveSession(newSession);

        const { saveSessionImages, copySessionImages } = await import('../utils/db');
        if (sourceSessionId && existingImages.length > 0) {
          await copySessionImages(sourceSessionId, sessionId, existingImages);
        }
        if (Object.keys(newImages).length > 0) {
          await saveSessionImages(sessionId, newImages);
        }

        setCurrentSessionId(sessionId);
        setSession(newSession);

        resetCreatorState();
        setHomeTab('saved');
        setPhase('learn');
      } catch (err: unknown) {
        console.error(err);
        toast.error('Wystąpił błąd podczas zapisywania: ' + ((err as Error)?.message || 'Nieznany błąd'));
      }
    },
    [resetCreatorState, setPhase]
  );

  const handleSessionUpdate = useCallback(
    (updated: SessionState) => {
      setSession(updated);
      if (updated.phase === 'summary') {
        setPhase('summary');
        triggerSync();
        if (roomCode) {
          broadcastTestProgress(100);
        }
      }
    },
    [roomCode, broadcastTestProgress, setPhase, triggerSync]
  );

  const handleQuit = useCallback(() => {
    if (roomCode) {
      if (!isHost && currentSessionId) {
        deleteEphemeralSession(currentSessionId);
      }
      cleanupMultiplayer();
    }
    setPhase('learn');
  }, [roomCode, isHost, currentSessionId, cleanupMultiplayer, setPhase]);

  const handleNewTest = useCallback(() => {
    setCurrentSessionId(null);
    setSession(null);
    if (roomCode) {
      returnToLobby();
      setPhase('multiplayer');
    } else {
      setPhase('learn');
    }
  }, [roomCode, returnToLobby, setPhase]);

  const handleRestartSession = useCallback(
    async (sessionId: string, newRepeatMode?: number | 'spaced') => {
      const saved = await loadSession(sessionId);
      if (!saved) return;
      const modeToUse = newRepeatMode ?? saved.repeatMode;
      const fresh = buildInitialSession(saved.questions, modeToUse, saved.baseName);
      
      // Preserve existing srData if restarting into spaced mode (so progress isn't completely wiped)
      if (modeToUse === 'spaced' && saved.srData) {
        fresh.srData = saved.srData;
      }

      await saveSession(fresh, sessionId);
      setCurrentSessionId(sessionId);
      setSession(fresh);
      setPhase('test');
    },
    [setPhase]
  );

  const handleRenameSession = useCallback(
    async (sessionId: string, newName: string) => {
      await renameSession(sessionId, newName);
      if (sessionId === currentSessionId && session) {
        setSession({ ...session, baseName: newName });
      }
    },
    [currentSessionId, session]
  );

  const handleFlashcards = useCallback(
    async (id: string) => {
      const loaded = await loadSession(id);
      if (loaded) {
        setSession(loaded);
        setCurrentSessionId(id);
        setPhase('flashcards');
      }
    },
    [setPhase]
  );

  if (session?.phase === 'summary' && displayPhase === 'test') {
    displayPhase = 'summary';
  }

  return {
    displayPhase,
    setPhase,
    session,
    setSession,
    currentSessionId,
    setCurrentSessionId,
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
    ...themeControls,
  };
}
