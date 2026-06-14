import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface CreatorViewProps {
  onQuit: () => void;
  initialQuestions?: EditingQuestion[];
  initialBaseName?: string;
  onSaveToTestownik: (questions: EditingQuestion[], baseName: string) => void;
}

export interface EditingAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface EditingQuestion {
  id: string;
  filename: string;
  text: string;
  answers: EditingAnswer[];
  category: string;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export const CreatorView: React.FC<CreatorViewProps> = ({ onQuit, initialQuestions, initialBaseName, onSaveToTestownik }) => {
  const [questions, setQuestions] = useState<EditingQuestion[]>(initialQuestions && initialQuestions.length > 0 ? initialQuestions : [{
    id: generateId(),
    filename: 'pytanie_1',
    text: '',
    category: 'X',
    answers: [
      { id: generateId(), text: '', isCorrect: true },
      { id: generateId(), text: '', isCorrect: false },
    ],
  }]);
  
  const [activeId, setActiveId] = useState<string>(questions[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptName, setSavePromptName] = useState(initialBaseName || 'Nowa baza z kreatora');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zabezpieczenie przed przeładowaniem strony (F5, Cmd+R) / zamknięciem karty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const activeQuestion = questions.find(q => q.id === activeId) || questions[0];

  // Actions

  const handleAddQuestion = () => {
    const newQ: EditingQuestion = {
      id: generateId(),
      filename: `pytanie_${questions.length + 1}`,
      text: '',
      category: 'X',
      answers: [
        { id: generateId(), text: '', isCorrect: true },
        { id: generateId(), text: '', isCorrect: false },
      ],
    };
    setQuestions([...questions, newQ]);
    setActiveId(newQ.id);
  };

  const handleDeleteQuestion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (questions.length <= 1) return;
    const filtered = questions.filter(q => q.id !== id);
    setQuestions(filtered);
    if (activeId === id) {
      setActiveId(filtered[0].id);
    }
  };

  const updateActiveQuestion = (updates: Partial<EditingQuestion>) => {
    setQuestions(questions.map(q => q.id === activeId ? { ...q, ...updates } : q));
  };

  const handleAddAnswer = () => {
    if (!activeQuestion) return;
    updateActiveQuestion({
      answers: [...activeQuestion.answers, { id: generateId(), text: '', isCorrect: false }]
    });
  };

  const handleDeleteAnswer = (answerId: string) => {
    if (!activeQuestion || activeQuestion.answers.length <= 1) return;
    updateActiveQuestion({
      answers: activeQuestion.answers.filter(a => a.id !== answerId)
    });
  };

  const updateAnswer = (answerId: string, updates: Partial<EditingAnswer>) => {
    if (!activeQuestion) return;
    updateActiveQuestion({
      answers: activeQuestion.answers.map(a => a.id === answerId ? { ...a, ...updates } : a)
    });
  };

  // Import / Export

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    
    setIsLoading(true);
    try {
      const zip = new JSZip();
      const loaded = await zip.loadAsync(file);
      const imported: EditingQuestion[] = [];
      
      const txtFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];
      loaded.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.txt') && !relativePath.startsWith('__MACOSX/')) {
          txtFiles.push({ name: relativePath, file: zipEntry });
        }
      });
      
      txtFiles.sort((a, b) => a.name.localeCompare(b.name));
      
      for (const { name, file } of txtFiles) {
        const content = await file.async('string');
        const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length >= 3) {
          const maskLine = lines[0];
          const questionText = lines[1];
          const answerTexts = lines.slice(2);
          
          const digits = maskLine.replace(/^[^01]*/, '');
          const category = maskLine.substring(0, maskLine.length - digits.length) || 'X';
          
          const answers: EditingAnswer[] = answerTexts.map((text, i) => ({
            id: generateId(),
            text,
            isCorrect: digits[i] === '1'
          }));
          
          imported.push({
            id: generateId(),
            filename: name.replace(/\.txt$/i, ''),
            text: questionText,
            category,
            answers
          });
        }
      }
      
      if (imported.length > 0) {
        setQuestions(imported);
        setActiveId(imported[0].id);
      } else {
        alert('Nie znaleziono prawidłowych pytań w tym archiwum ZIP.');
      }
    } catch (err) {
      alert(`Błąd odczytu ZIP: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportZip = async () => {
    setIsLoading(true);
    try {
      const zip = new JSZip();
      questions.forEach((q, index) => {
        // Construct mask
        const binary = q.answers.map(a => a.isCorrect ? '1' : '0').join('');
        const mask = (q.category || 'X') + binary;
        
        const lines = [mask, q.text, ...q.answers.map(a => a.text)];
        const content = lines.join('\n');
        
        let name = q.filename.trim() || `pytanie_${index + 1}`;
        if (!name.toLowerCase().endsWith('.txt')) name += '.txt';
        
        zip.file(name, content);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Moja_Baza_Pytan.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Błąd tworzenia ZIP: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button size="sm" variant="ghost" onClick={() => {
              if (window.confirm('Czy na pewno chcesz opuścić kreator? Wszelkie niezapisane zmiany zostaną bezpowrotnie utracone.')) {
                onQuit();
              }
            }} className="text-zinc-500">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Powrót
            </Button>
            <h1 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              Kreator Baz Pytań
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleImportZip} />
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              Wczytaj .zip do edycji
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowSavePrompt(true)} disabled={isLoading} className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Zapisz prosto do aplikacji
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportZip} disabled={isLoading}>
              Pobierz .zip
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto flex overflow-hidden h-[calc(100vh-60px)]">
        
        {/* Sidebar: List of questions */}
        <div className="w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
            <Button size="sm" variant="ghost" fullWidth onClick={handleAddQuestion} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 border-dashed">
              + Dodaj kolejne pytanie
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {questions.map((q, index) => {
              const isActive = q.id === activeId;
              return (
                <div
                  key={q.id}
                  onClick={() => setActiveId(q.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-mono truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {q.filename || `pytanie_${index+1}`}
                    </p>
                    <p className={`text-sm truncate font-medium ${isActive ? 'text-blue-900 dark:text-blue-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {q.text || '(Puste pytanie)'}
                    </p>
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteQuestion(e, q.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 6l-1.5 14.5a2 2 0 01-2 2H8a2 2 0 01-2-2L4.5 6m15 0H4.5m4.5 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 4v8m4-8v8" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6">
          {activeQuestion ? (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Filename & Category */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                    Nazwa pliku
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeQuestion.filename}
                      onChange={e => updateActiveQuestion({ filename: e.target.value })}
                      placeholder="np. pytanie_1"
                      className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                    />
                    <span className="absolute right-4 top-2.5 text-zinc-400 font-mono text-sm pointer-events-none">.txt</span>
                  </div>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                    Kategoria
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.category}
                    onChange={e => updateActiveQuestion({ category: e.target.value.charAt(0).toUpperCase() || 'X' })}
                    placeholder="X"
                    maxLength={1}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-900 dark:text-zinc-100 font-mono text-sm text-center uppercase"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Treść pytania
                </label>
                <textarea
                  value={activeQuestion.text}
                  onChange={e => updateActiveQuestion({ text: e.target.value })}
                  placeholder="Wpisz treść pytania..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-900 dark:text-zinc-100 text-lg resize-y"
                />
              </div>

              {/* Answers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Odpowiedzi i klucz
                  </label>
                  <span className="text-xs text-zinc-400">
                    Zaznacz odpowiedź(i) uznawane za poprawne
                  </span>
                </div>
                
                <Card className="p-2 space-y-2">
                  {activeQuestion.answers.map((ans, idx) => (
                    <div key={ans.id} className={`flex items-start gap-3 p-2 rounded-lg border-2 transition-colors ${ans.isCorrect ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                      <button
                        onClick={() => updateAnswer(ans.id, { isCorrect: !ans.isCorrect })}
                        className={`mt-1.5 flex-shrink-0 w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                          ans.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-400 text-transparent'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={ans.text}
                        onChange={e => updateAnswer(ans.id, { text: e.target.value })}
                        placeholder={`Odpowiedź ${idx + 1}`}
                        className="flex-1 bg-transparent border-0 focus:ring-0 px-0 py-1 text-zinc-800 dark:text-zinc-200 font-medium placeholder-zinc-300 dark:placeholder-zinc-700"
                      />
                      <button
                        onClick={() => handleDeleteAnswer(ans.id)}
                        disabled={activeQuestion.answers.length <= 1}
                        className="mt-1 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <div className="pt-2 px-2 pb-1">
                    <Button size="sm" variant="ghost" onClick={handleAddAnswer} className="text-blue-600 dark:text-blue-400 font-semibold border border-dashed border-blue-200 dark:border-blue-800/50 w-full bg-blue-50/50 dark:bg-blue-900/10">
                      + Dodaj wariant odpowiedzi
                    </Button>
                  </div>
                </Card>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400">
              Wybierz pytanie z listy lub stwórz nowe.
            </div>
          )}
        </div>
      </main>

      {/* Save Prompt Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Zapisz do Testownika</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Podaj nazwę, pod którą chcesz zapisać tę bazę pytań w swoich testach.</p>
            <input
              type="text"
              autoFocus
              value={savePromptName}
              onChange={e => setSavePromptName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && savePromptName.trim()) {
                  onSaveToTestownik(questions, savePromptName.trim());
                  setShowSavePrompt(false);
                }
                if (e.key === 'Escape') setShowSavePrompt(false);
              }}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 mb-5"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSavePrompt(false)}>
                Anuluj
              </Button>
              <Button variant="primary" onClick={() => {
                if (savePromptName.trim()) {
                  onSaveToTestownik(questions, savePromptName.trim());
                  setShowSavePrompt(false);
                }
              }} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                Zapisz
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
