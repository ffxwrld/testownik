import { FC, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCreatorEngine, EditingQuestion, EditingAnswer } from '../hooks/useCreatorEngine';
export type { EditingQuestion, EditingAnswer };
import { CreatorHeader } from './creator/CreatorHeader';
import { CreatorSidebar } from './creator/CreatorSidebar';
import { CreatorEditor } from './creator/CreatorEditor';
import { Button } from './ui/Button';
import { mapEditingFormatToQuestions } from '../utils/adapters';
import { exportQuestionsToZip, triggerBlobDownload } from '../utils/parser';
import { getAllSessionImages } from '../utils/db';

interface CreatorViewProps {
  onQuit: () => void;
  initialQuestions?: EditingQuestion[];
  initialBaseName?: string;
  initialImageNames?: string[];
  sourceSessionId?: string;
  onSaveToTestownik: (questions: EditingQuestion[], baseName: string, newImages: Record<string, Blob>, existingImages: string[], sourceSessionId?: string) => void;
}

export const CreatorView: FC<CreatorViewProps> = ({ 
  onQuit, initialQuestions, initialBaseName, initialImageNames, sourceSessionId, onSaveToTestownik 
}) => {
  const { t } = useTranslation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  
  const engine = useCreatorEngine(
    initialQuestions, initialBaseName, initialImageNames, sourceSessionId
  );

  const handleExportZip = useCallback(async () => {
    if (engine.questions.length === 0) {
      toast.error(t('creator.noQuestionsToExport'));
      return;
    }

    setIsExportingZip(true);
    try {
      const questions = mapEditingFormatToQuestions(engine.questions);
      const allImages: Record<string, Blob> = { ...engine.images };

      if (engine.sourceSessionId && engine.existingImages.size > 0) {
        try {
          const dbImages = await getAllSessionImages(engine.sourceSessionId);
          for (const imgName of engine.existingImages) {
            if (!allImages[imgName] && dbImages[imgName]) {
              allImages[imgName] = dbImages[imgName];
            }
          }
        } catch (err) {
          console.warn('Nie udało się pobrać niektórych istniejących obrazów:', err);
        }
      }

      const baseName = engine.savePromptName.trim() || 'paczka';
      const zipBlob = await exportQuestionsToZip(baseName, questions, allImages);
      triggerBlobDownload(zipBlob, `${baseName}.zip`);
      toast.success(t('creator.exportZipSuccess'));
    } catch (err) {
      console.error('Błąd eksportu bazy do ZIP:', err);
      toast.error(t('creator.errorCreateZip', { message: (err as Error)?.message || 'Nieznany błąd' }));
    } finally {
      setIsExportingZip(false);
    }
  }, [engine.questions, engine.images, engine.sourceSessionId, engine.existingImages, engine.savePromptName, t]);

  const handleRequestQuit = () => {
    if (engine.questions.length > 0) {
      setShowQuitConfirm(true);
    } else {
      onQuit();
    }
  };

  // Protection against page reload (F5, Cmd+R) / tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Keyboard shortcut listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQuitConfirm) {
          setShowQuitConfirm(false);
          return;
        }
        if (engine.showSavePrompt) {
          engine.setShowSavePrompt(false);
          return;
        }
        if (engine.fullscreenImage) {
          engine.setFullscreenImage(null);
          return;
        }
        if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
          return;
        }
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        handleRequestQuit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQuitConfirm, engine.showSavePrompt, engine.fullscreenImage, isMobileSidebarOpen, engine.questions.length]);

  return (
    <div className="h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      <CreatorHeader 
        onQuit={handleRequestQuit} 
        onSaveClick={() => {
          if (engine.savePromptName.trim()) {
            onSaveToTestownik(engine.questions, engine.savePromptName.trim(), engine.images, Array.from(engine.existingImages), engine.sourceSessionId);
          } else {
            engine.setShowSavePrompt(true);
          }
        }} 
        questionsCount={engine.questions.length}
        baseName={engine.savePromptName}
        setBaseName={engine.setSavePromptName}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        onExportZip={handleExportZip}
        isExportingZip={isExportingZip}
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
          fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-200 ease-out flex flex-col
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
                  onSaveToTestownik(engine.questions, engine.savePromptName.trim(), engine.images, Array.from(engine.existingImages), engine.sourceSessionId);
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
                  onSaveToTestownik(engine.questions, engine.savePromptName.trim(), engine.images, Array.from(engine.existingImages), engine.sourceSessionId);
                  engine.setShowSavePrompt(false);
                }
              }} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                {t('creator.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showQuitConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Czy na pewno chcesz wyjść?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                Niezapisane pytania i wprowadzone zmiany zostaną utracone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  variant="secondary"
                  className="flex-1 order-2 sm:order-1"
                  onClick={() => setShowQuitConfirm(false)}
                  autoFocus
                >
                  Zostań
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 order-1 sm:order-2"
                  onClick={onQuit}
                >
                  Wyjdź bez zapisu
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
