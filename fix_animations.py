import re

# 1. Fix TestSidebar.tsx
with open('src/components/test-view/TestSidebar.tsx', 'r') as f:
    sidebar = f.read()

sidebar = sidebar.replace(
    "import { Check, SkipForward, ArrowLeft } from 'lucide-react';",
    "import { Check, SkipForward, ArrowLeft } from 'lucide-react';\nimport { motion, AnimatePresence } from 'framer-motion';"
)

old_buttons = """      <div className="space-y-2">
        {feedback === null && !isTransitioning && (
          <Button
            onClick={onConfirm}
            variant="primary"
            size="lg"
            disabled={!canConfirm}
            className={`w-full rounded-2xl animate-fadeIn transition-all shadow-xl shadow-primary-600/20 ${
              selectedIndices.length === 0 ? 'opacity-60' : ''
            }`}
          >
            {selectedIndices.length === 0 ? (
              <>
                <SkipForward className="w-5 h-5" />
                {t('test.skipBtn')}
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                {t('test.confirmBtn')}
              </>
            )}
          </Button>
        )}

        {feedback !== null && !isTransitioning && (
          <Button
            onClick={onNext}
            variant="primary"
            size="lg"
            className="w-full rounded-2xl animate-fadeIn shadow-xl shadow-primary-600/20"
          >
            {t('test.nextBtn')}
          </Button>
        )}
      </div>"""

new_buttons = """      <div className="relative min-h-[56px] w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          {feedback === null ? (
            <motion.div
              key="confirm-btn"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full"
            >
              <Button
                onClick={onConfirm}
                variant="primary"
                size="lg"
                disabled={!canConfirm || isTransitioning}
                className={`w-full rounded-2xl transition-all shadow-xl shadow-primary-600/20 ${
                  selectedIndices.length === 0 ? 'opacity-60' : ''
                }`}
              >
                {selectedIndices.length === 0 ? (
                  <>
                    <SkipForward className="w-5 h-5" />
                    {t('test.skipBtn')}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('test.confirmBtn')}
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="next-btn"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full"
            >
              <Button
                onClick={onNext}
                variant="primary"
                size="lg"
                disabled={isTransitioning}
                className="w-full rounded-2xl shadow-xl shadow-primary-600/20"
              >
                {t('test.nextBtn')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>"""

sidebar = sidebar.replace(old_buttons, new_buttons)

with open('src/components/test-view/TestSidebar.tsx', 'w') as f:
    f.write(sidebar)


# 2. Fix QuestionCard.tsx
with open('src/components/test-view/QuestionCard.tsx', 'r') as f:
    card = f.read()

old_animate = """      <AnimatePresence mode="wait">
        <motion.div
          key={`q-${questionKey}`}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >"""

new_animate = """      <AnimatePresence mode="popLayout">
        <motion.div
          key={`q-${questionKey}`}
          initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, scale: 0.98, filter: 'blur(8px)' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="w-full"
        >"""

card = card.replace(old_animate, new_animate)

old_answer_btn = """                return (
                  <button
                    key={answer.id}
                    onClick={() => onToggleAnswer(shuffledIdx)}
                    className={getAnswerButtonClass(shuffledIdx)}
                  >"""

new_answer_btn = """                return (
                  <motion.button
                    whileTap={feedback === null ? { scale: 0.985 } : {}}
                    key={answer.id}
                    onClick={() => onToggleAnswer(shuffledIdx)}
                    className={getAnswerButtonClass(shuffledIdx)}
                  >"""

card = card.replace(old_answer_btn, new_answer_btn)
card = card.replace("</button>", "</motion.button>")

with open('src/components/test-view/QuestionCard.tsx', 'w') as f:
    f.write(card)

