import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionState, Answer } from '../models/types';
import { useFlashcardsEngine } from '../hooks/useFlashcardsEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuestionNoteEditor } from './test-view/QuestionNoteEditor';
import { ChevronLeft } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  session: SessionState;
  sessionId: string;
  onExit: () => void;
}

export const FlashcardsView: React.FC<Props> = ({ session, sessionId, onExit }) => {
  const engine = useFlashcardsEngine(session);
  const { currentQuestion, isFlipped, flipCard, markKnown, markRepeat, state, totalUnique } = engine;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoruj jeśli użytkownik pisze w notatkach
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipCard();
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        if (isFlipped) {
          e.preventDefault();
          markRepeat();
        }
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        if (isFlipped) {
          e.preventDefault();
          markKnown();
        }
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipCard, markKnown, markRepeat, isFlipped, onExit]);

  if (state.isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50 dark:bg-black">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Gratulacje!</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">Opanowałeś wszystkie {totalUnique} pytań w trybie fiszek.</p>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={onExit}>Zakończ</Button>
          <Button variant="primary" onClick={engine.restart}>Zacznij ponownie</Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progress = (state.masteredIds.size / totalUnique) * 100;

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black overflow-hidden relative">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center p-4">
        <button
          onClick={onExit}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
        </button>
        <div className="flex-1 px-4">
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden w-full max-w-md mx-auto">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="text-sm font-bold tabular-nums text-zinc-500 w-12 text-right">
          {state.masteredIds.size}/{totalUnique}
        </div>
      </header>

      <div 
        className="flex-1 flex items-center justify-center p-6"
        style={{ perspective: '1500px', WebkitPerspective: '1500px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20, transition: { duration: 0.15 } }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl aspect-[3/4] max-h-[70vh] cursor-pointer"
            style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
            onClick={flipCard}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className="w-full h-full"
              style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div 
                className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col p-8"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <div className="flex-1 flex items-center justify-center text-center">
                  <MarkdownRenderer content={currentQuestion.text} className="text-2xl font-bold leading-tight" />
                </div>
                <div className="text-center text-sm font-medium text-zinc-400 dark:text-zinc-600 pb-2">
                  Naciśnij spację lub dotknij, by obrócić
                </div>
              </div>

              {/* Back */}
              <div 
                className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-3xl shadow-2xl border-2 border-emerald-500/20 flex flex-col p-8 overflow-y-auto"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                  <MarkdownRenderer content={currentQuestion.text} className="text-lg font-medium text-zinc-500 dark:text-zinc-400" />
                </div>
                
                <div className="flex-1 flex flex-col gap-3 justify-center">
                  {currentQuestion.answers.filter((a: Answer) => a.isCorrect).map((a: Answer, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-100 font-semibold text-lg">
                      <MarkdownRenderer content={a.text} />
                    </div>
                  ))}
                  {currentQuestion.answers.filter((a: Answer) => !a.isCorrect).length === 0 && (
                    <p className="text-sm text-zinc-400 text-center mt-4">To pytanie ma tylko definicję.</p>
                  )}
                </div>

                <div className="mt-8" onClick={(e) => e.stopPropagation()}>
                  <QuestionNoteEditor sessionId={sessionId} questionId={currentQuestion.id} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Bar (visible only when flipped) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex-shrink-0 p-6 flex items-center justify-center gap-4"
          >
            <button
              onClick={(e) => { e.stopPropagation(); markRepeat(); }}
              className="flex items-center gap-3 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-6 py-4 rounded-2xl font-bold transition-colors shadow-sm active:scale-95"
            >
              <kbd className="hidden sm:inline bg-red-200 dark:bg-red-900 px-2 py-0.5 rounded text-xs">1</kbd>
              Powtórz
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); markKnown(); }}
              className="flex items-center gap-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 px-6 py-4 rounded-2xl font-bold transition-colors shadow-sm active:scale-95"
            >
              <kbd className="hidden sm:inline bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded text-xs">2</kbd>
              Umiem
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
