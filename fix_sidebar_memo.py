with open('src/components/creator/CreatorSidebar.tsx', 'r') as f:
    content = f.read()

# Make sure memo is imported
if "memo" not in content:
    content = content.replace("import { FC, useEffect, useState } from 'react';", "import { FC, useEffect, useState, memo } from 'react';")

# The code for SidebarItem
memoized_item = """
interface SidebarItemProps {
  q: EditingQuestion;
  idx: number;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isMac: boolean;
  canDelete: boolean;
  t: any;
}

const SidebarItem = memo(({ q, idx, isActive, onClick, onDelete, onDuplicate, isMac, canDelete, t }: SidebarItemProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => onClick(q.id)}
      className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors duration-200 ${
        isActive 
          ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm' 
          : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700/50'
      }`}
    >
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold tracking-wide ${
        isActive ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
      }`}>
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0 pr-14 flex flex-col justify-center min-h-[24px]">
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
      </div>
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
        <button 
          onClick={(e) => { e.stopPropagation(); onDuplicate(q.id); }}
          className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
          title={`Duplikuj (${isMac ? '⌘' : 'Ctrl'} D)`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(q.id); }}
          disabled={!canDelete}
          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-30"
          title="Usuń"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return prev.q === next.q && prev.isActive === next.isActive && prev.idx === next.idx && prev.canDelete === next.canDelete;
});

export const CreatorSidebar: FC<CreatorSidebarProps> = ({
"""

content = content.replace("export const CreatorSidebar: FC<CreatorSidebarProps> = ({", memoized_item)

old_map = """          {filteredQuestions.map((q, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              key={q.id}
              onClick={() => setActiveId(q.id)}
              className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors duration-200 ${
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
              <div className="flex-1 min-w-0 pr-14 flex flex-col justify-center min-h-[24px]">
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
              </div>
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDuplicateQuestion(q.id); }}
                  className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                  title={`Duplikuj (${isMac ? '⌘' : 'Ctrl'} D)`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                  disabled={questions.length <= 1}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-30"
                  title="Usuń"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}"""

new_map = """          {filteredQuestions.map((q, idx) => (
            <SidebarItem
              key={q.id}
              q={q}
              idx={idx}
              isActive={activeId === q.id}
              onClick={setActiveId}
              onDelete={handleDeleteQuestion}
              onDuplicate={handleDuplicateQuestion}
              isMac={isMac}
              canDelete={questions.length > 1}
              t={t}
            />
          ))}"""

content = content.replace(old_map, new_map)

with open('src/components/creator/CreatorSidebar.tsx', 'w') as f:
    f.write(content)
