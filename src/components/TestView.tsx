import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SessionState } from '../models/types';
import { useTestEngine } from '../hooks/useTestEngine';
import { TestHeader } from './test-view/TestHeader';
import { QuestionCard } from './test-view/QuestionCard';
import { TestSidebar } from './test-view/TestSidebar';
import { PreviousQuestionModal } from './test-view/PreviousQuestionModal';

interface TestViewProps {
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

  const engine = useTestEngine({
    session,
    sessionId,
    onSessionUpdate,
    onQuitToggle: () => setConfirmQuit(q => !q),
    showingPrevious,
    setShowingPrevious,
  });

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
      <TestHeader
        progressPercent={engine.progressPercent}
        doneCount={engine.doneCount}
        totalQuestions={engine.totalQuestions}
        elapsed={engine.elapsed}
        confirmQuit={confirmQuit}
        onQuitToggle={() => setConfirmQuit(!confirmQuit)}
        onQuitConfirm={onQuit}
      />

      <main className="flex-1 flex items-start py-8 pb-16 w-full">
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
