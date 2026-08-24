import re

with open('src/components/TestView.tsx', 'r') as f:
    content = f.read()

# 1. Revert main container
content = content.replace('<div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pb-40">', '<div className="w-full max-w-5xl mx-auto flex gap-8 items-start pb-12">')

# 2. Revert floating action bar to sidebar
old_bar = r'\{\/\* ── Floating Action Bar ────────────────────────────────────────── \*\/\}\n          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-2 rounded-\[2rem\] shadow-2xl">'
new_sidebar = r'{/* ── Right sidebar: actions ────────────────────────────────────────── */}\n          <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-24">'
content = re.sub(old_bar, new_sidebar, content)

# 3. Revert streak indicator
old_streak = r'<div className="px-4 py-1 flex flex-col items-center justify-center border-r border-zinc-200/50 dark:border-zinc-800/50">'
new_streak = r'<div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 px-5 py-4 flex flex-col items-center shadow-sm">'
content = content.replace(old_streak, new_streak)

# 4. Revert buttons width
content = content.replace('px-8 rounded-full animate-fadeIn', 'w-full rounded-2xl animate-fadeIn')
content = content.replace('px-10 rounded-full animate-fadeIn', 'w-full rounded-2xl animate-fadeIn')

# 5. Fix right sidebar closing div alignment (nothing to do, div is just closed)

with open('src/components/TestView.tsx', 'w') as f:
    f.write(content)

