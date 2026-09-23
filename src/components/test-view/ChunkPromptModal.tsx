import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stack, Check, ArrowRight } from '@phosphor-icons/react';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '../ui/Button';

interface ChunkPromptModalProps {
  isOpen: boolean;
  totalQuestions: number;
  baseName: string;
  onConfirm: (chunkSize: number | null) => void;
}

export const ChunkPromptModal: React.FC<ChunkPromptModalProps> = ({
  isOpen,
  totalQuestions,
  baseName,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const half = Math.ceil(totalQuestions / 2);
  const options = [
    {
      size: 50,
      label: t('test.chunkPrompt.opt50', 'Paczki po 50 pytań'),
      badge: t('test.chunkPrompt.recommendedBadge', 'Polecane'),
      description: t('test.chunkPrompt.opt50Desc', '{{chunks}} części • optymalne na 15–20 min nauki', { chunks: Math.ceil(totalQuestions / 50) }),
    },
    {
      size: half,
      label: t('test.chunkPrompt.optHalf', 'Podział na 2 równe części'),
      description: t('test.chunkPrompt.optHalfDesc', '2 części po ok. {{count}} pytań', { count: half }),
    },
    {
      size: 30,
      label: t('test.chunkPrompt.opt30', 'Mniejsze paczki (po 30 pytań)'),
      description: t('test.chunkPrompt.opt30Desc', '{{chunks}} części • szybkie powtórki', { chunks: Math.ceil(totalQuestions / 30) }),
    },
    {
      size: null,
      label: t('test.chunkPrompt.optAll', 'Cała baza na raz ({{count}} pytań)', { count: totalQuestions }),
      description: t('test.chunkPrompt.optAllDesc', 'Bez dzielenia na partie • klasyczny tryb'),
    },
  ];

  const [selectedSize, setSelectedSize] = useState<number | null>(50);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
          className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20 border border-black/[0.08] dark:border-white/[0.12] p-6 md:p-8 overflow-hidden"
        >
          {/* Specular hairline top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
              <Stack className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {t('test.chunkPrompt.title', 'Podziel test na części')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tabular-nums">
                {t('test.chunkPrompt.questionsCount', '{{count}} pytań w bazie', { count: totalQuestions })}
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 mb-5 leading-relaxed">
            <Trans
              i18nKey="test.chunkPrompt.description"
              values={{ baseName, count: totalQuestions }}
              components={{
                strong: <strong className="font-semibold text-zinc-800 dark:text-zinc-200" />,
                strongNumber: <strong className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums" />
              }}
            />
          </p>

          <div className="space-y-2 mb-6">
            {options.map(opt => {
              const isSelected = selectedSize === opt.size;
              return (
                <motion.button
                  key={String(opt.size)}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.18 }}
                  onClick={() => setSelectedSize(opt.size)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 focus:outline-none select-none ${
                    isSelected
                      ? 'border-primary-500/80 bg-primary-500/[0.06] dark:bg-primary-400/[0.08] ring-1 ring-primary-500/30 text-zinc-900 dark:text-zinc-50'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-zinc-300 dark:border-zinc-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{opt.label}</span>
                        {opt.badge && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onConfirm(selectedSize)}
              className="rounded-xl shadow-lg shadow-primary-600/20 py-3.5"
            >
              <span>{selectedSize ? t('test.chunkPrompt.startChunk1', 'Rozpocznij Część 1') : t('test.chunkPrompt.startAll', 'Rozpocznij cały test')}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
