import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, Play, CheckCircle2, SlidersHorizontal, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChunkInfo, Question } from '../../models/types';
import { getChunkProgress } from '../../utils/session';

interface ChunkSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: ChunkInfo[];
  activeChunkIndex: number | null;
  questions: Question[];
  doneIds: string[];
  baseName: string;
  onSelectChunk: (chunkIndex: number | null) => void;
  onReconfigureChunks?: () => void;
}

export const ChunkSelectorModal: React.FC<ChunkSelectorModalProps> = ({
  isOpen,
  onClose,
  chunks,
  activeChunkIndex,
  questions,
  doneIds,
  baseName,
  onSelectChunk,
  onReconfigureChunks,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const totalDone = doneIds.length;
  const totalQuestions = questions.length;
  const overallPercent = totalQuestions > 0 ? Math.round((totalDone / totalQuestions) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          className="relative w-full max-w-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20 border border-black/[0.08] dark:border-white/[0.12] p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Specular hairline top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {t('test.chunkSelectorModal.title', 'Wybierz część')}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-xs md:max-w-md tabular-nums">
                  {t('test.chunkSelectorModal.subtitle', '{{baseName}} • Opanowano {{done}}/{{total}} ({{percent}}%)', {
                    baseName,
                    done: totalDone,
                    total: totalQuestions,
                    percent: overallPercent,
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t('common.close', 'Zamknij')}
              aria-label={t('common.close', 'Zamknij')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List of Chunks */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
            {chunks.map(chunk => {
              const { completed, total, percent } = getChunkProgress(chunk, questions, doneIds);
              const isActive = activeChunkIndex === chunk.index;
              const isFinished = completed >= total && total > 0;

              return (
                <motion.button
                  key={chunk.index}
                  type="button"
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.18 }}
                  onClick={() => onSelectChunk(chunk.index)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col gap-2.5 focus:outline-none ${
                    isActive
                      ? 'border-primary-500/80 bg-primary-500/[0.06] dark:bg-primary-400/[0.08] ring-1 ring-primary-500/30'
                      : isFinished
                      ? 'border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-400/[0.04] hover:border-emerald-500/50'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {t('test.chunkSelectorModal.part', 'Część {{index}}', { index: chunk.index + 1 })}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium tabular-nums">
                        ({chunk.startIndex + 1}–{chunk.endIndex + 1})
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                          {t('test.chunkSelectorModal.active', 'Aktywna')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('test.chunkSelectorModal.completed', 'Ukończona')}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
                          {completed}/{total} ({percent}%)
                        </span>
                      )}
                      <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary-600 transition-colors">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        isFinished ? 'bg-emerald-500' : 'bg-primary-500'
                      }`}
                      initial={false}
                      animate={{ width: `${percent}%` }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                    />
                  </div>
                </motion.button>
              );
            })}

            {/* Whole Test Option */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.18 }}
              onClick={() => onSelectChunk(null)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between focus:outline-none ${
                activeChunkIndex === null
                  ? 'border-primary-500/80 bg-primary-500/[0.06] dark:bg-primary-400/[0.08] ring-1 ring-primary-500/30'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {t('test.chunkSelectorModal.wholeTest', 'Cała baza razem')}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium tabular-nums">
                      {t('test.chunkSelectorModal.questionsCount', '({{count}} pytań)', { count: totalQuestions })}
                    </span>
                    {activeChunkIndex === null && (
                      <span className="text-[10px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                        {t('test.chunkSelectorModal.active', 'Aktywna')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {t('test.chunkSelectorModal.wholeTestDesc', 'Rozwiązuj wszystkie pytania w jednym wspólnym teście')}
                  </p>
                </div>
              </div>
              <Play className="w-4 h-4 text-zinc-400 fill-current" />
            </motion.button>
          </div>

          {/* Footer with Reconfigure option */}
          {onReconfigureChunks && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
              <button
                type="button"
                onClick={onReconfigureChunks}
                className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t('test.chunkSelectorModal.reconfigure', 'Zmień wielkość paczek lub wyłącz podział')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
