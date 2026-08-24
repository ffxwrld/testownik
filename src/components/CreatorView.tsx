import { FC, useEffect } from 'react';
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
      />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <CreatorSidebar 
          questions={engine.questions}
          activeId={engine.activeId}
          setActiveId={engine.setActiveId}
          searchQuery={engine.searchQuery}
          setSearchQuery={engine.setSearchQuery}
          handleAddQuestion={engine.handleAddQuestion}
          handleDeleteQuestion={engine.handleDeleteQuestion}
          handleDuplicateQuestion={engine.handleDuplicateQuestion}
        />
        
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
