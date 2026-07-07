/**
 * シード付き擬似乱数（mulberry32）。
 *
 * ゲーム内で Math.random() を直接使わずこれを経由することで、
 * シード固定による決定論的な再現（AI テストプレイ・バグ再現）を可能にする。
 */

export interface Rng {
  readonly seed: number;
  /** [0, 1) の乱数 */
  next(): number;
  /** [0, maxExclusive) の整数 */
  int(maxExclusive: number): number;
  /** [min, max) の実数 */
  range(min: number, max: number): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed,
    next,
    int(maxExclusive) {
      return Math.floor(next() * maxExclusive);
    },
    range(min, max) {
      return min + next() * (max - min);
    },
  };
}
