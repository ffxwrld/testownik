import re

with open('src/utils/parser.ts', 'r') as f:
    content = f.read()

# Replace decodeMask
old_decode_mask = """export function decodeMask(maskLine: string): number[] {
  const digits = maskLine.replace(/^[^01]*/, '');
  const indices: number[] = [];
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] === '1') indices.push(i);
  }
  if (indices.length === 0) {
    throw new Error(`No '1' found in mask: "${maskLine}"`);
  }
  return indices;
}"""

new_decode_mask = """export interface DecodedMask {
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
}"""

content = content.replace(old_decode_mask, new_decode_mask)


# Replace parseQuestionFile logic
old_parse_logic = """  // Auto-fix for corrupted files and support for multi-line questions: 
  // If there are more answer lines than mask digits, the extra lines 
  // at the top of the answers block belong to the question text.
  const digits = maskLine.replace(/^[^01]*/, '');
  const diff = answerTexts.length - digits.length;
  if (diff > 0) {
    const extraLines = answerTexts.splice(0, diff);
    questionText += '\\n' + extraLines.join('\\n');
  }

  let correctIndices: number[];
  try {
    correctIndices = decodeMask(maskLine);
  } catch (err) {
    console.warn(`Skipping file "${filename}": ${(err as Error).message}`);
    return null;
  }"""

new_parse_logic = """  let decoded: DecodedMask;
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
    questionText += '\\n' + extraLines.join('\\n');
  } else if (diff < 0) {
    console.warn(`Skipping file "${filename}": missing answers (mask expects ${digits.length}, found ${answerTexts.length})`);
    return null;
  }"""

content = content.replace(old_parse_logic, new_parse_logic)

with open('src/utils/parser.ts', 'w') as f:
    f.write(content)
