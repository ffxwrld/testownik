import { FC } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Question } from '../../models/types';
import { SoloGameMode } from '../../utils/arcadeStorage';
import { useSoloGameEngine } from '../../hooks/useSoloGameEngine';
import { SoloGameHUD } from './SoloGameHUD';
import { SoloGameOverModal } from './SoloGameOverModal';
import { QuestionCard } from '../test-view/QuestionCard';
import { Check } from '@phosphor-icons/react';

interface SoloGameViewProps {
  mode: SoloGameMode;
  questions: Question[];
  sessionId: string;
  onExit: () => void;
}

export const SoloGameView: FC<SoloGameViewProps> = ({
  mode,
  questions,
  sessionId,
  onExit,
}) => {
  const { t } = useTranslation();
  const engine = useSoloGameEngine({
    mode,
    questions,
    sessionId,
    onExit,
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50/50 dark:bg-black select-none">
      {/* HUD Bar */}
      <SoloGameHUD
        mode={engine.mode}
        lives={engine.lives}
        timeRemaining={engine.timeRemaining}
        score={engine.score}
        combo={engine.combo}
        streak={engine.streak}
        questionIndex={engine.questionIndex}
        totalQuestions={engine.totalQuestions}
        timeDeltaNotification={engine.timeDeltaNotification}
        onFinishZen={engine.handleFinishZen}
        onExit={engine.handleExit}
      />

      {/* Main Content Area with generous breathing room under floating HUD */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8 max-w-4xl w-full mx-auto">
        {engine.currentQuestion ? (
          <motion.div
            key={engine.shakeKey}
            animate={engine.shakeKey > 0 ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full flex flex-col items-center"
          >
            <QuestionCard
              questionKey={engine.questionKey}
              currentQuestion={engine.currentQuestion}
              sessionId={sessionId}
              remainingCount={engine.totalQuestions - engine.questionIndex}
              isMultiAnswer={engine.isMultiAnswer}
              wrongCountForCurrent={0}
              shuffledOrder={engine.shuffledOrder}
              selectedIndices={engine.selectedIndices}
              feedback={engine.feedback}
              onToggleAnswer={engine.handleToggleAnswer}
              hideNavigationHints={true}
            />

            {/* If multi-answer question, render confirm action button */}
            {engine.isMultiAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center w-full"
              >
                <button
                  type="button"
                  className="px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/25 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  disabled={engine.isTransitioning || engine.selectedIndices.length === 0}
                  onClick={engine.handleConfirm}
                >
                  <Check className="w-5 h-5" />
                  <span>{t('games.solo.confirmAnswer', 'Zatwierdź odpowiedź (Spacja / Enter)')}</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </main>

      {/* Game Over / Victory Modal */}
      <SoloGameOverModal
        isOpen={engine.gameState !== 'playing'}
        mode={engine.mode}
        isVictory={engine.gameState === 'victory'}
        score={engine.score}
        longestStreak={engine.longestStreak}
        totalAnswered={engine.totalAnswered}
        correctCount={engine.correctCount}
        durationSeconds={engine.durationSeconds}
        record={engine.record}
        isNewHighScore={engine.isNewHighScore}
        isNewBestStreak={engine.isNewBestStreak}
        onRestart={engine.handleRestart}
        onExit={engine.handleExit}
      />
    </div>
  );
};
