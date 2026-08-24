import { describe, it, expect } from 'vitest';
import { decodeMask, parseQuestionFile } from './parser';

describe('parser.ts', () => {
  describe('decodeMask', () => {
    it('should correctly parse standard mask', () => {
      const res = decodeMask('X0100');
      expect(res.indices).toEqual([1]);
      expect(res.digits).toBe('0100');
    });

    it('should correctly parse multi-answer mask', () => {
      const res = decodeMask('X1010');
      expect(res.indices).toEqual([0, 2]);
      expect(res.digits).toBe('1010');
    });

    it('should throw if no binary digits found', () => {
      expect(() => decodeMask('XABC')).toThrow('Invalid mask format');
    });

    it('should throw if no correct answer found', () => {
      expect(() => decodeMask('X0000')).toThrow("No '1' found in mask");
    });

    it('should extract binary block even if trailing garbage exists', () => {
      const res = decodeMask('X0100garbage');
      expect(res.indices).toEqual([1]);
      expect(res.digits).toBe('0100');
    });
  });

  describe('parseQuestionFile', () => {
    it('should parse standard 4-answer file', () => {
      const content = `X0100
Pytanie testowe
Odp 1
Odp 2
Odp 3
Odp 4`;
      const q = parseQuestionFile(content, 'test.txt');
      expect(q).not.toBeNull();
      expect(q?.text).toBe('Pytanie testowe');
      expect(q?.answers.length).toBe(4);
      expect(q?.answers[1].isCorrect).toBe(true);
      expect(q?.answers[0].isCorrect).toBe(false);
    });

    it('should correctly merge multiline question text', () => {
      const content = `X0100
Pytanie testowe
Linia 2 pytania
Linia 3 pytania
Odp 1
Odp 2
Odp 3
Odp 4`;
      const q = parseQuestionFile(content, 'test.txt');
      expect(q).not.toBeNull();
      expect(q?.text).toBe('Pytanie testowe\nLinia 2 pytania\nLinia 3 pytania');
      expect(q?.answers.length).toBe(4);
      expect(q?.answers[1].isCorrect).toBe(true);
    });

    it('should return null (skip) if answers are missing', () => {
      const content = `X0100
Pytanie testowe
Odp 1
Odp 2`;
      const q = parseQuestionFile(content, 'test.txt');
      expect(q).toBeNull();
    });

    it('should return null (skip) if correct index is out of bounds', () => {
      // 0001 means 4 answers, but what if there's only 3? 
      // Our previous test covers missing answers via diff < 0.
      // But what if mask is 001 and there are 3 answers, but index is 2? (Valid).
      // What if mask is 00001, but the user provides 5 answers, making it valid?
      const content = `X00001
Pytanie testowe
Odp 1
Odp 2
Odp 3
Odp 4
Odp 5`;
      const q = parseQuestionFile(content, 'test.txt');
      expect(q).not.toBeNull();
      expect(q?.answers[4].isCorrect).toBe(true);
    });
  });
});
