/**
 * Mean–variance portfolio theory (Markowitz, 1952).
 *
 * A portfolio is a weight vector w (summing to 1). Its expected return is w·μ
 * and its variance wᵀΣw. The *efficient frontier* is the set of portfolios with
 * the lowest variance for each level of expected return.
 */
import { dot, inverse, matVec, sum, type Mat, type Vec } from './math/matrix';

export const portfolioReturn = (w: Vec, mu: Vec) => dot(w, mu);
export const portfolioVariance = (w: Vec, cov: Mat) => dot(w, matVec(cov, w));
export const portfolioVol = (w: Vec, cov: Mat) => Math.sqrt(Math.max(portfolioVariance(w, cov), 0));

/** Two assets: volatility of weight w in asset 1, (1 − w) in asset 2. */
export function twoAssetVol(w: number, s1: number, s2: number, rho: number): number {
  return Math.sqrt(w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2);
}

/** Two assets: the weight in asset 1 that minimises variance (may be < 0 or > 1). */
export function twoAssetMinVarWeight(s1: number, s2: number, rho: number): number {
  return (s2 * s2 - rho * s1 * s2) / (s1 * s1 + s2 * s2 - 2 * rho * s1 * s2);
}

/** Equal-weighted portfolio of n assets that all have vol σ and pairwise correlation ρ. */
export function equalWeightVol(n: number, sigma: number, rho: number): number {
  return sigma * Math.sqrt(1 / n + (1 - 1 / n) * rho);
}

/**
 * The unconstrained frontier (short selling allowed) in closed form.
 * With A = 1ᵀΣ⁻¹1, B = 1ᵀΣ⁻¹μ, C = μᵀΣ⁻¹μ and D = AC − B², the frontier
 * portfolio with expected return m has variance (A m² − 2B m + C)/D.
 */
export function frontierConstants(mu: Vec, cov: Mat) {
  const inv = inverse(cov);
  const ones = mu.map(() => 1);
  const invOnes = matVec(inv, ones);
  const invMu = matVec(inv, mu);
  const A = sum(invOnes);
  const B = dot(ones, invMu);
  const C = dot(mu, invMu);
  return { A, B, C, D: A * C - B * B, invOnes, invMu };
}

/** Weights of the unconstrained frontier portfolio with expected return m. */
export function frontierWeights(mu: Vec, cov: Mat, m: number): Vec {
  const { A, B, C, D, invOnes, invMu } = frontierConstants(mu, cov);
  return invOnes.map((x, i) => ((C - m * B) * x + (m * A - B) * invMu[i]) / D);
}

/** Global minimum-variance portfolio: Σ⁻¹1 / 1ᵀΣ⁻¹1. Needs no expected returns at all. */
export function minVarianceWeights(cov: Mat): Vec {
  const inv = inverse(cov);
  const x = matVec(inv, cov.map(() => 1));
  const s = sum(x);
  return x.map((v) => v / s);
}

/** Tangency (maximum-Sharpe) portfolio: Σ⁻¹(μ − r_f) normalised to sum to 1. */
export function tangencyWeights(mu: Vec, cov: Mat, rf: number): Vec {
  const x = matVec(inverse(cov), mu.map((m) => m - rf));
  const s = sum(x);
  return x.map((v) => v / s);
}

/**
 * Project v onto { w : Σw = 1, lo ≤ wᵢ ≤ hi }. We look for the shift τ with
 * Σ clip(vᵢ − τ, lo, hi) = 1 by bisection: the sum falls as τ rises.
 */
export function projectToBox(v: Vec, lo = 0, hi = 1): Vec {
  const clip = (x: number) => Math.min(hi, Math.max(lo, x));
  const f = (t: number) => v.reduce((s, x) => s + clip(x - t), 0) - 1;
  let a = Math.min(...v) - hi - 1;
  let b = Math.max(...v) - lo + 1;
  for (let k = 0; k < 100; k++) {
    const m = 0.5 * (a + b);
    if (f(m) > 0) a = m;
    else b = m;
  }
  const t = 0.5 * (a + b);
  return v.map((x) => clip(x - t));
}

/**
 * Long-only (and optionally capped) optimiser: maximise w·μ − (λ/2)·wᵀΣw
 * subject to Σw = 1, 0 ≤ w ≤ cap. Solved by projected gradient ascent,
 * which is slow but transparent — every step is "move uphill, then put the
 * weights back inside the allowed box".
 */
export function optimizeMeanVariance(mu: Vec, cov: Mat, lambda: number, { cap = 1, iterations = 3000 } = {}): Vec {
  const n = mu.length;
  // A safe step size from the largest row sum of Σ (a bound on its largest eigenvalue).
  const L = lambda * Math.max(...cov.map((row) => row.reduce((s, x) => s + Math.abs(x), 0))) + 1e-12;
  const step = 1 / L;
  let w = projectToBox(new Array(n).fill(1 / n), 0, cap);
  for (let it = 0; it < iterations; it++) {
    const g = matVec(cov, w).map((x, i) => mu[i] - lambda * x);
    w = projectToBox(w.map((x, i) => x + step * g[i]), 0, cap);
  }
  return w;
}

export interface FrontierPoint {
  weights: Vec;
  ret: number;
  vol: number;
}

/** Long-only frontier traced by sweeping risk aversion from very high to very low. */
export function longOnlyFrontier(mu: Vec, cov: Mat, { cap = 1, points = 30 } = {}): FrontierPoint[] {
  const lambdas = Array.from({ length: points }, (_, i) => 10 ** (3 - (4.5 * i) / (points - 1))); // 1000 → ~0.03
  return lambdas.map((lambda) => {
    const weights = optimizeMeanVariance(mu, cov, lambda, { cap, iterations: 1500 });
    return { weights, ret: portfolioReturn(weights, mu), vol: portfolioVol(weights, cov) };
  });
}

/** The point of a frontier with the highest Sharpe ratio. */
export function maxSharpePoint(frontier: FrontierPoint[], rf: number): FrontierPoint {
  return frontier.reduce((best, p) => ((p.ret - rf) / p.vol > (best.ret - rf) / best.vol ? p : best));
}
