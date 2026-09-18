import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  GameController, Users, Heart, Lightning, Sparkle, Trophy, Play, Stack, CaretRight, X, SignIn, Flame, ArrowUpRight } from '@phosphor-icons/react';
import { Question, SavedSessionMetadata } from '../../models/types';
import { SoloGameMode, getSoloModeRecord } from '../../utils/arcadeStorage';
import { getAllSessionMetadata, loadSession } from '../../utils/session';
import { MultiplayerView } from '../multiplayer/MultiplayerView';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { PageHeader } from '../common/PageHeader';
import { toast } from 'sonner';

interface GameHubViewProps {
  onStartSession: (sessionId: string) => void;
  onStartSoloGame: (mode: SoloGameMode, questions: Question[], sessionId: string) => void;
  onNavigateToAuth?: () => void;
}

export const GameHubView: FC<GameHubViewProps> = ({
  onStartSession,
  onStartSoloGame,
  onNavigateToAuth,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'solo' | 'multiplayer'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const room = params.get('room') || params.get('code');
        if (room) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('testownik_pending_room', room.trim().toUpperCase());
          }
          return 'multiplayer';
        }
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('testownik_pending_room')) {
          return 'multiplayer';
        }
      } catch {
        // ignore
      }
    }
    return 'solo';
  });
  const [sessions, setSessions] = useState<SavedSessionMetadata[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedModeForDeckPicker, setSelectedModeForDeckPicker] = useState<SoloGameMode | null>(null);
  const [loadingDeckId, setLoadingDeckId] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const room = params.get('room') || params.get('code');
        if (room) {
          setActiveTab('multiplayer');
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('testownik_pending_room', room.trim().toUpperCase());
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    setLoadingSessions(true);
    getAllSessionMetadata()
      .then(setSessions)
      .catch(err => console.error('Failed to load session metadata', err))
      .finally(() => setLoadingSessions(false));
  }, []);

  const handleSelectMode = (mode: SoloGameMode) => {
    if (sessions.length === 0) {
      toast.error(t('games.solo.noQuestionsToast', 'Brak zapisanych pytań. Zaimportuj lub stwórz bazę w Kreatorze.'));
      return;
    }
    setSelectedModeForDeckPicker(mode);
  };

  const handleLaunchGameWithSession = async (sessionId: string) => {
    if (!selectedModeForDeckPicker) return;
    try {
      setLoadingDeckId(sessionId);
      const sessionData = await loadSession(sessionId);
      if (!sessionData || !sessionData.questions || sessionData.questions.length === 0) {
        toast.error(t('games.solo.deckEmptyToast', 'Wybrana paczka nie zawiera pytań.'));
        return;
      }
      setSelectedModeForDeckPicker(null);
      onStartSoloGame(selectedModeForDeckPicker, sessionData.questions, sessionId);
    } catch (e) {
      console.error('Failed to load session questions', e);
      toast.error(t('games.solo.deckLoadErrorToast', 'Nie udało się wczytać pytań z tej paczki.'));
    } finally {
      setLoadingDeckId(null);
    }
  };

  const suddenDeathRecord = getSoloModeRecord('sudden-death');
  const timeAttackRecord = getSoloModeRecord('time-attack');
  const zenRecord = getSoloModeRecord('zen');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32 md:pb-12">
        {/* Header with Title and Apple Segmented Control */}
        <PageHeader
          icon={<GameController />}
          title={t('games.title')}
          subtitle={t('games.subtitle')}
        >
          <div className="inline-flex p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-300/40 dark:border-zinc-700/40 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('solo')}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                activeTab === 'solo'
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {activeTab === 'solo' && (
                <motion.div
                  layoutId="hub-tab-indicator"
                  className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-zinc-200/60 dark:border-zinc-700/60"
                  transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>{t('games.tabs.solo')}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('multiplayer')}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                activeTab === 'multiplayer'
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {activeTab === 'multiplayer' && (
                <motion.div
                  layoutId="hub-tab-indicator"
                  className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-zinc-200/60 dark:border-zinc-700/60"
                  transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>{t('games.tabs.multiplayer')}</span>
              </span>
            </button>
          </div>
        </PageHeader>

        {/* Tab Content */}
        {activeTab === 'solo' ? (
          <div className="space-y-6">
              {/* Primary Hero Mode: Sudden Death */}
              <div
                onClick={() => handleSelectMode('sudden-death')}
                className="group relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-rose-500/10 transition-colors" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{t('games.solo.suddenDeath.badge')}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {t('games.solo.suddenDeath.title')}
                    </h2>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {t('games.solo.suddenDeath.desc')}
                    </p>

                    <div className="flex items-center gap-6 pt-2 text-xs font-semibold">
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 block">{t('games.solo.suddenDeath.highScore')}</span>
                        <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {suddenDeathRecord.highScore.toLocaleString()} {t('games.hud.score').toLowerCase()}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 block">{t('games.solo.suddenDeath.bestStreak')}</span>
                        <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {t('games.solo.suddenDeath.questions_few', { count: suddenDeathRecord.bestStreak })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center md:flex-col justify-between md:justify-center gap-3 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform shadow-xs">
                      <Play className="w-6 h-6 ml-0.5 fill-current" />
                    </div>
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>{t('games.solo.suddenDeath.start')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Duo Grid: Time Attack & Zen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Time Attack */}
                <div
                  onClick={() => handleSelectMode('time-attack')}
                  className="group relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Lightning className="w-5 h-5 fill-current" />
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/30">
                        {t('games.solo.timeAttack.badge')}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {t('games.solo.timeAttack.title')}
                    </h3>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {t('games.solo.timeAttack.desc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 block font-medium">{t('games.solo.timeAttack.record')}</span>
                      <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {timeAttackRecord.highScore.toLocaleString()} {t('games.hud.score').toLowerCase()}
                      </span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs group-hover:scale-105 active:scale-95 transition-all">
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t('games.solo.timeAttack.play')}</span>
                    </div>
                  </div>
                </div>

                {/* Zen Mode */}
                <div
                  onClick={() => handleSelectMode('zen')}
                  className="group relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Sparkle className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full border border-primary-200/50 dark:border-primary-900/30">
                        {t('games.solo.zen.badge')}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {t('games.solo.zen.title')}
                    </h3>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {t('games.solo.zen.desc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 block font-medium">{t('games.solo.zen.completed')}</span>
                      <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {zenRecord.highScore}
                      </span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs group-hover:scale-105 active:scale-95 transition-all">
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t('games.solo.zen.play')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimal Info Footnote */}
              <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('games.solo.comboFootnote', 'Każda poprawna odpowiedź buduje mnożnik combo (do x5)')}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Stack className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t('games.solo.savedPacksFootnote', 'Zapisane bazy pytań: {{count}}', { count: sessions.length })}</span>
                </div>
              </div>
          </div>
        ) : (
          <div>
            {!user ? (
              <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs max-w-md mx-auto my-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  {t('games.tabs.multiplayer')}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  {t('games.multiplayerPrompt')}
                </p>
                <Button
                  variant="primary"
                  className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
                  onClick={onNavigateToAuth}
                >
                  <SignIn className="w-4 h-4" />
                  <span>{t('games.multiplayerLogin')}</span>
                </Button>
              </div>
            ) : (
              <MultiplayerView onStartSession={onStartSession} />
            )}
          </div>
        )}

        {/* Deck Picker Sheet (Apple Modal Dialog) */}
        <AnimatePresence>
          {selectedModeForDeckPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                className="w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.25)] p-6 sm:p-8 flex flex-col max-h-[85vh]"
              >
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {t('games.solo.deckPicker.title')}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {t('learn.newSessionModal.repeatMode')}:{' '}
                      <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
                        {selectedModeForDeckPicker === 'sudden-death'
                          ? 'Sudden Death'
                          : selectedModeForDeckPicker === 'time-attack'
                          ? 'Time Attack'
                          : 'Zen'}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedModeForDeckPicker(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar py-4 space-y-2">
                  {loadingSessions ? (
                    <div className="py-8 text-center text-sm text-zinc-500">
                      {t('test.loading')}
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-zinc-500">
                      {t('games.solo.deckPicker.noDecks')}
                    </div>
                  ) : (
                    sessions.map(s => {
                      const deckRecord = getSoloModeRecord(selectedModeForDeckPicker, s.id);
                      const isLoadingThis = loadingDeckId === s.id;

                      return (
                        <div
                          key={s.id}
                          onClick={() => !isLoadingThis && handleLaunchGameWithSession(s.id)}
                          className="p-3.5 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/50 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div>
                            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {s.baseName}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                              <span>{t('home.questionsCount', { count: s.totalQuestions })}</span>
                              {deckRecord.highScore > 0 && (
                                <span>• {t('games.solo.timeAttack.record')}: {deckRecord.highScore.toLocaleString()} {t('games.hud.score').toLowerCase()}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isLoadingThis ? (
                              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CaretRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
};
