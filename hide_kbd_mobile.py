with open('src/components/test-view/QuestionCard.tsx', 'r') as f:
    content = f.read()

old_hints = '<div className="flex items-center justify-center gap-x-5 gap-y-3 pb-6 pt-1 flex-wrap px-4 text-xs text-zinc-400 dark:text-zinc-600">'
new_hints = '<div className="hidden md:flex items-center justify-center gap-x-5 gap-y-3 pb-6 pt-1 flex-wrap px-4 text-xs text-zinc-400 dark:text-zinc-600">'

content = content.replace(old_hints, new_hints)

with open('src/components/test-view/QuestionCard.tsx', 'w') as f:
    f.write(content)
