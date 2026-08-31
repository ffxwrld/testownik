import { useRef, useState, useEffect, FC, ChangeEvent, DragEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { parseZipFile } from '../utils/parser';
import { buildDemoQuestions } from '../utils/demo';
import { Question, SavedSessionMetadata } from '../models/types';
import { getAllSessionMetadata } from '../utils/session';
import { Button } from './ui/Button';
import { SessionsList } from './SessionsList';

interface LearnViewProps {
  onOpenSettings?: () => void;
  activeTab?: 'new' | 'saved';
  onTabChange?: (tab: 'new' | 'saved') => void;
  onStartSession: (questions: Question[], repeatMode: number, baseName: string, images: Record<string, Blob>) => void;
  onResumeSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onRestartSession: (sessionId: string, newRepeatMode?: number) => void;
  onEnterCreator: () => void;
  onEditInCreator: (sessionId: string) => void;
}

export const LearnView: FC<LearnViewProps> = ({
  onOpenSettings,
  onStartSession,
  onResumeSession,
  onDeleteSession,
  onRenameSession,
  onRestartSession,
  onEditInCreator,
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
  const [isDragging, setIsDragging] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSessionMetadata[]>([]);
  
  // State for the configuration modal
  const [showConfigModal, setShowConfigModal] = useState(false);

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
    setShowConfigModal(true);
  };

  const handleDeleteAndRefresh = async (sessionId: string) => {
    await onDeleteSession(sessionId);
    setSavedSessions(await getAllSessionMetadata());
  };
  
  const handleStart = () => {
    setShowConfigModal(false);
    onStartSession(questions, repeatMode, baseName || fileName || 'Baza pytań', images);
  };

  const CreateCard = (
    <button 
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className={`w-full h-[148px] border-2 border-dashed ${isDragging ? 'border-primary-500 bg-primary-500/20' : 'border-primary-500/50 bg-primary-500/10'} rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary-500/20 transition-colors group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
    >
      <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl mb-3 group-hover:scale-110 transition-transform">
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : '+'}
      </div>
      <span className="font-bold text-primary-700 dark:text-primary-400 text-sm">
        {t('home.createNew', 'Utwórz nową paczkę')}
      </span>
      <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1">
        {t('home.dragOrClick', 'Przeciągnij plik .zip')}
      </p>
      {loadError && (
        <div className="absolute -bottom-10 left-0 right-0 text-center text-xs text-red-500 font-semibold bg-red-100 dark:bg-red-900/40 py-1 rounded">
          {loadError}
        </div>
      )}
    </button>
  );

  return (
    <div 
      className="flex-1 bg-transparent flex flex-col items-center justify-start pt-12 md:pt-16 p-6 overflow-y-auto relative h-full w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Mobile Settings Button */}
      <button 
        onClick={onOpenSettings}
        className="md:hidden absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-full shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-primary-500/10 backdrop-blur-[2px] border-4 border-dashed border-primary-500 m-4 rounded-3xl flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Upuść plik .zip z testem tutaj
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl space-y-6 pb-24">
        
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Twoje materiały do nauki</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Wybierz test do rozwiązania lub dodaj nowy. <button onClick={handleLoadDemo} className="text-primary-500 hover:underline">Załaduj demo</button></p>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip"
          className="hidden"
        />

        <SessionsList
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
          prependItem={CreateCard}
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
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Nazwa sesji</label>
                  <input
                    type="text"
                    value={baseName}
                    onChange={e => setBaseName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                    placeholder="Wpisz nazwę..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Tryb powtórek</label>
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
                  Rozpocznij naukę
                </Button>
              </div>

            </motion.div>
          </motion.div>
        </AnimatePresence>
      , document.body)}

    </div>
  );
};
