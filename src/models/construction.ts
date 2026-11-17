/**
 * Portfolio construction beyond textbook Markowitz: risk budgets, risk parity,
 * and Black–Litterman. These are what you will actually meet on a multi-asset desk.
 */
import { add, diag, dot, inverse, matMul, matVec, scale, transpose, type Mat, type Vec } from './math/matrix';
import { portfolioVol } from './meanVariance';

/**
 * Risk contribution of each asset: RCᵢ = wᵢ (Σw)ᵢ / σ_p.
 * The contributions add up to the portfolio volatility exactly (Euler).
 */
export function riskContributions(w: Vec, cov: Mat): Vec {
  const sigma = portfolioVol(w, cov);
  const m = matVec(cov, w);
  return w.map((x, i) => (x * m[i]) / sigma);
}

/** The same, as shares of total risk (summing to 1). */
export function riskShares(w: Vec, cov: Mat): Vec {
  const rc = riskContributions(w, cov);
  const s = rc.reduce((a, b) => a + b, 0);
  return rc.map((x) => x / s);
}

export const equalWeights = (n: number): Vec => new Array(n).fill(1 / n);

/** Inverse-volatility ("naive risk parity"): wᵢ ∝ 1/σᵢ. Ignores correlations. */
export function inverseVolWeights(cov: Mat): Vec {
  const x = cov.map((row, i) => 1 / Math.sqrt(row[i]));
  const s = x.reduce((a, b) => a + b, 0);
  return x.map((v) => v / s);
}

/**
 * Risk budgeting: find long-only w with risk shares equal to `budget`
 * (equal budgets = equal risk contribution, ERC / "risk parity").
 * Cyclical coordinate descent on ½xᵀΣx − Σ bᵢ ln xᵢ: each step solves a
 * quadratic for one xᵢ in closed form. Converges fast for any valid Σ.
 */
export function riskBudgetWeights(cov: Mat, budget?: Vec, iterations = 500): Vec {
  const n = cov.length;
  const b = budget ?? new Array(n).fill(1 / n);
  const x = cov.map((row, i) => 1 / Math.sqrt(row[i]));
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < n; i++) {
      let c = 0;
      for (let j = 0; j < n; j++) if (j !== i) c += cov[i][j] * x[j];
      const a = cov[i][i];
      x[i] = (-c + Math.sqrt(c * c + 4 * a * b[i])) / (2 * a);
    }
  }
  const s = x.reduce((p, q) => p + q, 0);
  return x.map((v) => v / s);
}

/** Reverse optimisation: the returns that make the market portfolio optimal, Π = δΣw_mkt. */
export const impliedReturns = (cov: Mat, wMkt: Vec, delta: number): Vec => matVec(cov, wMkt).map((x) => delta * x);

export interface View {
  /** pick vector: e.g. [0, 0, 1, −1, …] for "asset 3 beats asset 4" */
  p: Vec;
  /** the view's expected return (annual) */
  q: number;
  /** confidence in (0, 1): 1 = certain, 0 = ignore */
  confidence: number;
}

/**
 * Black–Litterman (1992): blend the market-implied returns Π with your views.
 *   μ_BL = [(τΣ)⁻¹ + PᵀΩ⁻¹P]⁻¹ [(τΣ)⁻¹Π + PᵀΩ⁻¹Q]
 * Ω (view uncertainty) is set from each view's confidence c as
 * ωₖ = τ·(PΣPᵀ)ₖₖ·(1 − c)/c, so c = 50% weighs the view like the prior.
 */
export function blackLitterman(cov: Mat, wMkt: Vec, views: View[], { delta = 2.5, tau = 0.05 } = {}) {
  const pi = impliedReturns(cov, wMkt, delta);
  if (views.length === 0) return { prior: pi, posterior: pi, weights: wMkt };
  const P: Mat = views.map((v) => v.p);
  const Q: Vec = views.map((v) => v.q);
  const tauSigma = scale(cov, tau);
  const omega = diag(
    views.map((v) => {
      const c = Math.min(Math.max(v.confidence, 1e-4), 1 - 1e-6);
      return dot(v.p, matVec(tauSigma, v.p)) * ((1 - c) / c);
    }),
  );
  const Pt = transpose(P);
  const tsInv = inverse(tauSigma);
  const omInv = inverse(omega);
  const lhs = add(tsInv, matMul(matMul(Pt, omInv), P));
  const rhs = matVec(tsInv, pi).map((x, i) => x + matVec(matMul(Pt, omInv), Q)[i]);
  const posterior = matVec(inverse(lhs), rhs);
  // Unconstrained optimal weights for the posterior: (δΣ)⁻¹ μ_BL. Normalised to sum to 1.
  const raw = matVec(inverse(scale(cov, delta)), posterior);
  const s = raw.reduce((a, b) => a + b, 0);
  return { prior: pi, posterior, weights: raw.map((x) => x / s) };
}
