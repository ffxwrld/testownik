import re

with open('src/components/test-view/QuestionCard.tsx', 'r') as f:
    content = f.read()

# 1. Add Fragment to imports
if 'Fragment' not in content:
    content = content.replace("import { type FC, ReactNode } from 'react';", "import { type FC, ReactNode, Fragment } from 'react';")

# 2. Add ANSWER_KEYS
if 'const ANSWER_KEYS' not in content:
    content = content.replace('export const QuestionCard', "const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6'];\n\nexport const QuestionCard")

# 3. Fix the badge to show the number
old_badge = """      } else {
        return (
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isSelected
                ? 'border-primary-500'
                : 'border-zinc-300 dark:border-zinc-600'
            }`}
          >
            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
          </div>
        );
      }"""

new_badge = """      } else {
        return (
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              isSelected
                ? 'border-primary-500 text-primary-500'
                : 'border-zinc-300 dark:border-zinc-600 group-hover:border-primary-400 dark:group-hover:border-primary-500 text-zinc-400 dark:text-zinc-500 group-hover:text-primary-500'
            }`}
          >
            {isSelected ? <div className="w-2.5 h-2.5 rounded-full bg-primary-500" /> : ANSWER_KEYS[shuffledIdx]}
          </div>
        );
      }"""
content = content.replace(old_badge, new_badge)

# 4. Add the keyboard hint below the answers
old_bottom = """              })}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};"""

new_bottom = """              })}
            </div>

            {/* Keyboard hint */}
            <div className="flex items-center justify-center gap-2 pb-6 pt-1">
              <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
                {t('test.keyboard')}{' '}
                {currentQuestion.answers.map((_, i) => (
                  <Fragment key={i}>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      {ANSWER_KEYS[i]}
                    </kbd>
                  </Fragment>
                ))}
              </p>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};"""
content = content.replace(old_bottom, new_bottom)

with open('src/components/test-view/QuestionCard.tsx', 'w') as f:
    f.write(content)
