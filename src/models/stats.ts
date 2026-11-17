/** Sample statistics used throughout: mean, standard deviation, covariance, quantiles. */
import type { Mat, Vec } from './math/matrix';

export const mean = (x: Vec): number => x.reduce((s, v) => s + v, 0) / x.length;

/** Sample variance with the n − 1 (Bessel) correction. */
export function variance(x: Vec): number {
  const m = mean(x);
  return x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1);
}
export const std = (x: Vec): number => Math.sqrt(variance(x));

export function covariance(x: Vec, y: Vec): number {
  const mx = mean(x);
  const my = mean(y);
  return x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / (x.length - 1);
}
export const correlation = (x: Vec, y: Vec): number => covariance(x, y) / (std(x) * std(y));

/** Covariance matrix of several series (each `cols[i]` is one asset's returns). */
export function covMatrix(cols: Vec[]): Mat {
  return cols.map((a) => cols.map((b) => covariance(a, b)));
}

/** Empirical quantile with linear interpolation, p in [0, 1]. */
export function quantile(x: Vec, p: number): number {
  const s = x.slice().sort((a, b) => a - b);
  const h = (s.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return s[lo] + (h - lo) * (s[hi] - s[lo]);
}
