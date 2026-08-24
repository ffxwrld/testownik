with open('src/components/creator/CreatorEditor.tsx', 'r') as f:
    content = f.read()

old_button = """              <Button size="sm" variant="ghost" onClick={handleAddAnswer} className="text-primary-600 dark:text-primary-400 font-semibold border border-dashed border-primary-200 dark:border-primary-800/50 w-full bg-primary-50/50 dark:bg-primary-900/10">
                {t('creator.addAnswerVariant')}
              </Button>"""

new_button = """              <Button size="sm" variant="ghost" onClick={handleAddAnswer} className="text-primary-600 dark:text-primary-400 font-semibold border border-dashed border-primary-200 dark:border-primary-800/50 w-full bg-primary-50/50 dark:bg-primary-900/10 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('creator.addAnswerVariant')}
              </Button>"""
content = content.replace(old_button, new_button)

with open('src/components/creator/CreatorEditor.tsx', 'w') as f:
    f.write(content)
