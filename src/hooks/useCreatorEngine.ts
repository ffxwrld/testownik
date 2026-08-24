import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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

export function useCreatorEngine(
  initialQuestions?: EditingQuestion[],
  initialBaseName?: string,
  initialImages?: Record<string, Blob>,
  
) {
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
      updateActiveQuestion({ text: (activeQuestion.text ? activeQuestion.text + '\n' : '') + imgTag });
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
      updateActiveQuestion({ text: (activeQuestion.text || '').replace(regex, '').trimEnd() });
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

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) return;
    
    // Find index to select previous/next question automatically
    const idx = questions.findIndex(q => q.id === id);
    setQuestions(prev => prev.filter(q => q.id !== id));
    
    if (activeId === id) {
      setQuestions(prev => {
        if (prev.length > 0) {
          const nextIdx = Math.min(idx, prev.length - 1);
          setActiveId(prev[nextIdx].id);
        }
        return prev;
      });
    }
  };

  const handleDuplicateQuestion = (id: string) => {
    const q = questions.find(x => x.id === id);
    if (!q) return;
    const newQ = {
      ...q,
      id: generateId(),
      filename: `${q.filename}_kopia`,
      answers: q.answers.map(a => ({ ...a, id: generateId() }))
    };
    setQuestions(prev => {
      const idx = prev.findIndex(x => x.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, newQ);
      return next;
    });
    setActiveId(newQ.id);
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
  
  // KEYBOARD SHORTCUTS (The Keyboard Ninja)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSavePrompt || fullscreenImage) return; // Don't trigger if modals are open
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + S -> Save
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowSavePrompt(true);
        return;
      }
      
      // Cmd/Ctrl + Enter -> Add Question (or Save if in a specific flow)
      if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleAddQuestion();
        return;
      }
      
      // Cmd/Ctrl + D -> Duplicate Active
      if (cmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateQuestion(activeId);
        return;
      }
      
      // If NOT in input/textarea, allow Up/Down navigation
      const activeTag = document.activeElement?.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';
      
      if (!isInput && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const filteredList = questions.filter(q => 
          q.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const idx = filteredList.findIndex(q => q.id === activeId);
        if (idx === -1) return;
        
        if (e.key === 'ArrowUp' && idx > 0) {
          setActiveId(filteredList[idx - 1].id);
        } else if (e.key === 'ArrowDown' && idx < filteredList.length - 1) {
          setActiveId(filteredList[idx + 1].id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSavePrompt, fullscreenImage, questions, activeId, searchQuery]);

  return {
    questions, setQuestions,
    activeId, setActiveId,
    activeQuestion, updateActiveQuestion,
    isLoading, setIsLoading,
    showSavePrompt, setShowSavePrompt,
    savePromptName, setSavePromptName,
    searchQuery, setSearchQuery,
    fullscreenImage, setFullscreenImage,
    images, setImages,
    activeImageKey, activeImageUrl,
    handleImageUpload, handleImageDelete,
    handleAddQuestion, handleDeleteQuestion, handleDuplicateQuestion,
    handleAddAnswer, handleDeleteAnswer, updateAnswer
  };
}
