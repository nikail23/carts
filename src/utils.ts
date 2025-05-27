export function exponentialInterlopation(
  from: number,
  to: number,
  factor: number,
  k: number
): number {
  return from + (to - from) * Math.exp(-k * factor);
}
