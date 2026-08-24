with open('src/App.tsx', 'r') as f:
    content = f.read()

if "import { mapQuestionsToEditingFormat, mapEditingFormatToQuestions } from './utils/adapters';" not in content:
    content = content.replace("import { buildInitialSession, saveSession, loadSession } from './utils/session';", "import { buildInitialSession, saveSession, loadSession } from './utils/session';\nimport { mapQuestionsToEditingFormat, mapEditingFormatToQuestions } from './utils/adapters';")

old_edit_block = """    // Temporary mapping to avoid importing EditingQuestion type

    const editingQuestions = saved.questions.map((q, idx) => {
      const maskLine = q.id.split('_')[0] || 'X';
      const category = maskLine.charAt(0).toUpperCase() || 'X';
      let fn = q.sourceFile || '';
      if (fn.toLowerCase().endsWith('.txt')) fn = fn.slice(0, -4);
      
      return {
        id: Math.random().toString(36).slice(2, 9),
        filename: fn || `pytanie_${idx+1}`,
        text: q.text || '',
        category: category,
        answers: q.answers.map(a => ({
          id: Math.random().toString(36).slice(2, 9),
          text: a.text,
          isCorrect: a.isCorrect
        }))
      };
    });"""

new_edit_block = """    const editingQuestions = mapQuestionsToEditingFormat(saved.questions);"""

content = content.replace(old_edit_block, new_edit_block)

old_save_block = """      const questions: Question[] = editingQuestions.map((eq, idx) => {
        const binary = eq.answers.map((a: EditingAnswer) => a.isCorrect ? '1' : '0').join('');
        const maskLine = (eq.category || 'X') + binary;
        const filename = (eq.filename || '').trim() || `pytanie_${idx+1}`;
        const baseId = maskLine + '_' + filename.replace(/[^a-zA-Z0-9_-]/g, '_');
        const correctIndices = eq.answers.map((a: EditingAnswer, i: number) => a.isCorrect ? i : -1).filter((i: number) => i !== -1);
        
        return {
          id: baseId,
          sourceFile: filename + '.txt',
          text: eq.text,
          answers: eq.answers.map((a: EditingAnswer, i: number) => ({ id: `${filename}-ans-${i}`, text: a.text, isCorrect: a.isCorrect })),
          correctAnswerIndex: correctIndices[0] ?? 0,
          correctAnswerIndices: correctIndices
        };
      });"""

new_save_block = """      const questions = mapEditingFormatToQuestions(editingQuestions);"""

content = content.replace(old_save_block, new_save_block)

with open('src/App.tsx', 'w') as f:
    f.write(content)
