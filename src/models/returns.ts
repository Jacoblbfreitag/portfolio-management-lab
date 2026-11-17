/**
 * Measuring return and risk: the numbers on every factsheet and in every interview.
 * All functions take *periodic* simple returns (e.g. monthly 0.012 = +1.2%) and a
 * `periodsPerYear` (12 for monthly) to annualise.
 */
import { mean, std } from './stats';

export const simpleToLog = (r: number) => Math.log(1 + r);
export const logToSimple = (g: number) => Math.exp(g) - 1;

/** Wealth index: value of 1 invested at the start, after each period. Starts with 1. */
export function wealthIndex(returns: number[], start = 1): number[] {
  const out = [start];
  for (const r of returns) out.push(out[out.length - 1] * (1 + r));
  return out;
}

/** Geometric (compound) annual growth rate: what you actually earned per year. */
export function annualizedReturn(returns: number[], periodsPerYear = 12): number {
  const growth = returns.reduce((g, r) => g * (1 + r), 1);
  return growth ** (periodsPerYear / returns.length) - 1;
}

/** Arithmetic mean return, annualised by simple scaling. */
export const arithmeticAnnual = (returns: number[], periodsPerYear = 12) => mean(returns) * periodsPerYear;

/** Volatility scales with the square root of time (if returns are independent). */
export const annualizedVol = (returns: number[], periodsPerYear = 12) => std(returns) * Math.sqrt(periodsPerYear);

/** Sharpe ratio: excess return per unit of total risk. `rf` is an annual rate. */
export function sharpeRatio(returns: number[], rf = 0, periodsPerYear = 12): number {
  const excess = returns.map((r) => r - rf / periodsPerYear);
  return (mean(excess) * periodsPerYear) / (std(excess) * Math.sqrt(periodsPerYear));
}

/** Sortino ratio: like Sharpe, but only downside deviation (below the target) counts as risk. */
export function sortinoRatio(returns: number[], target = 0, periodsPerYear = 12): number {
  const t = target / periodsPerYear;
  const downside = Math.sqrt(returns.reduce((s, r) => s + Math.min(r - t, 0) ** 2, 0) / returns.length);
  return ((mean(returns) - t) * periodsPerYear) / (downside * Math.sqrt(periodsPerYear));
}

/** Drawdown at each point: how far below its previous peak the wealth index is (≤ 0). */
export function drawdowns(wealth: number[]): number[] {
  let peak = -Infinity;
  return wealth.map((w) => {
    peak = Math.max(peak, w);
    return w / peak - 1;
  });
}
export const maxDrawdown = (wealth: number[]) => Math.min(...drawdowns(wealth));

/** Calmar ratio: annual return divided by the size of the worst drawdown. */
export const calmarRatio = (returns: number[], periodsPerYear = 12) =>
  annualizedReturn(returns, periodsPerYear) / Math.abs(maxDrawdown(wealthIndex(returns)));

/**
 * Volatility drag: with lognormal returns the median (geometric) growth rate
 * is about the arithmetic mean minus half the variance.
 */
export const geometricFromArithmetic = (mu: number, sigma: number) => mu - 0.5 * sigma * sigma;

/** Simple returns from a price series. */
export const returnsFromPrices = (prices: number[]) => prices.slice(1).map((p, i) => p / prices[i] - 1);
