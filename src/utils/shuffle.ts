// ─────────────────────────────────────────────────────────────────────────────
// Fisher-Yates shuffle  (returns a NEW array, does not mutate input)
// ─────────────────────────────────────────────────────────────────────────────

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate a shuffled index order for a given length
// e.g. shuffleIndices(4) => [2, 0, 3, 1]
// ─────────────────────────────────────────────────────────────────────────────

export function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  return shuffle(indices);
}

// ─────────────────────────────────────────────────────────────────────────────
// Find which position in a shuffled order maps to the original correct index
// e.g. order=[2,0,3,1], correctOriginalIndex=0 => shuffled position 1
// ─────────────────────────────────────────────────────────────────────────────

export function findShuffledPosition(
  order: number[],
  originalIndex: number
): number {
  return order.indexOf(originalIndex);
}
