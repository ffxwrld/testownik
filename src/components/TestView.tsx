import { type FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import { Player } from '../hooks/useMultiplayer';
import { Button } from './ui/Button';

import { useTranslation } from 'react-i18next';
import { SessionState } from '../models/types';
import { useTestEngine } from '../hooks/useTestEngine';
import { TestHeader } from './test-view/TestHeader';
import { QuestionCard } from './test-view/QuestionCard';
import { TestSidebar } from './test-view/TestSidebar';
import { PreviousQuestionModal } from './test-view/PreviousQuestionModal';

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

  const { roomCode, players, broadcastTestProgress } = useMultiplayerContext();
  
  const engine = useTestEngine({
    session,
    sessionId,
    onSessionUpdate,
    onQuitToggle: () => setConfirmQuit(q => !q),
    showingPrevious,
    setShowingPrevious,
  });


  useEffect(() => {
    if (roomCode && engine.progressPercent !== undefined) {
      broadcastTestProgress(engine.progressPercent);
    }
  }, [engine.progressPercent, roomCode, broadcastTestProgress]);

  if (!engine.currentQuestion) {

    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          {t('test.finishedTitle')}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
          {t('test.finishedDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <AnimatePresence>
      {engine.isAfk && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="text-5xl mb-4">😴</div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Hej, jesteś tam?</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Czas nauki został wstrzymany ze względu na brak aktywności przez dłuższą chwilę.</p>
            <Button onClick={() => engine.setIsAfk(false)} variant="primary" className="w-full py-3">
              Wracam do nauki
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
      />

      {roomCode && players.length > 1 && (
        <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-3 flex flex-col gap-2">
          {players.filter((p: Player) => p.status === 'ready' || p.progress > 0).map((p: Player) => (
            <div key={p.userId} className="flex items-center gap-3">
              <img src={p.avatarUrl} alt={p.username} className="w-6 h-6 rounded-full border border-zinc-200" />
              <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${p.progress}%` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
                />
              </div>
              <span className="text-xs font-bold text-zinc-500 w-10 text-right">{Math.round(p.progress)}%</span>
            </div>
          ))}
        </div>
      )}


      <main className="flex-1 flex items-start py-8 pb-40 md:pb-16 w-full">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 items-stretch md:items-center pb-12">
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
          />

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
          />
        </div>
      </main>

      {showingPrevious && engine.previousQuestion && (
        <PreviousQuestionModal
          previousQuestion={engine.previousQuestion}
          sessionId={sessionId}
          onClose={() => setShowingPrevious(false)}
        />
      )}
    </div>
  );
};
