import { type FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Moon, Check } from 'lucide-react';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import { MultiplayerRaceTrack } from './multiplayer/MultiplayerRaceTrack';
import { Button } from './ui/Button';

import { useTranslation } from 'react-i18next';
import { SessionState } from '../models/types';
import { useTestEngine } from '../hooks/useTestEngine';
import { TestHeader } from './test-view/TestHeader';
import { QuestionCard } from './test-view/QuestionCard';
import { TestSidebar } from './test-view/TestSidebar';
import { PreviousQuestionModal } from './test-view/PreviousQuestionModal';
import { ChunkPromptModal } from './test-view/ChunkPromptModal';
import { ChunkSelectorModal } from './test-view/ChunkSelectorModal';
import { ChunkCompletionModal } from './test-view/ChunkCompletionModal';

interface TestViewProps {
  onOpenSettings?: () => void;
  session: SessionState;
  sessionId: string;
  onSessionUpdate: (session: SessionState) => void;
  onQuit: () => void;
}

export const TestView: FC<TestViewProps> = ({
  session,
  sessionId,
  onSessionUpdate,
  onQuit,
}) => {
  const { t } = useTranslation();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showingPrevious, setShowingPrevious] = useState(false);
  const [showChunkPrompt, setShowChunkPrompt] = useState(
    () => session.questions.length > 80 && session.chunkConfig === undefined
  );
  const [showChunkSelector, setShowChunkSelector] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('testownik_test_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('testownik_test_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (session.questions.length > 80 && session.chunkConfig === undefined) {
      setShowChunkPrompt(true);
    }
  }, [sessionId, session.questions.length, session.chunkConfig]);

  const { roomCode, players, broadcastTestProgress, currentUserId } = useMultiplayerContext();
  const isMultiplayer = Boolean(roomCode);
  
  const engine = useTestEngine({
    session,
    sessionId,
    onSessionUpdate,
    onQuitToggle: () => setConfirmQuit(q => !q),
    showingPrevious,
    setShowingPrevious,
    instantMode: isMultiplayer,
  });

  useEffect(() => {
    if (roomCode && engine.progressPercent !== undefined) {
      broadcastTestProgress(engine.progressPercent);
    }
  }, [engine.progressPercent, roomCode, broadcastTestProgress]);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <AnimatePresence>
        {engine.isAfk && !isMultiplayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-black/20 border border-black/[0.08] dark:border-white/[0.12]"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
                <Moon className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">{t('test.afkTitle')}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">{t('test.afkDesc')}</p>
              <Button onClick={() => engine.dismissAfk()} variant="primary" className="w-full py-3 rounded-xl">
                {t('test.afkResume')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TestHeader
        progressPercent={engine.progressPercent}
        doneCount={engine.doneCount}
        totalQuestions={engine.totalQuestions}
        elapsed={engine.elapsed}
        confirmQuit={confirmQuit}
        onQuitToggle={() => setConfirmQuit(!confirmQuit)}
        onQuitConfirm={onQuit}
        chunkLabel={engine.chunkLabel}
        onOpenChunkSelector={() => setShowChunkSelector(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={isMultiplayer ? undefined : handleToggleSidebar}
        hideProgressBar={Boolean(roomCode && players.length > 1)}
      >
        {roomCode && players.length > 1 && (
          <MultiplayerRaceTrack
            players={players}
            currentUserId={currentUserId}
          />
        )}
      </TestHeader>

      <main className="flex-1 flex items-start py-8 pb-40 md:pb-16 w-full">
        {engine.isChunkCompleted && engine.activeChunk ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center justify-center text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7" strokeWidth={2.2} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
              {t('test.chunkCompleted', { index: engine.activeChunk.index + 1 })}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm leading-relaxed">
              {t('test.chunkMastered', { count: engine.activeChunk.totalQuestions })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center max-w-xs">
              {engine.activeChunk.index + 1 < engine.chunks.length && (
                <Button
                  variant="primary"
                  className="rounded-xl py-3 shadow-lg shadow-primary-600/20"
                  onClick={() => engine.switchChunk(engine.activeChunk!.index + 1)}
                >
                  {t('test.chunkNext', { index: engine.activeChunk.index + 2 })}
                </Button>
              )}
              <Button
                variant="secondary"
                className="rounded-xl py-3"
                onClick={() => setShowChunkSelector(true)}
              >
                {t('test.chunkSelectOther')}
              </Button>
            </div>
          </motion.div>
        ) : engine.currentQuestion ? (
          <div className={`w-full mx-auto px-4 md:px-8 flex flex-col ${
            isMultiplayer
              ? 'max-w-3xl items-center'
              : (isSidebarCollapsed ? 'max-w-4xl md:flex-row gap-8 items-stretch md:items-center justify-center' : 'max-w-5xl md:flex-row gap-8 items-stretch md:items-center')
          } pb-12 transition-all duration-300`}>
            <motion.div
              key={engine.shakeKey}
              animate={engine.shakeKey > 0 ? { x: [0, -10, 10, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full flex-1 min-w-0"
            >
              <QuestionCard
                questionKey={engine.questionKey}
                currentQuestion={engine.currentQuestion}
                sessionId={sessionId}
                remainingCount={engine.remainingCount}
                isMultiAnswer={engine.isMultiAnswer}
                wrongCountForCurrent={engine.wrongCountForCurrent}
                shuffledOrder={engine.shuffledOrder}
                selectedIndices={engine.selectedIndices}
                feedback={engine.feedback}
                onToggleAnswer={engine.handleToggleAnswer}
                hideNavigationHints={isMultiplayer}
              />

              {/* In multiplayer race, show confirm button ONLY for multi-answer questions */}
              {isMultiplayer && engine.isMultiAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex justify-center w-full"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={engine.isTransitioning || engine.selectedIndices.length === 0}
                    onClick={engine.handleConfirm}
                    className="px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-600/25 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    <span>{t('games.solo.confirmAnswer', 'Zatwierdź odpowiedź (Spacja / Enter)')}</span>
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {!isMultiplayer && (
              <TestSidebar
                requiredStreak={engine.requiredStreak}
                consecutiveCorrect={engine.consecutiveCorrect}
                feedback={engine.feedback}
                isTransitioning={engine.isTransitioning}
                selectedIndices={engine.selectedIndices}
                canConfirm={engine.canConfirm}
                hasPreviousQuestion={engine.previousQuestion !== null}
                onConfirm={engine.handleConfirm}
                onNext={engine.handleNext}
                onShowPrevious={() => setShowingPrevious(true)}
                isCollapsed={isSidebarCollapsed}
                onExpand={handleToggleSidebar}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              {t('test.finishedTitle')}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
              {t('test.finishedDesc')}
            </p>
          </div>
        )}
      </main>

      {showingPrevious && engine.previousQuestion && (
        <PreviousQuestionModal
          previousQuestion={engine.previousQuestion}
          sessionId={sessionId}
          onClose={() => setShowingPrevious(false)}
        />
      )}

      {/* Chunk prompt modal for large databases (> 80 questions) */}
      <ChunkPromptModal
        isOpen={showChunkPrompt}
        totalQuestions={session.questions.length}
        baseName={session.baseName || t('sessionsList.defaultBaseName', 'Baza pytań')}
        onConfirm={async (chunkSize) => {
          setShowChunkPrompt(false);
          await engine.configureChunking(chunkSize);
        }}
      />

      {/* Chunk part selector */}
      <ChunkSelectorModal
        isOpen={showChunkSelector}
        onClose={() => setShowChunkSelector(false)}
        chunks={engine.chunks}
        activeChunkIndex={engine.activeChunkIndex}
        questions={session.questions}
        doneIds={session.done}
        baseName={session.baseName || t('sessionsList.defaultBaseName', 'Baza pytań')}
        onSelectChunk={async (chunkIndex) => {
          setShowChunkSelector(false);
          await engine.switchChunk(chunkIndex);
        }}
        onReconfigureChunks={() => {
          setShowChunkSelector(false);
          setShowChunkPrompt(true);
        }}
      />

      {/* Chunk completion celebration modal */}
      {engine.activeChunk && (
        <ChunkCompletionModal
          isOpen={engine.isChunkCompleted && !showChunkSelector && !showChunkPrompt}
          chunkIndex={engine.activeChunk.index}
          totalChunks={engine.chunks.length}
          chunkQuestionsCount={engine.activeChunk.totalQuestions}
          hasNextChunk={engine.activeChunk.index + 1 < engine.chunks.length}
          onNextChunk={() => engine.switchChunk(engine.activeChunk!.index + 1)}
          onRepeatChunk={() => engine.repeatChunk()}
          onOpenSelector={() => setShowChunkSelector(true)}
          onFinishTest={() => engine.finishTest()}
        />
      )}
    </div>
  );
};
