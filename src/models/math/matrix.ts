/**
 * Small dense-matrix helpers. Portfolio maths is mostly w·μ and wᵀΣw,
 * so this is all we need: no external linear-algebra library.
 */
export type Vec = number[];
export type Mat = number[][];

export const dot = (a: Vec, b: Vec): number => a.reduce((s, x, i) => s + x * b[i], 0);
export const matVec = (m: Mat, v: Vec): Vec => m.map((row) => dot(row, v));
export const transpose = (m: Mat): Mat => m[0].map((_, j) => m.map((row) => row[j]));
export const matMul = (a: Mat, b: Mat): Mat => {
  const bt = transpose(b);
  return a.map((row) => bt.map((col) => dot(row, col)));
};
export const add = (a: Mat, b: Mat): Mat => a.map((row, i) => row.map((x, j) => x + b[i][j]));
export const scale = (m: Mat, k: number): Mat => m.map((row) => row.map((x) => x * k));
export const identity = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
export const diag = (v: Vec): Mat => v.map((x, i) => v.map((_, j) => (i === j ? x : 0)));
export const sum = (v: Vec): number => v.reduce((s, x) => s + x, 0);

/** Inverse by Gauss–Jordan elimination with partial pivoting. Fine for the ≤ 10×10 matrices used here. */
export function inverse(m: Mat): Mat {
  const n = m.length;
  const a = m.map((row, i) => [...row, ...identity(n)[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    if (Math.abs(a[pivot][col]) < 1e-14) throw new Error('Matrix is singular');
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const p = a[col][col];
    for (let j = 0; j < 2 * n; j++) a[col][j] /= p;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = a[r][col];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[col][j];
    }
  }
  return a.map((row) => row.slice(n));
}

/** Σ from volatilities and a correlation matrix: Σᵢⱼ = σᵢ σⱼ ρᵢⱼ. */
export function covFromCorr(vols: Vec, corr: Mat): Mat {
  return corr.map((row, i) => row.map((r, j) => r * vols[i] * vols[j]));
}
