import { describe, it, expect } from 'vitest';
import { findShuffledPosition } from './shuffle';

describe('shuffle.ts', () => {
  it('finds correct shuffled position', () => {
    // original: [A, B, C, D]
    // shuffled: [C, A, D, B] => indices: [2, 0, 3, 1]
    const shuffledOrder = [2, 0, 3, 1];
    
    // Where did original index 0 (A) go? It's at shuffled index 1.
    expect(findShuffledPosition(shuffledOrder, 0)).toBe(1);
    
    // Where did original index 1 (B) go? It's at shuffled index 3.
    expect(findShuffledPosition(shuffledOrder, 1)).toBe(3);
    
    // Where did original index 2 (C) go? It's at shuffled index 0.
    expect(findShuffledPosition(shuffledOrder, 2)).toBe(0);
    
    // Where did original index 3 (D) go? It's at shuffled index 2.
    expect(findShuffledPosition(shuffledOrder, 3)).toBe(2);
  });

  it('returns -1 for invalid original index', () => {
    const shuffledOrder = [1, 0];
    expect(findShuffledPosition(shuffledOrder, 5)).toBe(-1);
  });
});
