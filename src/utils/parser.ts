import JSZip from 'jszip';
import { Question, Answer } from '../models/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mask decoder
//
// Input:  "X0100"
// Output: index 1  (0-based position of '1' in "0100")
//
// The first character (e.g. 'X') is a category prefix and is ignored.
// The remaining characters are a binary mask; the position of '1' (0-based)
// is the index of the correct answer.
// ─────────────────────────────────────────────────────────────────────────────

export function decodeMask(maskLine: string): number[] {
  // Strip leading non-digit characters (the category letter)
  const digits = maskLine.replace(/^[^01]*/, '');
  const indices: number[] = [];
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] === '1') indices.push(i);
  }
  if (indices.length === 0) {
    throw new Error(`No '1' found in mask: "${maskLine}"`);
  }
  return indices;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse a single text file into a Question object
//
// File format:
//   Line 0:  ID / mask   (e.g. "X0100")
//   Line 1:  Question text
//   Lines 2+: Answer options
// ─────────────────────────────────────────────────────────────────────────────

export function decodeFileContent(bytes: Uint8Array): string {
  try {
    // Pierwsza próba: czyste UTF-8 (fatal: true wyrzuci wyjątek, jeśli plik ma inne kodowanie np. polskie znaki w ANSI)
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (err) {
    // Fallback: Windows-1250 (bardzo popularne dla polskich znaków w starych systemach Windows)
    return new TextDecoder('windows-1250').decode(bytes);
  }
}

function parseQuestionFile(
  content: string,
  filename: string
): Question | null {
  // Normalise line endings and split
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 3) {
    // Need at least: mask, question text, one answer
    console.warn(`Skipping file "${filename}": too few lines (${lines.length})`);
    return null;
  }

  const maskLine = lines[0];
  const questionText = lines[1];
  const answerTexts = lines.slice(2);

  let correctIndices: number[];
  try {
    correctIndices = decodeMask(maskLine);
  } catch (err) {
    console.warn(`Skipping file "${filename}": ${(err as Error).message}`);
    return null;
  }

  const maxIndex = Math.max(...correctIndices);
  if (maxIndex >= answerTexts.length) {
    console.warn(
      `Skipping file "${filename}": correct index ${maxIndex} out of range ` +
        `(only ${answerTexts.length} answers)`
    );
    return null;
  }

  const answers: Answer[] = answerTexts.map((text, i) => ({
    id: `${filename}-ans-${i}`,
    text,
    isCorrect: correctIndices.includes(i),
  }));

  // Derive a stable, user-friendly ID from mask + filename
  const baseId = maskLine + '_' + filename.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    id: baseId,
    sourceFile: filename,
    text: questionText,
    answers,
    correctAnswerIndex: correctIndices[0], // legacy: first correct
    correctAnswerIndices: correctIndices,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read a ZIP blob and extract all questions from .txt files inside
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedZipResult {
  questions: Question[];
  images: Record<string, Blob>;
}

export async function parseZipFile(file: File): Promise<ParsedZipResult> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(file);

  const questions: Question[] = [];
  const txtFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];
  const imgFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];

  loaded.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir || relativePath.startsWith('__MACOSX/')) return;

    const lower = relativePath.toLowerCase();
    if (lower.endsWith('.txt')) {
      txtFiles.push({ name: relativePath, file: zipEntry });
    } else if (lower.match(/\.(png|jpe?g|gif)$/)) {
      imgFiles.push({ name: relativePath, file: zipEntry });
    }
  });

  // Sort for deterministic ordering
  txtFiles.sort((a, b) => a.name.localeCompare(b.name));

  await Promise.all(
    txtFiles.map(async ({ name, file }) => {
      try {
        const bytes = await file.async('uint8array');
        const content = decodeFileContent(bytes);
        const q = parseQuestionFile(content, name);
        if (q) questions.push(q);
      } catch (err) {
        console.warn(`Failed to read "${name}":`, err);
      }
    })
  );

  // Sort again because Promise.all doesn't preserve insertion order
  questions.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));

  const images: Record<string, Blob> = {};
  await Promise.all(
    imgFiles.map(async ({ name, file }) => {
      try {
        const blob = await file.async('blob');
        // Pobieramy tylko nazwę pliku bez ewentualnej ścieżki z folderem
        const fileName = name.split('/').pop() || name;
        images[fileName] = blob;
      } catch (err) {
        console.warn(`Failed to read image "${name}":`, err);
      }
    })
  );

  return { questions, images };
}
