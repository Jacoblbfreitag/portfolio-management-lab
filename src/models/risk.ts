/** Portfolio risk: Value-at-Risk, Expected Shortfall, risk decomposition and stress tests. */
import { normPdf } from './math/normal';
import { matVec, type Mat, type Vec } from './math/matrix';
import { portfolioVol } from './meanVariance';

/**
 * Inverse standard normal CDF (Acklam's rational approximation, |error| < 1.2e-9).
 * normInv(0.95) ≈ 1.645, normInv(0.99) ≈ 2.326.
 */
export function normInv(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) return -normInv(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Parametric (normal) VaR as a positive loss fraction: z·σ√h − μh, horizon h in years. */
export const parametricVaR = (mu: number, sigma: number, conf: number, h = 1) => normInv(conf) * sigma * Math.sqrt(h) - mu * h;

/** Normal Expected Shortfall: average loss beyond the VaR, σ√h·n(z)/(1−α) − μh. */
export const parametricES = (mu: number, sigma: number, conf: number, h = 1) => (sigma * Math.sqrt(h) * normPdf(normInv(conf))) / (1 - conf) - mu * h;

/** Historical VaR: the loss at the (1 − conf) quantile of past returns (as a positive number). */
export function historicalVaR(returns: number[], conf: number): number {
  const s = returns.slice().sort((a, b) => a - b);
  const k = Math.floor((1 - conf) * s.length);
  return -s[Math.max(k, 0)];
}

/** Historical ES: the average of the losses at or beyond the historical VaR. */
export function historicalES(returns: number[], conf: number): number {
  const s = returns.slice().sort((a, b) => a - b);
  const k = Math.max(Math.floor((1 - conf) * s.length), 1);
  return -s.slice(0, k).reduce((a, b) => a + b, 0) / k;
}

/** Marginal VaR (∂VaR/∂wᵢ) and component VaR (wᵢ·marginal), normal, zero mean. Components sum to the VaR. */
export function componentVaR(w: Vec, cov: Mat, conf: number): { marginal: Vec; component: Vec; total: number } {
  const sigma = portfolioVol(w, cov);
  const z = normInv(conf);
  const marginal = matVec(cov, w).map((x) => (z * x) / sigma);
  const component = marginal.map((m, i) => m * w[i]);
  return { marginal, component, total: z * sigma };
}

/** Scenario P&L: Σ wᵢ · shockᵢ. */
export const stressLoss = (w: Vec, shocks: Vec) => w.reduce((s, x, i) => s + x * shocks[i], 0);
