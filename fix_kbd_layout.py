with open('src/components/test-view/QuestionCard.tsx', 'r') as f:
    content = f.read()

old_hints = """            {/* Keyboard hint */}
            <div className="flex items-center justify-center gap-2 pb-6 pt-1 flex-wrap px-4">
              <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 leading-relaxed">
                <span className="font-medium">{t('test.keyboard')}</span>{' '}
                {currentQuestion.answers.map((_, i) => (
                  <Fragment key={i}>
                    <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      {ANSWER_KEYS[i]}
                    </kbd>
                  </Fragment>
                ))}
                
                <span className="mx-2.5 opacity-40">•</span>
                <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  Enter
                </kbd>
                <span className="ml-1 opacity-75">{feedback ? t('test.nextBtn') : t('test.confirmBtn')}</span>
                
                <span className="mx-2.5 opacity-40">•</span>
                <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  Backspace
                </kbd>
                <span className="ml-1 opacity-75">{t('test.prevQuestion')}</span>
              </p>
            </div>"""

new_hints = """            {/* Keyboard hint */}
            <div className="flex items-center justify-center gap-x-5 gap-y-3 pb-6 pt-1 flex-wrap px-4 text-xs text-zinc-400 dark:text-zinc-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('test.keyboard')}</span>
                <div className="flex items-center gap-1">
                  {currentQuestion.answers.map((_, i) => (
                    <kbd key={i} className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      {ANSWER_KEYS[i]}
                    </kbd>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  Enter
                </kbd>
                <span className="opacity-75">{feedback ? t('test.nextBtn') : t('test.confirmBtn')}</span>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  Backspace
                </kbd>
                <span className="opacity-75">{t('test.prevQuestion')}</span>
              </div>
            </div>"""

content = content.replace(old_hints, new_hints)

with open('src/components/test-view/QuestionCard.tsx', 'w') as f:
    f.write(content)

