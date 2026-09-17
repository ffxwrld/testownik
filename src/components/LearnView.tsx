import { useRef, useState, useEffect, FC, ChangeEvent, DragEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { parseZipFile } from '../utils/parser';
import { buildDemoQuestions } from '../utils/demo';
import { Question, SavedSessionMetadata } from '../models/types';
import { getAllSessionMetadata, loadSession, saveSession } from '../utils/session';
import { format } from 'date-fns';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { PenTool, UploadCloud, Layers, BookOpen, ArrowDownToLine } from 'lucide-react';
import { toast } from 'sonner';
import { SessionsList } from './SessionsList';
import { ImportModal } from './common/ImportModal';
import { PageHeader } from './common/PageHeader';
import { ShareModal } from './share/ShareModal';
import { ReceiveModal } from './share/ReceiveModal';
import { cn } from '../utils/cn';

interface LearnViewProps {
  activeTab?: 'new' | 'saved';
  onTabChange?: (tab: 'new' | 'saved') => void;
  onStartSession: (questions: Question[], repeatMode: number, baseName: string, images: Record<string, Blob>, targetDate?: string) => void;
  onResumeSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void | Promise<void>;
  onRestartSession: (sessionId: string, newRepeatMode?: number) => void;
  onEnterCreator: () => void;
  onEditInCreator: (sessionId: string) => void;
  onFlashcards: (sessionId: string) => void;
}

export const LearnView: FC<LearnViewProps> = ({
  onStartSession,
  onResumeSession,
  onDeleteSession,
  onRenameSession,
  onRestartSession,
  onEnterCreator,
  onEditInCreator,
  onFlashcards
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [images, setImages] = useState<Record<string, Blob>>({});
  const [repeatMode, setRepeatMode] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [baseName, setBaseName] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSessionMetadata[]>([]);
  
  // State for the configuration modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sharingSession, setSharingSession] = useState<SavedSessionMetadata | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  useEffect(() => {
    getAllSessionMetadata().then(setSavedSessions);
  }, []);

  const REPEAT_OPTIONS = useMemo(() => [
    { value: 1, label: t('repeatOptions.opt1Label', 'Szybka powtórka'), description: t('repeatOptions.opt1Desc', 'Każde pytanie pojawia się 1 raz. Idealne na szybkie odświeżenie przed kolokwium.') },
    { value: 2, label: t('repeatOptions.opt2Label', 'Solidna nauka'), description: t('repeatOptions.opt2Desc', 'Pytania wracają 2 razy. Dobry kompromis między czasem a utrwalaniem.') },
    { value: 3, label: t('repeatOptions.opt3Label', 'Głębokie zapamiętanie'), description: t('repeatOptions.opt3Desc', 'Algorytm powtarza trudne pytania 3 razy. Maksymalna retencja wiedzy.') },
  ], [t]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setLoadError(t('home.errorZipOnly', 'Możesz załadować tylko pliki .zip'));
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    setQuestions([]);
    try {
      const parsed = await parseZipFile(file);
      if (parsed.questions.length === 0) {
        setLoadError(t('home.errorEmptyZip', 'Plik zip nie zawiera żadnych pytań.'));
      } else {
        setQuestions(parsed.questions);
        setImages(parsed.images);
        const nameWithoutZip = file.name.replace(/\.zip$/i, '');
        setFileName(file.name);
        setBaseName(nameWithoutZip);
        setTargetDate('');
        setShowConfigModal(true); // Otwieramy modal po załadowaniu
      }
    } catch (err) {
      setLoadError(t('home.errorLoad', { message: (err as Error).message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleLoadDemo = () => {
    const demoQuestions = buildDemoQuestions();
    setQuestions(demoQuestions);
    setImages({});
    setFileName('pytania_demonstracyjne.zip');
    setBaseName('Pytania demonstracyjne');
    setTargetDate('');
    setShowConfigModal(true);
  };

  const handleDeleteAndRefresh = async (sessionId: string) => {
    await onDeleteSession(sessionId);
    setSavedSessions(await getAllSessionMetadata());
  };
  
  const handleStart = () => {
    setShowConfigModal(false);
    onStartSession(questions, repeatMode, baseName || fileName || 'Baza pytań', images, targetDate || undefined);
  };

  const [showImportModal, setShowImportModal] = useState(false);
  const [learningMode, setLearningMode] = useState<'test' | 'flashcards'>('test');

  const PrependCards = (
    <>
      {learningMode === 'flashcards' && (
        <button 
          type="button"
          onClick={() => setShowImportModal(true)}
          className="w-full h-[152px] border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2.5 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
            {t('learn.createFlashcards')}
          </span>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
            {t('learn.createFlashcardsSub')}
          </p>
        </button>
      )}

      {learningMode === 'test' && (
        <div className="w-full h-[152px] flex gap-2.5 sm:gap-3 relative">
          {/* Kafelek 1: Importuj z dysku */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex-1 h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group/left relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] p-3",
              isDragging
                ? "border-primary-500 bg-primary-500/20"
                : "border-primary-500/40 hover:border-primary-500 bg-primary-500/5 hover:bg-primary-500/10"
            )}
          >
            <div className="w-11 h-11 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-2.5 group-hover/left:scale-105 transition-transform">
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>
            <span className="font-bold text-primary-700 dark:text-primary-300 text-sm">
              {t('learn.importDisk')}
            </span>
            <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1 text-center line-clamp-1">
              {t('learn.importDiskSub')}
            </p>
          </button>

          {/* Kafelek 2: Odbierz kodem */}
          <button
            type="button"
            onClick={() => setShowReceiveModal(true)}
            className="w-16 sm:w-20 h-full border-2 border-dashed border-primary-500/40 hover:border-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group/right active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 py-3 px-1.5 text-primary-600 dark:text-primary-400 shrink-0"
            title={t('learn.receiveWithCode', 'Odbierz kodem')}
          >
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center group-hover/right:scale-105 transition-transform shrink-0">
              <ArrowDownToLine className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex flex-col items-center text-center select-none leading-none gap-0.5">
              <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-primary-700 dark:text-primary-300 group-hover/right:text-primary-800 dark:group-hover/right:text-primary-200 transition-colors">
                {t('learn.receiveWord', 'Odbierz')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-primary-600/80 dark:text-primary-400/80 group-hover/right:text-primary-700 dark:group-hover/right:text-primary-300 transition-colors">
                {t('learn.codeWord', 'kodem')}
              </span>
            </div>
          </button>

          {loadError && (
            <div className="absolute -bottom-10 left-0 right-0 text-center text-xs text-red-500 font-semibold bg-red-100 dark:bg-red-900/40 py-1 rounded-xl">
              {loadError}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div 
      className="relative w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-primary-500/10 backdrop-blur-sm border-4 border-dashed border-primary-500 rounded-3xl m-4 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {t('learn.dragDropTitle')}
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32 md:pb-12">
        
        <PageHeader
          icon={<BookOpen />}
          title={t('learn.title')}
          subtitle={
            <span>
              {t('learn.subtitle')}{' '}
              <button 
                type="button" 
                onClick={handleLoadDemo} 
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline inline-flex items-center"
              >
                {t('learn.loadDemo')}
              </button>
            </span>
          }
        >
          <div className="flex p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50">
            <button
              type="button"
              onClick={() => setLearningMode('test')}
              className={cn(
                "relative px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 active:scale-[0.98]",
                learningMode === 'test'
                  ? "text-zinc-900 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {learningMode === 'test' && (
                <motion.div
                  layoutId="learn-mode-pill"
                  className="absolute inset-0 bg-white dark:bg-zinc-700/90 rounded-xl shadow-xs -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span>{t('learn.tabTest')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLearningMode('flashcards')}
              className={cn(
                "relative px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 active:scale-[0.98]",
                learningMode === 'flashcards'
                  ? "text-zinc-900 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {learningMode === 'flashcards' && (
                <motion.div
                  layoutId="learn-mode-pill"
                  className="absolute inset-0 bg-white dark:bg-zinc-700/90 rounded-xl shadow-xs -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span>{t('learn.tabFlashcards')}</span>
            </button>
          </div>
          
          <button
            type="button"
            onClick={onEnterCreator}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <PenTool className="w-4 h-4" />
            <span>{t('creator.title', 'Kreator')}</span>
          </button>
        </PageHeader>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip"
          className="hidden"
        />

        <SessionsList
          mode={learningMode}
          sessions={savedSessions}
          onResume={onResumeSession}
          onDelete={handleDeleteAndRefresh}
          onRename={async (sessionId, newName) => {
            await onRenameSession(sessionId, newName);
            setSavedSessions(await getAllSessionMetadata());
          }}
          onRestart={(sessionId, config) => {
            onRestartSession(sessionId, config);
          }}
          onEditInCreator={onEditInCreator}
          onFlashcards={onFlashcards}
          onShareCode={setSharingSession}
          onUpdateTargetDate={async (sessionId, newDate) => {
            const loaded = await loadSession(sessionId);
            if (loaded) {
              loaded.targetDate = newDate;
              await saveSession(loaded, sessionId);
              setSavedSessions(await getAllSessionMetadata());
            }
          }}
          prependItem={PrependCards}
        />

      </div>

      {/* Config Modal for New Test */}
      {showConfigModal && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="bg-white dark:bg-[#0f0f13] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-6 md:p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowConfigModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">{questions.length} pytań załadowano</span>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">Skonfiguruj nową sesję</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('learn.newSessionModal.sessionName')}</label>
                  <input
                    type="text"
                    value={baseName}
                    onChange={e => setBaseName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                    placeholder={t('learn.newSessionModal.sessionNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('learn.newSessionModal.targetDate')}</label>
                  <DatePicker
                    value={targetDate}
                    onChange={setTargetDate}
                    minDate={format(new Date(), 'yyyy-MM-dd')}
                    placeholder={t('learn.newSessionModal.targetDate')}
                    size="md"
                    allowClear
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{t('learn.newSessionModal.repeatMode')}</label>
                  <div className="space-y-3">
                    {REPEAT_OPTIONS.map((opt) => (
                      <button type="button"
                        key={opt.value}
                        onClick={() => setRepeatMode(opt.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition cursor-pointer flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                          repeatMode === opt.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-transparent'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${repeatMode === opt.value ? 'border-primary-500' : 'border-zinc-400 dark:border-zinc-600'}`}>
                           {repeatMode === opt.value && <div className="w-3 h-3 bg-primary-500 rounded-full" />}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{opt.label} ({opt.value}x)</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{opt.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="xl"
                  fullWidth
                  onClick={handleStart}
                  className="shadow-xl shadow-primary-600/20 mt-4"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  {t('learn.newSessionModal.startBtn')}
                </Button>
              </div>

            </motion.div>
          </motion.div>
        </AnimatePresence>
      , document.body)}

      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={(questions, name, images) => {
          setQuestions(questions);
          setBaseName(name);
          setImages(images || {});
          setShowConfigModal(true);
        }}
      />

      {sharingSession && createPortal(
        <ShareModal 
          session={sharingSession} 
          onClose={() => setSharingSession(null)} 
        />,
        document.body
      )}

      {showReceiveModal && createPortal(
        <ReceiveModal 
          onClose={() => setShowReceiveModal(false)}
          onSuccess={async (newSession) => {
            setShowReceiveModal(false);
            const fresh = await getAllSessionMetadata();
            setSavedSessions(fresh);
            toast.success(t('receive.successToast', { name: newSession.baseName }));
          }}
        />,
        document.body
      )}
    </div>
  );
};
