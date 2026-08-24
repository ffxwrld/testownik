import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCreatorEngine, EditingQuestion, EditingAnswer } from '../hooks/useCreatorEngine';
export type { EditingQuestion, EditingAnswer };
import { CreatorHeader } from './creator/CreatorHeader';
import { CreatorSidebar } from './creator/CreatorSidebar';
import { CreatorEditor } from './creator/CreatorEditor';
import { Button } from './ui/Button';

interface CreatorViewProps {
  onQuit: () => void;
  initialQuestions?: EditingQuestion[];
  initialBaseName?: string;
  initialImages?: Record<string, Blob>;
  onSaveToTestownik: (questions: EditingQuestion[], baseName: string, images: Record<string, Blob>) => void;
}

export const CreatorView: FC<CreatorViewProps> = ({ 
  onQuit, initialQuestions, initialBaseName, initialImages, onSaveToTestownik 
}) => {
  const { t } = useTranslation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const engine = useCreatorEngine(
    initialQuestions, initialBaseName, initialImages
  );

  // Protection against page reload (F5, Cmd+R) / tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      <CreatorHeader 
        onQuit={onQuit} 
        onSaveClick={() => {
          if (engine.savePromptName.trim()) {
            onSaveToTestownik(engine.questions, engine.savePromptName.trim(), engine.images);
          } else {
            engine.setShowSavePrompt(true);
          }
        }} 
        questionsCount={engine.questions.length}
        baseName={engine.savePromptName}
        setBaseName={engine.setSavePromptName}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
      />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
              onClick={() => setIsMobileSidebarOpen(false)} 
            />
          )}
        </AnimatePresence>

        {/* Sidebar Container */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out flex flex-col
          md:relative md:flex md:w-80 md:h-full md:border-r md:border-zinc-200 md:dark:border-zinc-800 md:shadow-none md:translate-x-0
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-800 dark:text-zinc-200">Lista pytań ({engine.questions.length})</h2>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <CreatorSidebar 
            questions={engine.questions}
            activeId={engine.activeId}
            setActiveId={engine.setActiveId}
            searchQuery={engine.searchQuery}
            setSearchQuery={engine.setSearchQuery}
            handleAddQuestion={engine.handleAddQuestion}
            handleDeleteQuestion={engine.handleDeleteQuestion}
            handleDuplicateQuestion={engine.handleDuplicateQuestion}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
        </div>
        
        

        <CreatorEditor 
          activeQuestion={engine.activeQuestion}
          updateActiveQuestion={engine.updateActiveQuestion}
                    activeImageUrl={engine.activeImageUrl || null}
          handleImageUpload={engine.handleImageUpload}
          handleImageDelete={engine.handleImageDelete}
          setFullscreenImage={engine.setFullscreenImage}
          updateAnswer={engine.updateAnswer}
          handleAddAnswer={engine.handleAddAnswer}
          handleDeleteAnswer={engine.handleDeleteAnswer}
        />
      </main>

      {/* MODALS */}
      {engine.fullscreenImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => engine.setFullscreenImage(null)}
        >
          <img 
            src={engine.fullscreenImage} 
            alt="Podgląd" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}

      {engine.showSavePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t('creator.saveModalTitle')}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{t('creator.saveModalDesc')}</p>
            <input
              type="text"
              autoFocus
              value={engine.savePromptName}
              onChange={e => engine.setSavePromptName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && engine.savePromptName.trim()) {
                  onSaveToTestownik(engine.questions, engine.savePromptName.trim(), engine.images);
                  engine.setShowSavePrompt(false);
                }
                if (e.key === 'Escape') engine.setShowSavePrompt(false);
              }}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 mb-5"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => engine.setShowSavePrompt(false)}>
                {t('creator.cancel')}
              </Button>
              <Button variant="primary" onClick={() => {
                if (engine.savePromptName.trim()) {
                  onSaveToTestownik(engine.questions, engine.savePromptName.trim(), engine.images);
                  engine.setShowSavePrompt(false);
                }
              }} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                {t('creator.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
