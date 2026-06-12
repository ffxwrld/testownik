import React, { useRef, useState, useEffect } from 'react';
import { parseZipFile } from '../utils/parser';
import { buildDemoQuestions } from '../utils/demo';
import { Question } from '../models/types';
import { getAllSessionMetadata } from '../utils/session';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SessionsList } from './SessionsList';

interface HomeViewProps {
  onStartSession: (questions: Question[], repeatMode: number, baseName: string) => void;
  onResumeSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onRestartSession: (sessionId: string) => void;
}

const REPEAT_OPTIONS = [
  {
    value: 1,
    label: '1 raz',
    description: 'Każde pytanie zaliczasz po 1 poprawnej odpowiedzi.',
  },
  {
    value: 2,
    label: '2 razy',
    description: 'Każde pytanie wymaga 2 poprawnych odpowiedzi z rzędu.',
  },
  {
    value: 3,
    label: '3 razy',
    description: 'Każde pytanie wymaga 3 poprawnych odpowiedzi z rzędu.',
  },
];

type ViewTab = 'new' | 'saved';

export const HomeView: React.FC<HomeViewProps> = ({
  onStartSession,
  onResumeSession,
  onDeleteSession,
  onRenameSession,
  onRestartSession,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [repeatMode, setRepeatMode] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [baseName, setBaseName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('new');
  const [savedSessions, setSavedSessions] = useState(
    getAllSessionMetadata()
  );

  useEffect(() => {
    if (activeTab === 'saved') {
      setSavedSessions(getAllSessionMetadata());
    }
  }, [activeTab]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setLoadError('Proszę wybrać plik w formacie .zip');
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    setQuestions([]);
    try {
      const parsed = await parseZipFile(file);
      if (parsed.length === 0) {
        setLoadError(
          'Nie znaleziono żadnych pytań w pliku. Upewnij się, że archiwum zawiera pliki .txt w odpowiednim formacie.'
        );
      } else {
        setQuestions(parsed);
        const nameWithoutZip = file.name.replace(/\.zip$/i, '');
        setFileName(file.name);
        setBaseName(nameWithoutZip);
      }
    } catch (err) {
      setLoadError(`Błąd podczas wczytywania pliku: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleLoadDemo = () => {
    const demoQ = buildDemoQuestions();
    setQuestions(demoQ);
    setFileName('Pytania demonstracyjne');
    setBaseName('Pytania demonstracyjne');
    setLoadError(null);
  };

  const handleDeleteAndRefresh = (sessionId: string) => {
    onDeleteSession(sessionId);
    setSavedSessions(getAllSessionMetadata());
  };

  const canStart = questions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
              <svg
                className="w-9 h-9 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Testownik
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-sm mx-auto">
              Aplikacja do nauki i rozwiązywania testów. 
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            + Nowy test
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors relative ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Moje testy
            {savedSessions.length > 0 && (
              <span className="ml-2 inline-block px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                {savedSessions.length}
              </span>
            )}
          </button>
        </div>

        {/* New Test Tab */}
        {activeTab === 'new' && (
          <div className="space-y-5">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  1. Wczytaj bazę pytań
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
                  Użyj pytań demonstracyjnych
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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                    : canStart
                    ? 'border-emerald-400 dark:border-emerald-600/70 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
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
                    Wczytywanie...
                  </p>
                ) : canStart ? (
                  <>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      ✓ {fileName} ({questions.length} pytań)
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                      Kliknij, aby wybrać inny plik
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Przeciągnij plik .zip tutaj
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      lub kliknij, aby wybrać
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
                    Nazwa bazy pytań:
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
                        className="flex-1 px-3 py-1.5 text-sm font-semibold bg-white dark:bg-zinc-800 border-2 border-blue-400 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
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
                2. Tryb powtórek dla błędnych odpowiedzi
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {REPEAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRepeatMode(opt.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer focus:outline-none ${
                      repeatMode === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    {repeatMode === opt.value && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
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
              onClick={() => onStartSession(questions, repeatMode, baseName || fileName || 'Baza pytań')}
              className="shadow-xl shadow-blue-600/20 text-lg font-bold"
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
                ? `Rozpocznij test — ${questions.length} pytań`
                : 'Wczytaj pytania, aby rozpocząć'}
            </Button>

            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 pb-4">
              Postęp jest automatycznie zapisywany — możesz przerwać i
              kontynuować w dowolnym momencie.
            </p>
          </div>
        )}

        {/* Saved Tests Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-5">
            <SessionsList
              sessions={savedSessions}
              onResume={onResumeSession}
              onDelete={handleDeleteAndRefresh}
              onRename={(sessionId, newName) => {
                onRenameSession(sessionId, newName);
                setSavedSessions(getAllSessionMetadata());
              }}
              onRestart={(sessionId) => {
                onRestartSession(sessionId);
              }}
            />
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
              Wznów test lub zacznij od nowa z tą samą bazą pytań.
            </p>

          </div>
        )}
      </div>
    </div>
  );
};
