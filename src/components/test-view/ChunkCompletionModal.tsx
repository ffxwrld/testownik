import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, RotateCcw, Layers } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChunkCompletionModalProps {
  isOpen: boolean;
  chunkIndex: number;
  totalChunks: number;
  chunkQuestionsCount: number;
  hasNextChunk: boolean;
  onNextChunk: () => void;
  onRepeatChunk: () => void;
  onOpenSelector: () => void;
  onFinishTest: () => void;
}

export const ChunkCompletionModal: React.FC<ChunkCompletionModalProps> = ({
  isOpen,
  chunkIndex,
  totalChunks,
  chunkQuestionsCount,
  hasNextChunk,
  onNextChunk,
  onRepeatChunk,
  onOpenSelector,
  onFinishTest,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
          className="relative w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20 border border-black/[0.08] dark:border-white/[0.12] p-6 md:p-8 text-center overflow-hidden"
        >
          {/* Specular hairline top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent pointer-events-none" />

          {/* Trophy Icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7" strokeWidth={2.2} />
          </div>

          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
            Część {chunkIndex + 1} ukończona
          </h3>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            Opanowałeś wszystkie <strong className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">{chunkQuestionsCount} pytań</strong> z tej części ({chunkIndex + 1} z {totalChunks}).
          </p>

          <div className="space-y-2.5">
            {hasNextChunk ? (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onNextChunk}
                className="rounded-xl shadow-lg shadow-primary-600/20 py-3.5"
              >
                <span>Przejdź do Części {chunkIndex + 2}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onFinishTest}
                className="rounded-xl shadow-lg shadow-emerald-600/20 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span>Zakończ test i zobacz wyniki</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={onOpenSelector}
              className="rounded-xl py-3"
            >
              <Layers className="w-4 h-4 mr-2" />
              Wybierz inną część
            </Button>

            <div className="flex gap-2 pt-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
                onClick={onRepeatChunk}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Powtórz tę część
              </motion.button>
              {hasNextChunk && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
                  onClick={onFinishTest}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition cursor-pointer"
                >
                  Podsumowanie sesji
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
