with open('src/components/creator/CreatorSidebar.tsx', 'r') as f:
    content = f.read()

# Replace the question item div structure
old_div = """          <div
            key={q.id}
            onClick={() => setActiveId(q.id)}
            className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
              activeId === q.id 
                ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm' 
                : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700/50'
            }`}
          >
            <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
              activeId === q.id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {q.filename}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {q.text || t('creator.emptyQuestion')}
              </div>
            </div>"""

new_div = """          <div
            key={q.id}
            onClick={() => setActiveId(q.id)}
            className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 ${
              activeId === q.id 
                ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm' 
                : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700/50'
            }`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold tracking-wide ${
              activeId === q.id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center min-h-[24px]">
              <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate leading-6 -mt-1">
                {q.filename}
              </div>
              {q.text ? (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-snug -mt-0.5">
                  {q.text}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400/70 dark:text-zinc-500/50 italic truncate leading-snug -mt-0.5">
                  {t('creator.emptyQuestion')}
                </div>
              )}
            </div>"""

content = content.replace(old_div, new_div)

with open('src/components/creator/CreatorSidebar.tsx', 'w') as f:
    f.write(content)

