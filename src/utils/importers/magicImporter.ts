import { Question, Answer } from '../../models/types';

export interface ParseResult {
  questions: Question[];
  title?: string;
  error?: string;
}

/**
 * Parsuje tekst przy użyciu konkretnych, wyznaczonych separatorów.
 */
export function parseCustomTextSync(text: string, termSep: string, rowSep: string): ParseResult {
  if (!text || text.trim() === '') return { questions: [], error: 'Pusty tekst' };
  if (!termSep) return { questions: [], error: 'Brak separatora pytania i odpowiedzi' };
  if (!rowSep) return { questions: [], error: 'Brak separatora fiszek' };

  const questions: Question[] = [];
  const rows = text.split(rowSep).filter(r => r.trim() !== '');

  for (const row of rows) {
    const parts = row.split(termSep);
    if (parts.length >= 2) {
      const term = parts[0].trim();
      const def = parts.slice(1).join(termSep).trim(); // w razie gdyby odp też miała separator
      if (term && def) {
        questions.push({
          id: generateId(),
          sourceFile: 'magic_paste',
          text: term,
          correctAnswerIndices: [0],
          answers: [
            { id: generateId(), text: def, isCorrect: true }
          ]
        });
      }
    }
  }

  if (questions.length === 0) {
    return { questions: [], error: 'Nie udało się rozpoznać pytań z użyciem tych separatorów' };
  }

  return { questions, title: 'Import własny' };
}

/**
 * Próbuje rozpoznać i sparsować wklejony tekst z różnych źródeł
 * (Quizlet, CSV, TSV, Notatki z numeracją).
 */
export async function parseMagicText(text: string): Promise<ParseResult> {
  if (!text || text.trim() === '') {
    return { questions: [], error: 'Pusty tekst' };
  }

  // 1. Zobaczmy czy to TSV (Quizlet domyślnie używa Tab między terminem a definicją)
  if (text.includes('\t')) {
    const questions = parseTsv(text);
    if (questions.length > 0) return { questions, title: 'Import (Quizlet / Tab-separated)' };
  }

  // 2. CSV z przecinkami
  if (text.includes(',')) {
    // Sprawdźmy heurystycznie czy to brzmi jak CSV
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const commasPerLine = lines.map(l => (l.match(/,/g) || []).length);
    const avgCommas = commasPerLine.reduce((a, b) => a + b, 0) / commasPerLine.length;
    if (avgCommas >= 1 && lines.length > 1) {
      const questions = parseCsv(lines);
      if (questions.length > 0) return { questions, title: 'Import (CSV)' };
    }
  }

  // 3. Fallback: Spróbujmy znaleźć numery (AI / Raw Text format)
  // "1. Pytanie \n A) ... \n B) ..."
  const aiQuestions = parseAiNumberedText(text);
  if (aiQuestions.length > 0) {
    return { questions: aiQuestions, title: 'Import z notatek' };
  }

  return { questions: [], error: 'Nie udało się rozpoznać formatu. Skopiuj tekst prosto z Quizleta (Kopiuj listę) lub użyj formatu: Pytanie [TAB] Odpowiedź' };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function parseTsv(text: string): Question[] {
  const lines = text.split('\n');
  const questions: Question[] = [];
  
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const term = parts[0].trim();
      const def = parts.slice(1).join('\t').trim();
      if (!term || !def) continue;

      // Dla fiszek z Quizleta tworzymy pytanie z definicją i generujemy fałszywe z innych pytań (w UI można je pominąć dla fiszek)
      // Lub po prostu dajemy 1 poprawną odpowiedź, a UI Testownika powinno wspierać pytania z 1 odpowiedzią jako "Fiszki"
      questions.push({
        id: generateId(),
        sourceFile: 'magic_paste',
        text: term,
        correctAnswerIndices: [0],
        answers: [
          { id: generateId(), text: def, isCorrect: true }
        ]
      });
    }
  }
  return questions;
}

function parseCsv(lines: string[]): Question[] {
  const questions: Question[] = [];
  
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 2) {
      const text = parts[0].trim();
      const answers: Answer[] = [];
      const correctAnswerIndices: number[] = [];
      
      // Zakładamy: Kolumna 1: Pytanie, Kolumna 2: Poprawna odpowiedź, Kolumny 3+: Fałszywe
      for (let i = 1; i < parts.length; i++) {
        const val = parts[i].trim();
        if (val) {
          const isCorrect = i === 1;
          if (isCorrect) correctAnswerIndices.push(answers.length);
          answers.push({
            id: generateId(),
            text: val,
            isCorrect
          });
        }
      }

      if (text && answers.length > 0) {
        questions.push({ id: generateId(), sourceFile: 'magic_paste', text, answers, correctAnswerIndices });
      }
    }
  }
  return questions;
}

function parseAiNumberedText(text: string): Question[] {
  // Prosty parser do pytań typu:
  // 1. Co to jest?
  // a) foo (poprawna)
  // b) bar
  // lub z zaznaczeniem * poprawna
  
  const blocks = text.split(/(?:\n|^)\d+\.\s/).filter(Boolean);
  const questions: Question[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const questionText = lines[0];
    const answers: Answer[] = [];
    const correctAnswerIndices: number[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const isCorrect = line.includes('*') || line.toLowerCase().includes('(poprawna)');
      const cleanLine = line.replace(/^[a-zA-Z]\)\s*/, '').replace('*', '').replace(/\(poprawna\)/i, '').trim();
      
      if (cleanLine) {
        if (isCorrect) correctAnswerIndices.push(answers.length);
        answers.push({
          id: generateId(),
          text: cleanLine,
          isCorrect
        });
      }
    }

    // Jeśli żadna nie jest correct, ustawiamy pierwszą jako correct (heurystyka flashcards)
    if (answers.length > 0 && correctAnswerIndices.length === 0) {
      answers[0].isCorrect = true;
      correctAnswerIndices.push(0);
    }

    if (answers.length > 0) {
      questions.push({ id: generateId(), sourceFile: 'magic_paste', text: questionText, answers, correctAnswerIndices });
    }
  }

  return questions;
}
