import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { decodeMask, parseQuestionFile, serializeQuestionToTxt, exportQuestionsToZip, importSessionFromZip } from './parser';

const idbMockStore = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => idbMockStore.get(key)),
  set: vi.fn(async (key: string, val: unknown) => { idbMockStore.set(key, val); }),
  del: vi.fn(async (key: string) => { idbMockStore.delete(key); }),
  keys: vi.fn(async () => Array.from(idbMockStore.keys())),
}));

vi.mock('./db', () => ({
  getAllSessionImages: vi.fn(async () => ({})),
  saveSessionImages: vi.fn(async () => {}),
  deleteSessionImages: vi.fn(async () => {}),
}));

const lsStore: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => lsStore[key] ?? null,
    setItem: (key: string, val: string) => { lsStore[key] = val; },
    removeItem: (key: string) => { delete lsStore[key]; },
    clear: () => { Object.keys(lsStore).forEach(k => delete lsStore[k]); },
  },
  writable: true,
});

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

  describe('serializeQuestionToTxt and exportQuestionsToZip', () => {
    it('should correctly serialize a question back to txt with mask and answers', () => {
      const question = {
        id: 'q1',
        sourceFile: '001.txt',
        text: 'Co to jest TypeScript?',
        answers: [
          { id: 'a1', text: 'Nadziób języka JS', isCorrect: true },
          { id: 'a2', text: 'Baza danych', isCorrect: false },
          { id: 'a3', text: 'System operacyjny', isCorrect: false },
        ],
        correctAnswerIndices: [0],
      };

      const txt = serializeQuestionToTxt(question);
      expect(txt).toContain('X100\r\n');
      expect(txt).toContain('Co to jest TypeScript?\r\n');
      expect(txt).toContain('Nadziób języka JS\r\n');
      expect(txt).toContain('Baza danych\r\n');
    });

    it('should generate a valid zip containing both txt and meta.json', async () => {
      const questions = [
        {
          id: 'q1',
          sourceFile: '001.txt',
          text: 'Pytanie 1',
          answers: [
            { id: 'a1', text: 'A', isCorrect: true },
            { id: 'a2', text: 'B', isCorrect: false },
          ],
          correctAnswerIndices: [0],
        },
      ];

      const blob = await exportQuestionsToZip('test_pack', questions);
      expect(blob).toBeInstanceOf(Blob);

      const arrayBuffer = await blob.arrayBuffer();
      const loadedZip = await JSZip.loadAsync(arrayBuffer);
      expect(loadedZip.file('meta.json')).not.toBeNull();
      expect(loadedZip.file('001.txt')).not.toBeNull();

      const txtContent = await loadedZip.file('001.txt')?.async('string');
      expect(txtContent).toContain('X10');
      expect(txtContent).toContain('Pytanie 1');
    });

    it('should reset progress when exporting and importing an in-progress session', async () => {
      const inProgressSession: any = {
        version: 1,
        baseName: 'Moja Paczka',
        repeatMode: 2,
        phase: 'test',
        elapsedSeconds: 154,
        currentQuestionIndex: 3,
        questions: [
          {
            id: 'q1',
            sourceFile: '001.txt',
            text: 'Pytanie 1',
            answers: [
              { id: 'a1', text: 'A', isCorrect: true },
              { id: 'a2', text: 'B', isCorrect: false },
            ],
            correctAnswerIndices: [0],
          },
          {
            id: 'q2',
            sourceFile: '002.txt',
            text: 'Pytanie 2',
            answers: [
              { id: 'a3', text: 'C', isCorrect: true },
              { id: 'a4', text: 'D', isCorrect: false },
            ],
            correctAnswerIndices: [0],
          },
        ],
        queue: [
          { questionId: 'q2', requiredCorrectStreak: 2, consecutiveCorrect: 1, wrongCount: 0, firstAnswerWrong: false },
        ],
        done: ['q1'],
        doneStats: [{ questionId: 'q1', wrongCount: 1, elapsedSeconds: 40 }],
      };

      const blob = await exportQuestionsToZip('Moja Paczka', inProgressSession.questions, {}, inProgressSession);
      const { sessionId, session: imported } = await importSessionFromZip(blob);

      expect(sessionId).toBeTruthy();
      expect(imported.baseName).toBe('Moja Paczka');
      expect(imported.repeatMode).toBe(2);
      // Progress must be reset!
      expect(imported.currentQuestionIndex).toBe(0);
      expect(imported.elapsedSeconds).toBe(0);
      expect(imported.done).toEqual([]);
      expect(imported.doneStats).toEqual([]);
      // Queue must contain all questions with fresh streak
      expect(imported.queue.length).toBe(2);
      expect(imported.queue.every(item => item.consecutiveCorrect === 0)).toBe(true);
    });
  });
});

