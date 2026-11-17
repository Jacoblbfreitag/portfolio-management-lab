/**
 * Asset allocation over time: Monte Carlo of savings plans, rebalancing rules
 * and glide paths.
 */
import { makeGaussian } from './math/rng';
import { quantile } from './stats';

export interface WealthFan {
  years: number[];
  p5: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p95: number[];
  /** final wealth on every path */
  finals: number[];
}

/**
 * Simulate wealth with lognormal annual returns (arithmetic mean μ, vol σ),
 * starting at `initial` and adding `contribution` at the end of every year.
 */
export function simulateWealth(
  { initial, contribution, mu, sigma, years, paths = 2000, seed = 7 }:
  { initial: number; contribution: number; mu: number; sigma: number; years: number; paths?: number; seed?: number },
): WealthFan {
  const z = makeGaussian(seed);
  // Lognormal with E[1 + R] = 1 + μ and sd of log return s.
  const s = Math.sqrt(Math.log(1 + (sigma * sigma) / (1 + mu) ** 2));
  const m = Math.log(1 + mu) - 0.5 * s * s;
  const byYear: number[][] = Array.from({ length: years + 1 }, () => []);
  for (let p = 0; p < paths; p++) {
    let w = initial;
    byYear[0].push(w);
    for (let y = 1; y <= years; y++) {
      w = w * Math.exp(m + s * z()) + contribution;
      byYear[y].push(w);
    }
  }
  const q = (pp: number) => byYear.map((ws) => quantile(ws, pp));
  return { years: byYear.map((_, i) => i), p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95), finals: byYear[years] };
}

export const shortfallProbability = (finals: number[], goal: number) => finals.filter((w) => w < goal).length / finals.length;

export type RebalanceRule = 'never' | 'monthly' | 'annual' | 'threshold';

export interface RebalanceResult {
  wealth: number[];
  /** weight of asset 1 through time */
  weight1: number[];
  /** sum of |traded| / portfolio value, over the whole period */
  turnover: number;
  trades: number;
}

/**
 * Two-asset portfolio with target weight `target` in asset 1, given monthly
 * returns r1, r2. Rebalances by `rule` (threshold: when the weight drifts more than `band`).
 * `costBps` is charged on each trade's value.
 */
export function backtestRebalance(r1: number[], r2: number[], target: number, rule: RebalanceRule, band = 0.05, costBps = 0): RebalanceResult {
  let a = target;
  let b = 1 - target;
  const wealth = [1];
  const weight1 = [target];
  let turnover = 0;
  let trades = 0;
  for (let t = 0; t < r1.length; t++) {
    a *= 1 + r1[t];
    b *= 1 + r2[t];
    const v = a + b;
    const w = a / v;
    const due =
      rule === 'monthly' || (rule === 'annual' && (t + 1) % 12 === 0) || (rule === 'threshold' && Math.abs(w - target) > band);
    if (due && Math.abs(w - target) > 1e-12) {
      const traded = Math.abs(w - target) * v; // buy one leg, sell the other by the same amount
      const cost = (2 * traded * costBps) / 1e4;
      const v2 = v - cost;
      a = target * v2;
      b = (1 - target) * v2;
      turnover += (2 * traded) / v;
      trades++;
    }
    wealth.push(a + b);
    weight1.push(a / (a + b));
  }
  return { wealth, weight1, turnover, trades };
}

/** A simple target-date glide path: equity share falls linearly from `start` to `end` over the last `span` years. */
export function glidePath(yearsToRetirement: number, { start = 0.9, end = 0.3, span = 25 } = {}): number {
  if (yearsToRetirement >= span) return start;
  if (yearsToRetirement <= 0) return end;
  return end + ((start - end) * yearsToRetirement) / span;
}
