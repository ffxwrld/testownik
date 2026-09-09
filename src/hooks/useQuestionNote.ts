import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

const NOTES_STORE_KEY = 'testownik_question_notes_v1';

// Format klucza to: sessionId___questionId
export function useQuestionNote(sessionId: string, questionId: string) {
  const [note, setNote] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  const key = `${sessionId}___${questionId}`;

  useEffect(() => {
    let isMounted = true;
    get<Record<string, string>>(NOTES_STORE_KEY).then((notes) => {
      if (isMounted) {
        if (notes && notes[key]) {
          setNote(notes[key]);
        }
        setIsLoaded(true);
      }
    }).catch(err => {
      console.warn('Failed to load notes', err);
      if (isMounted) setIsLoaded(true);
    });

    return () => { isMounted = false; };
  }, [key]);

  const saveNote = useCallback(async (newNote: string) => {
    setNote(newNote);
    try {
      const notes = (await get<Record<string, string>>(NOTES_STORE_KEY)) || {};
      notes[key] = newNote;
      await set(NOTES_STORE_KEY, notes);
    } catch (err) {
      console.warn('Failed to save note', err);
    }
  }, [key]);

  return { note, saveNote, isLoaded };
}
