import type { TypedArray, Vector3 } from 'three';

export function exponentialInterlopation(
  from: number,
  to: number,
  factor: number,
  k: number
): number {
  return from + (to - from) * Math.exp(-k * factor);
}

export function truncatePositions(
  positions: TypedArray,
  limit: { x?: number; y?: number; z?: number }
): TypedArray {
  const filteredPositions: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    let keep = true;
    if (limit.x !== undefined) {
      if (x < -Math.abs(limit.x) || x > Math.abs(limit.x)) keep = false;
    }
    if (limit.y !== undefined) {
      if (y < -Math.abs(limit.y) || y > Math.abs(limit.y)) keep = false;
    }
    if (limit.z !== undefined) {
      if (z < -Math.abs(limit.z) || z > Math.abs(limit.z)) keep = false;
    }

    if (keep) {
      filteredPositions.push(x, y, z);
    }
  }
  return new Float32Array(filteredPositions);
}
