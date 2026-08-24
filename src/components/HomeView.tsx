import { useRef, useState, useEffect, FC, ChangeEvent, DragEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { parseZipFile } from '../utils/parser';
import { buildDemoQuestions } from '../utils/demo';
import { Question, SavedSessionMetadata } from '../models/types';
import { getAllSessionMetadata } from '../utils/session';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SessionsList } from './SessionsList';
import logo from '../assets/logo.png';

interface HomeViewProps {
  onOpenSettings?: () => void;
  activeTab: 'new' | 'saved';
  onTabChange: (tab: 'new' | 'saved') => void;
  onStartSession: (questions: Question[], repeatMode: number, baseName: string, images: Record<string, Blob>) => void;
  onResumeSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onRestartSession: (sessionId: string, newRepeatMode?: number) => void;
  onEnterCreator: () => void;
  onEditInCreator: (sessionId: string) => void;
}



export const HomeView: FC<HomeViewProps> = ({
  onOpenSettings,
  activeTab,
  onTabChange,
  onStartSession,
  onResumeSession,
  onDeleteSession,
  onRenameSession,
  onRestartSession,
  onEnterCreator,
  onEditInCreator,
}) => {
  const { t } = useTranslation();
  const REPEAT_OPTIONS = useMemo(() => [
    {
      value: 1,
      label: t('repeatOptions.opt1Label'),
      description: t('repeatOptions.opt1Desc'),
    },
    {
      value: 2,
      label: t('repeatOptions.opt2Label'),
      description: t('repeatOptions.opt2Desc'),
    },
    {
      value: 3,
      label: t('repeatOptions.opt3Label'),
      description: t('repeatOptions.opt3Desc'),
    },
  ], [t]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [images, setImages] = useState<Record<string, Blob>>({});
  const [repeatMode, setRepeatMode] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [baseName, setBaseName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSessionMetadata[]>([]);

  useEffect(() => {
    if (activeTab === 'saved') {
      getAllSessionMetadata().then(setSavedSessions);
    }
  }, [activeTab]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setLoadError(t('home.errorZipOnly'));
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    setQuestions([]);
    try {
      const parsed = await parseZipFile(file);
      if (parsed.questions.length === 0) {
        setLoadError(t('home.errorEmptyZip'));
      } else {
        setQuestions(parsed.questions);
        setImages(parsed.images);
        const nameWithoutZip = file.name.replace(/\.zip$/i, '');
        setFileName(file.name);
        setBaseName(nameWithoutZip);
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
    const demoQ = buildDemoQuestions();
    setQuestions(demoQ);
    setImages({});
    setFileName('Pytania demonstracyjne');
    setBaseName('Pytania demonstracyjne');
    setLoadError(null);
  };

  const handleDeleteAndRefresh = async (sessionId: string) => {
    await onDeleteSession(sessionId);
    setSavedSessions(await getAllSessionMetadata());
  };

  const canStart = questions.length > 0;

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-start pt-12 md:pt-24 p-6 overflow-y-auto relative">
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

      <div className="w-full max-w-2xl space-y-5">
        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src={logo} 
              alt="Testownik" 
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('home.title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-sm mx-auto">
            {t('home.subtitle')}
          </p>
        </div>

        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 relative">
          <button
            onClick={() => onTabChange('new')}
            className={`relative flex items-center justify-center h-12 px-4 font-medium text-sm transition-colors ${
              activeTab === 'new'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'new' && (
              <motion.div
                layoutId="homeTabIndicator"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-500"
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
              />
            )}
            {t('home.tabs.newTest')}
          </button>
          <button
            onClick={() => onTabChange('saved')}
            className={`relative flex items-center justify-center h-12 px-4 font-medium text-sm transition-colors ${
              activeTab === 'saved'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'saved' && (
              <motion.div
                layoutId="homeTabIndicator"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-500"
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
              />
            )}
            <span>{t('home.tabs.myTests')}</span>
            {savedSessions.length > 0 && (
              <span className="ml-2 flex items-center justify-center px-2 py-0.5 text-[10px] font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                {savedSessions.length}
              </span>
            )}
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onEnterCreator}
            className="relative flex items-center justify-center gap-1.5 h-12 px-4 font-bold text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('home.tabs.creator')}
          </button>
        </div>

        {activeTab === 'new' && (
          <div className="space-y-5">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  {t('home.step1')}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLoadDemo}
                  className="text-zinc-500 dark:text-zinc-400 text-xs"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                  {t('home.useDemo')}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onClick={() => !isLoading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]'
                    : canStart
                    ? 'border-emerald-400 dark:border-emerald-600/70 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                }`}
              >
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z"
                  />
                </svg>

                {isLoading ? (
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t('home.starting')}
                  </p>
                ) : canStart ? (
                  <>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      ✓ {fileName} ({t('home.questionsCount', { count: questions.length })})
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                      {t('home.changeFile')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {t('home.dragDrop')}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {t('home.orClick')}
                    </p>
                  </>
                )}
              </div>

              {loadError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    {loadError}
                  </p>
                </div>
              )}

              {canStart && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('home.step3')}
                  </p>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={baseName}
                        onChange={e => setBaseName(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={e => { if (e.key === 'Enter') setIsEditingName(false); }}
                        autoFocus
                        className="flex-1 px-3 py-1.5 text-sm font-semibold bg-white dark:bg-zinc-800 border-2 border-primary-400 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                        placeholder="Nazwa bazy pytań..."
                      />
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                        {baseName || fileName}
                      </span>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
                        title="Zmień nazwę"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">
                {t('home.step2')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {REPEAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRepeatMode(opt.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer focus:outline-none ${
                      repeatMode === opt.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    {repeatMode === opt.value && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                      {opt.value}×
                    </div>
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      {opt.label}
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Button
              variant="primary"
              size="xl"
              fullWidth
              disabled={!canStart}
              onClick={() => onStartSession(questions, repeatMode, baseName || fileName || 'Baza pytań', images)}
              className="shadow-xl shadow-primary-600/20 text-lg font-bold"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                />
              </svg>
              {canStart
                ? t('home.startTestReady', { count: questions.length })
                : t('home.startTestDisabled')}
            </Button>

            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 pb-4">
              {t('home.autoSaveNotice')}
            </p>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-5">
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
            />
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
              {t('home.savedTestsNotice')}
            </p>

          </div>
        )}
      </div>
    </div>
  );
};
