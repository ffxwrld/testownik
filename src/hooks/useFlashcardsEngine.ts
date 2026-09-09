import { useState, useCallback } from 'react';
import { Question, SessionState } from '../models/types';
import { shuffle } from '../utils/shuffle';

export interface FlashcardsState {
  questions: Question[];
  currentIndex: number;
  masteredIds: Set<string>;
  reviewIds: Set<string>;
  isFinished: boolean;
}

export function useFlashcardsEngine(initialSession: SessionState) {
  const [state, setState] = useState<FlashcardsState>(() => {
    // Start with all questions, possibly shuffled
    const questions = shuffle([...initialSession.questions]);
    return {
      questions,
      currentIndex: 0,
      masteredIds: new Set(),
      reviewIds: new Set(),
      isFinished: false,
    };
  });

  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const markKnown = useCallback(() => {
    setState(prev => {
      const currentQ = prev.questions[prev.currentIndex];
      const newMastered = new Set(prev.masteredIds).add(currentQ.id);
      
      const nextIndex = prev.currentIndex + 1;
      return {
        ...prev,
        masteredIds: newMastered,
        currentIndex: nextIndex,
        isFinished: nextIndex >= prev.questions.length
      };
    });
    setIsFlipped(false);
  }, []);

  const markRepeat = useCallback(() => {
    setState(prev => {
      const currentQ = prev.questions[prev.currentIndex];
      const newReview = new Set(prev.reviewIds).add(currentQ.id);
      
      // Move this question to the end of the queue
      const newQuestions = [...prev.questions];
      newQuestions.push(newQuestions[prev.currentIndex]); // duplicate at end
      
      const nextIndex = prev.currentIndex + 1;
      
      return {
        ...prev,
        questions: newQuestions,
        reviewIds: newReview,
        currentIndex: nextIndex,
        isFinished: false // never finished if we repeat
      };
    });
    setIsFlipped(false);
  }, []);

  const currentQuestion = state.questions[state.currentIndex];

  return {
    state,
    currentQuestion,
    isFlipped,
    flipCard,
    markKnown,
    markRepeat,
    restart: () => {
      setState({
        questions: shuffle([...initialSession.questions]),
        currentIndex: 0,
        masteredIds: new Set(),
        reviewIds: new Set(),
        isFinished: false,
      });
      setIsFlipped(false);
    },
    totalUnique: initialSession.questions.length
  };
}
