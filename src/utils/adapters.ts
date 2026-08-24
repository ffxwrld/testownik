import { Question } from '../models/types';
import { EditingQuestion, EditingAnswer } from '../hooks/useCreatorEngine';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function mapQuestionsToEditingFormat(questions: Question[]): EditingQuestion[] {
  return questions.map((q, idx) => {
    const maskLine = q.id.split('_')[0] || 'X';
    const category = maskLine.charAt(0).toUpperCase() || 'X';
    let fn = q.sourceFile || '';
    if (fn.toLowerCase().endsWith('.txt')) fn = fn.slice(0, -4);
    
    return {
      id: generateId(),
      filename: fn || `pytanie_${idx + 1}`,
      text: q.text || '',
      category: category,
      answers: q.answers.map(a => ({
        id: generateId(),
        text: a.text,
        isCorrect: a.isCorrect
      }))
    };
  });
}

export function mapEditingFormatToQuestions(editingQuestions: EditingQuestion[]): Question[] {
  return editingQuestions.map((eq, idx) => {
    const binary = eq.answers.map((a: EditingAnswer) => a.isCorrect ? '1' : '0').join('');
    const maskLine = (eq.category || 'X').toUpperCase() + binary;
    const filename = (eq.filename || '').trim() || `pytanie_${idx + 1}`;
    const baseId = maskLine + '_' + filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const correctIndices = eq.answers
      .map((a: EditingAnswer, i: number) => a.isCorrect ? i : -1)
      .filter((i: number) => i !== -1);
    
    return {
      id: baseId,
      sourceFile: filename + '.txt',
      text: eq.text,
      answers: eq.answers.map((a: EditingAnswer, i: number) => ({ 
        id: `${filename}-ans-${i}`, 
        text: a.text, 
        isCorrect: a.isCorrect 
      })),
      correctAnswerIndex: correctIndices[0] ?? 0,
      correctAnswerIndices: correctIndices
    };
  });
}
