export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  return shuffle(indices);
}

export function findShuffledPosition(
  order: number[],
  originalIndex: number
): number {
  return order.indexOf(originalIndex);
}
