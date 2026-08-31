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

export interface DecodedMask {
  indices: number[];
  digits: string;
}

export function decodeMask(maskLine: string): DecodedMask {
  const maskMatch = maskLine.match(/[01]+/);
  if (!maskMatch) {
    throw new Error(`Invalid mask format (no binary digits found): "${maskLine}"`);
  }
  const digits = maskMatch[0];
  const indices: number[] = [];
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] === '1') indices.push(i);
  }
  if (indices.length === 0) {
    throw new Error(`No '1' found in mask: "${maskLine}"`);
  }
  return { indices, digits };
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
    // First attempt: pure UTF-8 (fatal: true will throw an exception if the file has different encoding e.g. Polish characters in ANSI)
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (err) {
    // Fallback: Windows-1250 (very popular for Polish characters in old Windows systems)
    return new TextDecoder('windows-1250').decode(bytes);
  }
}

export function parseQuestionFile(
  content: string,
  filename: string
): Question | null {
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 3) {
    console.warn(`Skipping file "${filename}": too few lines (${lines.length})`);
    return null;
  }

  const maskLine = lines[0];
  let questionText = lines[1];
  let answerTexts = lines.slice(2);

  let decoded: DecodedMask;
  try {
    decoded = decodeMask(maskLine);
  } catch (err) {
    console.warn(`Skipping file "${filename}": ${(err as Error).message}`);
    return null;
  }
  const { indices: correctIndices, digits } = decoded;

  // Auto-fix for corrupted files and support for multi-line questions: 
  // If there are more answer lines than mask digits, the extra lines 
  // at the top of the answers block belong to the question text.
  const diff = answerTexts.length - digits.length;
  if (diff > 0) {
    const extraLines = answerTexts.splice(0, diff);
    questionText += '\n' + extraLines.join('\n');
  } else if (diff < 0) {
    console.warn(`Skipping file "${filename}": missing answers (mask expects ${digits.length}, found ${answerTexts.length})`);
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

export interface ParsedZipResult {
  questions: Question[];
  images: Record<string, Blob>;
}

export async function parseZipFile(file: File): Promise<ParsedZipResult> {
  
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit for the ZIP itself
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Plik paczki jest zbyt duży (maksymalnie 50MB).');
  }

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

  // Sort for deterministic natural ordering
  
  const MAX_FILES = 2000;
  if (txtFiles.length + imgFiles.length > MAX_FILES) {
    throw new Error(`Paczka zawiera zbyt wiele plików (maksymalnie ${MAX_FILES}).`);
  }

  txtFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  let commonPrefix = '';
  if (txtFiles.length > 0) {
    const firstParts = txtFiles[0].name.split('/');
    firstParts.pop();
    
    while (firstParts.length > 0) {
      const potentialPrefix = firstParts.join('/') + '/';
      if (txtFiles.every(f => f.name.startsWith(potentialPrefix))) {
        commonPrefix = potentialPrefix;
        break;
      }
      firstParts.pop();
    }
  }

  const BATCH_SIZE = 20;

  for (let i = 0; i < txtFiles.length; i += BATCH_SIZE) {
    const batch = txtFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ name, file }) => {
        try {
          const bytes = await file.async('uint8array');
          const content = decodeFileContent(bytes);
          const strippedName = commonPrefix ? name.substring(commonPrefix.length) : name;
          const q = parseQuestionFile(content, strippedName);
          if (q) questions.push(q);
        } catch (err) {
          console.warn(`Failed to read "${name}":`, err);
        }
      })
    );
    // Yield to the event loop to prevent UI freezing on massive archives
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Sort again because Promise.all doesn't preserve insertion order
  questions.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile, undefined, { numeric: true, sensitivity: 'base' }));

  const images: Record<string, Blob> = {};
  for (let i = 0; i < imgFiles.length; i += BATCH_SIZE) {
    const batch = imgFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ name, file }) => {
        try {
          const blob = await file.async('blob');
          const fileName = name.split('/').pop() || name;
          images[fileName] = blob;
        } catch (err) {
          console.warn(`Failed to read image "${name}":`, err);
        }
      })
    );
    // Yield to event loop to clear massive image allocations from memory
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return { questions, images };
}
