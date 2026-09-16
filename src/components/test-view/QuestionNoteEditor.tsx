import React, { useState, useEffect } from 'react';
import { StickyNote, Check } from 'lucide-react';
import { useQuestionNote } from '../../hooks/useQuestionNote';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  sessionId: string;
  questionId: string;
}

export const QuestionNoteEditor: React.FC<Props> = ({ sessionId, questionId }) => {
  const { note, saveNote, isLoaded } = useQuestionNote(sessionId, questionId);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setDraft(note);
    }
  }, [note, isLoaded]);

  // Ustawienie draftu do zapisu po chwili nieaktywności
  useEffect(() => {
    if (!isOpen || draft === note) return;
    
    const timer = setTimeout(() => {
      saveNote(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);

    return () => clearTimeout(timer);
  }, [draft, note, isOpen, saveNote]);

  const hasNote = note.trim().length > 0;

  if (!isLoaded) return null;

  return (
    <div className="w-full mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
          hasNote 
            ? 'text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400' 
            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
      >
        <StickyNote className="w-4 h-4" />
        {hasNote ? 'Twoja notatka' : 'Dodaj notatkę'}
        {saved && <Check className="w-3 h-3 text-emerald-500" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Wpisz własną notatkę do tego pytania (np. skojarzenie lub wyjaśnienie)..."
                className="w-full min-h-[100px] p-4 text-sm bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-amber-950 dark:text-amber-100 resize-none placeholder:text-amber-700/40 dark:placeholder:text-amber-400/40"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
