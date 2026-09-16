import { describe, it, expect } from 'vitest';
import { findShuffledPosition } from './shuffle';
import { Question } from '../models/types';

describe('answer resolution and shuffled mapping', () => {
  const sampleQuestion: Question = {
    id: 'q-1',
    sourceFile: 'test.txt',
    text: 'Która odpowiedź jest poprawna?',
    answers: [
      { id: 'ans-0', text: 'Niepoprawna A', isCorrect: false },
      { id: 'ans-1', text: 'Poprawna B', isCorrect: true },
      { id: 'ans-2', text: 'Niepoprawna C', isCorrect: false },
      { id: 'ans-3', text: 'Niepoprawna D', isCorrect: false },
    ],
    correctAnswerIndex: 1,
    correctAnswerIndices: [1],
  };

  it('correctly maps the correct answer position when shuffledOrder places it first', () => {
    // Shuffled order: answer 1 is at screen index 0
    const shuffledOrder = [1, 3, 0, 2];

    const correctOriginalIndices = sampleQuestion.correctAnswerIndices;
    const correctShuffledIndices = correctOriginalIndices.map(origIdx =>
      findShuffledPosition(shuffledOrder, origIdx)
    );

    // Screen index 0 should be marked as correct
    expect(correctShuffledIndices).toEqual([0]);

    // If user selects screen index 0, it matches!
    const userSelection = [0];
    const isCorrect = userSelection.every(si => correctShuffledIndices.includes(si)) &&
                      correctShuffledIndices.every(ci => userSelection.includes(ci));
    expect(isCorrect).toBe(true);

    // If user selects screen index 1 (which corresponds to original answer 3), it is wrong!
    const wrongSelection = [1];
    const isWrong = wrongSelection.every(si => correctShuffledIndices.includes(si)) &&
                    correctShuffledIndices.every(ci => wrongSelection.includes(ci));
    expect(isWrong).toBe(false);
  });

  it('correctly maps the correct answer position when shuffledOrder places it last', () => {
    // Shuffled order: answer 1 is at screen index 3
    const shuffledOrder = [0, 2, 3, 1];

    const correctOriginalIndices = sampleQuestion.correctAnswerIndices;
    const correctShuffledIndices = correctOriginalIndices.map(origIdx =>
      findShuffledPosition(shuffledOrder, origIdx)
    );

    // Screen index 3 should be marked as correct
    expect(correctShuffledIndices).toEqual([3]);

    const userSelection = [3];
    const isCorrect = userSelection.every(si => correctShuffledIndices.includes(si)) &&
                      correctShuffledIndices.every(ci => userSelection.includes(ci));
    expect(isCorrect).toBe(true);
  });

  it('correctly handles multi-choice questions with multiple correct answers', () => {
    const multiQuestion: Question = {
      id: 'q-multi',
      sourceFile: 'multi.txt',
      text: 'Wybierz poprawne:',
      answers: [
        { id: 'ans-0', text: 'Poprawna 0', isCorrect: true },
        { id: 'ans-1', text: 'Zła 1', isCorrect: false },
        { id: 'ans-2', text: 'Poprawna 2', isCorrect: true },
      ],
      correctAnswerIndices: [0, 2],
    };

    // Shuffled order: original 2 is at index 0, original 1 is at index 1, original 0 is at index 2
    const shuffledOrder = [2, 1, 0];

    const correctOriginalIndices = multiQuestion.correctAnswerIndices;
    const correctShuffledIndices = correctOriginalIndices.map(origIdx =>
      findShuffledPosition(shuffledOrder, origIdx)
    );

    // Original 0 is at screen index 2, Original 2 is at screen index 0
    expect(correctShuffledIndices).toEqual([2, 0]);

    // User selects both screen 0 and screen 2
    const userSelection = [0, 2];
    const isCorrect = userSelection.every(si => correctShuffledIndices.includes(si)) &&
                      correctShuffledIndices.every(ci => userSelection.includes(ci));
    expect(isCorrect).toBe(true);

    // Partial selection (only screen 0) is wrong
    const partialSelection = [0];
    const isPartialCorrect = partialSelection.every(si => correctShuffledIndices.includes(si)) &&
                             correctShuffledIndices.every(ci => partialSelection.includes(ci));
    expect(isPartialCorrect).toBe(false);
  });
});
