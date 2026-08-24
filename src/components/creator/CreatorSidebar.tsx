import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { EditingQuestion } from '../../hooks/useCreatorEngine';
import { Button } from '../ui/Button';

interface CreatorSidebarProps {
  questions: EditingQuestion[];
  activeId: string;
  setActiveId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleAddQuestion: () => void;
  handleDeleteQuestion: (id: string) => void;
  handleDuplicateQuestion: (id: string) => void;
}

export const CreatorSidebar: FC<CreatorSidebarProps> = ({
  questions, activeId, setActiveId,
  searchQuery, setSearchQuery,
  handleAddQuestion, handleDeleteQuestion, handleDuplicateQuestion
}) => {
  const { t } = useTranslation();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const filteredQuestions = questions.filter(q => 
    q.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-full md:w-80 h-[35%] md:h-full flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="relative mb-3">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder={t('creator.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
          />
        </div>
        <Button onClick={handleAddQuestion} className="w-full justify-between bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 border-transparent shadow-sm px-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('creator.addQuestion')}
          </div>
          <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-sans text-zinc-400 bg-zinc-700 dark:text-zinc-500 dark:bg-zinc-200 rounded border border-zinc-600 dark:border-zinc-300">
            {isMac ? '⌘' : 'Ctrl'} ↵
          </kbd>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredQuestions.map((q, idx) => (
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
          ))}
        </AnimatePresence>
      </div>
    </aside>
  );
};
