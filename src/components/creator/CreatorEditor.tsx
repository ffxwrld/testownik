import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { EditingQuestion, EditingAnswer } from '../../hooks/useCreatorEngine';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface CreatorEditorProps {
  activeQuestion: EditingQuestion;
  updateActiveQuestion: (updates: Partial<EditingQuestion>) => void;
    activeImageUrl: string | null;
  handleImageUpload: (file: File) => void;
  handleImageDelete: () => void;
  setFullscreenImage: (url: string | null) => void;
  updateAnswer: (id: string, updates: Partial<EditingAnswer>) => void;
  handleAddAnswer: () => void;
  handleDeleteAnswer: (id: string) => void;
}

export const CreatorEditor: FC<CreatorEditorProps> = ({
  activeQuestion, updateActiveQuestion,
  activeImageUrl, handleImageUpload, handleImageDelete, setFullscreenImage,
  updateAnswer, handleAddAnswer, handleDeleteAnswer
}) => {
  const { t } = useTranslation();

  if (!activeQuestion) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-400">
        {t('creator.selectOrCreate')}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6 lg:p-10 relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeQuestion.id}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8 pb-32"
        >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              {t('creator.fileName')}
            </label>
            <input
              type="text"
              value={activeQuestion.filename}
              onChange={e => updateActiveQuestion({ filename: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium text-[15px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm transition"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Kategoria
            </label>
            <input
              type="text"
              value={activeQuestion.category}
              onChange={e => updateActiveQuestion({ category: e.target.value.toUpperCase() })}
              maxLength={1}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium text-[15px] text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm transition uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            {t('creator.questionContent')}
          </label>
          <textarea
            value={activeQuestion.text}
            onChange={e => updateActiveQuestion({ text: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm transition resize-y min-h-[120px]"
            placeholder={t('creator.questionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            {t('creator.imageLabel')}
          </label>
          {activeImageUrl ? (
            <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 group">
              <div 
                className="h-48 w-full rounded-lg bg-zinc-100 dark:bg-zinc-950 bg-contain bg-center bg-no-repeat cursor-zoom-in"
                style={{ backgroundImage: `url(${activeImageUrl})` }}
                onClick={() => setFullscreenImage(activeImageUrl)}
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleImageDelete}
                  className="bg-white/90 dark:bg-zinc-800/90 hover:bg-red-50 dark:hover:bg-red-900/50 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg shadow-sm backdrop-blur-sm transition-colors"
                  title="Usuń zdjęcie"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 6l-1.5 14.5a2 2 0 01-2 2H8a2 2 0 01-2-2L4.5 6m15 0H4.5m4.5 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 4v8m4-8v8" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary-400 dark:hover:border-primary-600 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageUpload(file);
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageUpload(file);
                };
                input.click();
              }}
            >
              <svg className="w-8 h-8 mb-2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-sm font-medium">{t('creator.uploadClickOrDrag')}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            {t('creator.answersLabel')}
          </label>
          <Card className="p-2 space-y-2">
            <AnimatePresence mode="popLayout" initial={false}>
            {activeQuestion.answers.map((ans, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                key={ans.id} 
                className={`flex items-start gap-3 p-2 rounded-lg border-2 transition-colors ${ans.isCorrect ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                <button
                  onClick={() => updateAnswer(ans.id, { isCorrect: !ans.isCorrect })}
                  className={`mt-1.5 flex-shrink-0 w-6 h-6 rounded flex items-center justify-center border-2 transition ${
                    ans.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-400 text-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={ans.text}
                  onChange={e => updateAnswer(ans.id, { text: e.target.value })}
                  placeholder={t('creator.answerPlaceholder', { num: idx + 1 })}
                  className="flex-1 bg-transparent border-0 focus:ring-0 px-0 py-1 text-zinc-800 dark:text-zinc-200 font-medium placeholder-zinc-300 dark:placeholder-zinc-700"
                />
                <button
                  onClick={() => handleDeleteAnswer(ans.id)}
                  disabled={activeQuestion.answers.length <= 1}
                  className="mt-1 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
            </AnimatePresence>
            
            <div className="pt-2 px-2 pb-1">
              <Button size="sm" variant="ghost" onClick={handleAddAnswer} className="text-primary-600 dark:text-primary-400 font-semibold border border-dashed border-primary-200 dark:border-primary-800/50 w-full bg-primary-50/50 dark:bg-primary-900/10 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('creator.addAnswerVariant')}
              </Button>
            </div>
          </Card>
        </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
