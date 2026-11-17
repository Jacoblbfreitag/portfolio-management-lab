/**
 * Ordinary least squares, CAPM and factor models.
 *
 * Regressing a fund's excess returns on the market's gives its beta (market
 * exposure) and alpha (return not explained by that exposure). Adding factors
 * (size, value, momentum…) tells you what the manager is *really* holding.
 */
import { dot, inverse, matVec, transpose, type Mat, type Vec } from './math/matrix';
import { mean } from './stats';

export interface OlsResult {
  /** coef[0] is the intercept (alpha), then one slope per regressor */
  coef: Vec;
  /** t-statistics of each coefficient */
  t: Vec;
  r2: number;
  /** standard deviation of the residuals */
  residualStd: number;
  residuals: Vec;
}

/** y = a + Σ bₖ xₖ + ε. `xs` holds one array per regressor. */
export function ols(y: Vec, xs: Vec[]): OlsResult {
  const n = y.length;
  const X: Mat = y.map((_, i) => [1, ...xs.map((x) => x[i])]);
  const Xt = transpose(X);
  const XtXinv = inverse(Xt.map((row) => Xt.map((col) => dot(row, col))));
  const coef = matVec(XtXinv, matVec(Xt, y));
  const fitted = X.map((row) => dot(row, coef));
  const residuals = y.map((v, i) => v - fitted[i]);
  const k = coef.length;
  const s2 = residuals.reduce((s, e) => s + e * e, 0) / (n - k);
  const my = mean(y);
  const tss = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const rss = residuals.reduce((s, e) => s + e * e, 0);
  return {
    coef,
    t: coef.map((c, i) => c / Math.sqrt(s2 * XtXinv[i][i])),
    r2: 1 - rss / tss,
    residualStd: Math.sqrt(s2),
    residuals,
  };
}

/** CAPM expected return: r_f + β (E[R_m] − r_f). */
export const capmReturn = (rf: number, beta: number, marketPremium: number) => rf + beta * marketPremium;

/** Treynor ratio: excess return per unit of *market* risk (beta). */
export const treynorRatio = (ret: number, rf: number, beta: number) => (ret - rf) / beta;

/** Jensen's alpha: realised return minus what CAPM says the beta deserved. */
export const jensensAlpha = (ret: number, rf: number, beta: number, marketRet: number) => ret - (rf + beta * (marketRet - rf));
