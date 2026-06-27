import { useState, useRef, useEffect, useMemo, FC, MouseEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { decodeFileContent } from '../utils/parser';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface CreatorViewProps {
  onQuit: () => void;
  initialQuestions?: EditingQuestion[];
  initialBaseName?: string;
  initialImages?: Record<string, Blob>;
  onSaveToTestownik: (questions: EditingQuestion[], baseName: string, images: Record<string, Blob>) => void;
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

export const CreatorView: FC<CreatorViewProps> = ({ onQuit, initialQuestions, initialBaseName, initialImages, onSaveToTestownik }) => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<EditingQuestion[]>(initialQuestions && initialQuestions.length > 0 ? initialQuestions : [{
    id: generateId(),
    filename: t('creator.questionPrefix') + '1',
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
  const [savePromptName, setSavePromptName] = useState(initialBaseName || t('creator.defaultNewName'));
  const [searchQuery, setSearchQuery] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, Blob>>(initialImages || {});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Protection against page reload (F5, Cmd+R) / tab close
  useEffect(() => {

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const activeQuestion = questions.find(q => q.id === activeId) || questions[0];

  const activeImageKey = useMemo(() => {
    if (!activeQuestion) return null;
    
    const regex = /\[img\](.*?)\[\/img\]/i;
    const match = regex.exec(activeQuestion.text || '');
    if (match) {
      const tagFileName = match[1].trim().toLowerCase();
      const foundKey = Object.keys(images).find(k => k.toLowerCase() === tagFileName);
      if (foundKey) return foundKey;
    }

    return Object.keys(images).find(k => {
      const nameWithoutExt = k.replace(/\.[^/.]+$/, "");
      return nameWithoutExt.toLowerCase() === (activeQuestion.filename || '').toLowerCase();
    });
  }, [activeQuestion?.filename, activeQuestion?.text, images]);

  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!activeImageKey || !images[activeImageKey]) {
      setActiveImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(images[activeImageKey]);
    setActiveImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [activeImageKey, images]);

  const handleImageUpload = (file: File) => {
    if (!activeQuestion || !file.type.startsWith('image/')) return;
    
    let newKey = activeImageKey;
    if (!newKey) {
      const ext = file.name.split('.').pop() || 'png';
      newKey = `${activeQuestion.filename}.${ext}`;
    }
    
    setImages(prev => {
      const next = { ...prev };
      if (activeImageKey) delete next[activeImageKey];
      next[newKey] = file;
      return next;
    });

    const imgTag = `[img]${newKey}[/img]`;
    if (!(activeQuestion.text || '').includes(imgTag)) {
      setQuestions(prev => prev.map(q => 
        q.id === activeId 
          ? { ...q, text: (q.text ? q.text + '\n' : '') + imgTag } 
          : q
      ));
    }
  };

  const handleImageDelete = () => {
    if (!activeImageKey || !activeQuestion) return;
    
    setImages(prev => {
      const next = { ...prev };
      delete next[activeImageKey];
      return next;
    });

    const regex = new RegExp(`\\[img\\]${activeImageKey}\\[\\/img\\]\\s*`, 'gi');
    if (regex.test(activeQuestion.text || '')) {
      setQuestions(prev => prev.map(q => 
        q.id === activeId 
          ? { ...q, text: (q.text || '').replace(regex, '').trimEnd() } 
          : q
      ));
    }
  };

  const handleAddQuestion = () => {
    const newQ: EditingQuestion = {
      id: generateId(),
      filename: `${t('creator.questionPrefix')}${questions.length + 1}`,
      text: '',
      category: 'X',
      answers: [
        { id: generateId(), text: '', isCorrect: true },
        { id: generateId(), text: '', isCorrect: false },
      ],
    };
    setQuestions(prev => [...prev, newQ]);
    setActiveId(newQ.id);
  };

  const handleDeleteQuestion = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (questions.length <= 1) return;
    setQuestions(prev => {
      const filtered = prev.filter(q => q.id !== id);
      return filtered;
    });
    if (activeId === id) {
      setQuestions(prev => {
        if (prev.length > 0) setActiveId(prev[0].id);
        return prev;
      });
    }
  };

  const updateActiveQuestion = (updates: Partial<EditingQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === activeId ? { ...q, ...updates } : q));
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

  const handleImportZip = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    
    setIsLoading(true);
    try {
      const zip = new JSZip();
      const loaded = await zip.loadAsync(file);
      const imported: EditingQuestion[] = [];
      
      const txtFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];
      const imgFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];
      loaded.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/')) {
          const lower = relativePath.toLowerCase();
          if (lower.endsWith('.txt')) {
            txtFiles.push({ name: relativePath, file: zipEntry });
          } else if (lower.match(/\.(png|jpe?g|gif)$/i)) {
            imgFiles.push({ name: relativePath, file: zipEntry });
          }
        }
      });
      
      txtFiles.sort((a, b) => a.name.localeCompare(b.name));
      
      const extractedImages: Record<string, Blob> = {};
      await Promise.all(
        imgFiles.map(async ({ name, file }) => {
          try {
            const blob = await file.async('blob');
            const fileName = name.split('/').pop() || name;
            extractedImages[fileName] = blob;
          } catch (err) { console.warn('Failed to extract image:', err); }
        })
      );
      setImages(extractedImages);
      
      for (const { name, file } of txtFiles) {
        const bytes = await file.async('uint8array');
        const content = decodeFileContent(bytes);
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
        alert(t('creator.errorNoQuestions'));
      }
    } catch (err) {
      alert(t('creator.errorReadZip', { message: (err as Error).message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportZip = async () => {
    setIsLoading(true);
    try {
      const zip = new JSZip();
      questions.forEach((q, index) => {
        const binary = q.answers.map(a => a.isCorrect ? '1' : '0').join('');
        const mask = (q.category || 'X') + binary;
        
        const lines = [mask, q.text, ...q.answers.map(a => a.text)];
        const content = lines.join('\n');
        
        let name = q.filename.trim() || `${t('creator.questionPrefix')}${index + 1}`;
        if (!name.toLowerCase().endsWith('.txt')) name += '.txt';
        
        zip.file(name, content);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Testownik_Database.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(t('creator.errorCreateZip', { message: (err as Error).message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button size="sm" variant="ghost" onClick={() => {
              if (window.confirm(t('creator.quitWarning'))) {
                onQuit();
              }
            }} className="text-zinc-500">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              {t('creator.back')}
            </Button>
            <h1 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              {t('creator.title')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleImportZip} />
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              {t('creator.loadZip')}
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowSavePrompt(true)} disabled={isLoading} className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {t('creator.saveToApp')}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportZip} disabled={isLoading}>
              {t('creator.downloadZip')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto flex min-h-0">
        
        <div className="w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
            <Button size="sm" variant="ghost" fullWidth onClick={handleAddQuestion} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 border-dashed">
              {t('creator.addQuestion')}
            </Button>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t('creator.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {questions
              .filter(q => (q.filename || '').toLowerCase().includes(searchQuery.toLowerCase()) || (q.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
              .map((q) => {
              const index = questions.indexOf(q);
              const isActive = q.id === activeId;
              return (
                <div
                  key={q.id}
                  onClick={() => setActiveId(q.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-mono truncate ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {q.filename || `${t('creator.questionPrefix')}${index+1}`}
                    </p>
                    <p className={`text-sm truncate font-medium ${isActive ? 'text-primary-900 dark:text-primary-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {q.text || t('creator.emptyQuestion')}
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

        <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6">
          {activeQuestion ? (
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                    {t('creator.fileNameLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeQuestion.filename}
                      onChange={e => updateActiveQuestion({ filename: e.target.value })}
                      placeholder={t('creator.fileNamePlaceholder')}
                      className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                    />
                    <span className="absolute right-4 top-2.5 text-zinc-400 font-mono text-sm pointer-events-none">.txt</span>
                  </div>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                    {t('creator.categoryLabel')}
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.category}
                    onChange={e => updateActiveQuestion({ category: e.target.value.charAt(0).toUpperCase() || 'X' })}
                    placeholder="X"
                    maxLength={1}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-zinc-900 dark:text-zinc-100 font-mono text-sm text-center uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  {t('creator.questionTextLabel')}
                </label>
                <textarea
                  value={activeQuestion.text}
                  onChange={e => updateActiveQuestion({ text: e.target.value })}
                  placeholder={t('creator.questionTextPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-zinc-900 dark:text-zinc-100 text-lg resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  {t('creator.imageLabel')}
                </label>
                {activeImageUrl ? (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm bg-zinc-50 dark:bg-zinc-900">
                    <img 
                      src={activeImageUrl} 
                      alt="Podgląd" 
                      className="max-h-48 object-contain w-auto cursor-pointer"
                      onClick={() => setFullscreenImage(activeImageUrl)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        onClick={() => setFullscreenImage(activeImageUrl)}
                        className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full shadow-lg transform hover:scale-105 transition-all backdrop-blur-sm"
                        title={t('creator.zoomImage')}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </button>
                      <button
                        onClick={handleImageDelete}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform hover:scale-105 transition-all backdrop-blur-sm"
                        title={t('creator.deleteImage')}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 6l-1.5 14.5a2 2 0 01-2 2H8a2 2 0 01-2-2L4.5 6m15 0H4.5m4.5 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 4v8m4-8v8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary-400 dark:hover:border-primary-600 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <svg className="w-8 h-8 mb-2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p className="text-sm font-medium">{t('creator.uploadClickOrDrag')}</p>
                    <p className="text-xs mt-1 text-zinc-400">{t('creator.uploadFormats')}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    {t('creator.answersLabel')}
                  </label>
                  <span className="text-xs text-zinc-400">
                    {t('creator.answersSub')}
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
                        placeholder={t('creator.answerPlaceholder', { num: idx + 1 })}
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
                    <Button size="sm" variant="ghost" onClick={handleAddAnswer} className="text-primary-600 dark:text-primary-400 font-semibold border border-dashed border-primary-200 dark:border-primary-800/50 w-full bg-primary-50/50 dark:bg-primary-900/10">
                      {t('creator.addAnswerVariant')}
                    </Button>
                  </div>
                </Card>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400">
              {t('creator.selectOrCreate')}
            </div>
          )}
        </div>
      </main>

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            alt={t('creator.previewImage')} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}

      {showSavePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t('creator.saveModalTitle')}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{t('creator.saveModalDesc')}</p>
            <input
              type="text"
              autoFocus
              value={savePromptName}
              onChange={e => setSavePromptName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && savePromptName.trim()) {
                  onSaveToTestownik(questions, savePromptName.trim(), images);
                  setShowSavePrompt(false);
                }
                if (e.key === 'Escape') setShowSavePrompt(false);
              }}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 mb-5"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSavePrompt(false)}>
                {t('creator.cancel')}
              </Button>
              <Button variant="primary" onClick={() => {
                if (savePromptName.trim()) {
                  onSaveToTestownik(questions, savePromptName.trim(), images);
                  setShowSavePrompt(false);
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
