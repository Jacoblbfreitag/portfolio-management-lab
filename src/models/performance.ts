/**
 * Performance measurement and attribution: how a client, a consultant or
 * your boss decides whether you did a good job.
 */
import { bisect } from './math/solve';
import { mean, std } from './stats';

/** Time-weighted return: chain-link the sub-period returns. Ignores the size of cash flows. */
export const timeWeightedReturn = (subPeriodReturns: number[]) => subPeriodReturns.reduce((g, r) => g * (1 + r), 1) - 1;

/**
 * Money-weighted return (IRR): the single rate r with Σ CFₜ/(1+r)^t = 0.
 * Sign convention: money the investor puts in is negative, money out (and the
 * final value) is positive. Times in years.
 */
export function moneyWeightedReturn(flows: { t: number; cf: number }[]): number {
  const npv = (r: number) => flows.reduce((s, { t, cf }) => s + cf / (1 + r) ** t, 0);
  return bisect(npv, -0.99, 10);
}

/** Tracking error: annualised volatility of the active return (portfolio − benchmark). */
export function trackingError(port: number[], bench: number[], periodsPerYear = 12): number {
  return std(port.map((r, i) => r - bench[i])) * Math.sqrt(periodsPerYear);
}

/** Information ratio: annual active return divided by tracking error. */
export function informationRatio(port: number[], bench: number[], periodsPerYear = 12): number {
  const active = port.map((r, i) => r - bench[i]);
  return (mean(active) * periodsPerYear) / (std(active) * Math.sqrt(periodsPerYear));
}

export interface Segment {
  name: string;
  /** portfolio weight, benchmark weight, portfolio return, benchmark return */
  wp: number;
  wb: number;
  rp: number;
  rb: number;
}

export interface AttributionRow {
  name: string;
  allocation: number;
  selection: number;
  interaction: number;
  total: number;
}

/**
 * Brinson–Fachler attribution (single period).
 *   allocation  = (w_p − w_b)(r_b,i − R_b)   did you overweight segments that beat the benchmark?
 *   selection   = w_b (r_p,i − r_b,i)        did you pick better securities within each segment?
 *   interaction = (w_p − w_b)(r_p,i − r_b,i)
 * The three add up to the total active return R_p − R_b.
 */
export function brinson(segments: Segment[]): { rows: AttributionRow[]; Rp: number; Rb: number } {
  const Rp = segments.reduce((s, x) => s + x.wp * x.rp, 0);
  const Rb = segments.reduce((s, x) => s + x.wb * x.rb, 0);
  const rows = segments.map((x) => {
    const allocation = (x.wp - x.wb) * (x.rb - Rb);
    const selection = x.wb * (x.rp - x.rb);
    const interaction = (x.wp - x.wb) * (x.rp - x.rb);
    return { name: x.name, allocation, selection, interaction, total: allocation + selection + interaction };
  });
  return { rows, Rp, Rb };
}

/** Wealth after `years` with a gross annual return and an annual fee (as a rate, e.g. 0.01). */
export const wealthAfterFees = (initial: number, gross: number, fee: number, years: number) => initial * ((1 + gross) * (1 - fee)) ** years;

/** Grinold's fundamental law of active management: IR ≈ IC · √breadth. */
export const fundamentalLawIR = (ic: number, breadth: number) => ic * Math.sqrt(breadth);

/** Years of track record needed for the alpha's t-statistic (≈ IR·√T) to reach `t`. */
export const yearsToSignificance = (ir: number, t = 2) => (t / ir) ** 2;
