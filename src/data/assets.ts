/**
 * Illustrative capital market assumptions (CMAs) and simulated return histories.
 *
 * The expected returns, vols and correlations below are round numbers in the
 * range that large asset managers publish for long-run (10-year+) planning, from
 * the point of view of a euro investor. They are NOT forecasts and not live data.
 * Histories are simulated from these assumptions with a fixed seed, so every
 * reader sees the same "past" and tests are reproducible.
 */
import { cholesky } from '../models/math/linalg';
import { covFromCorr, type Mat } from '../models/math/matrix';
import { makeGaussian } from '../models/math/rng';

export interface AssetClass {
  id: string;
  name: string;
  short: string;
  /** expected annual (arithmetic) return */
  mu: number;
  /** annual volatility */
  vol: number;
  color: string;
}

export const assets: AssetClass[] = [
  { id: 'cash', name: 'Cash (money market)', short: 'Cash', mu: 0.025, vol: 0.005, color: '#9aa5b4' },
  { id: 'govt', name: 'Government bonds', short: 'Govt', mu: 0.032, vol: 0.055, color: '#1f6fb4' },
  { id: 'credit', name: 'Investment-grade credit', short: 'IG credit', mu: 0.04, vol: 0.065, color: '#5a9bd4' },
  { id: 'hy', name: 'High-yield credit', short: 'High yield', mu: 0.055, vol: 0.1, color: '#7a5bbf' },
  { id: 'equity', name: 'Developed-market equities', short: 'DM equity', mu: 0.07, vol: 0.16, color: '#c2453c' },
  { id: 'em', name: 'Emerging-market equities', short: 'EM equity', mu: 0.08, vol: 0.21, color: '#e08a1e' },
  { id: 'reit', name: 'Listed real estate', short: 'Real estate', mu: 0.06, vol: 0.17, color: '#2a9d6f' },
  { id: 'cmdty', name: 'Commodities', short: 'Commodities', mu: 0.045, vol: 0.18, color: '#8a6d3b' },
];

// prettier-ignore
export const correlations: Mat = [
  //  cash  govt credit  hy   eq    em   reit cmdty
  [1.00, 0.10, 0.05, 0.00, 0.00, 0.00, 0.00, 0.00],
  [0.10, 1.00, 0.70, 0.10, -0.10, -0.05, 0.10, -0.10],
  [0.05, 0.70, 1.00, 0.55, 0.30, 0.30, 0.35, 0.10],
  [0.00, 0.10, 0.55, 1.00, 0.65, 0.60, 0.55, 0.35],
  [0.00, -0.10, 0.30, 0.65, 1.00, 0.75, 0.65, 0.30],
  [0.00, -0.05, 0.30, 0.60, 0.75, 1.00, 0.55, 0.40],
  [0.00, 0.10, 0.35, 0.55, 0.65, 0.55, 1.00, 0.20],
  [0.00, -0.10, 0.10, 0.35, 0.30, 0.40, 0.20, 1.00],
];

export const RF = assets[0].mu;
export const assetIndex = (id: string) => assets.findIndex((a) => a.id === id);

/** Expected returns and covariance for a subset of asset ids. */
export function universe(ids: string[]) {
  const idx = ids.map(assetIndex);
  const sel = idx.map((i) => assets[i]);
  const corr = idx.map((i) => idx.map((j) => correlations[i][j]));
  return { assets: sel, mu: sel.map((a) => a.mu), vols: sel.map((a) => a.vol), corr, cov: covFromCorr(sel.map((a) => a.vol), corr) };
}

/** The risky assets used in most optimisation playgrounds (cash is the risk-free asset). */
export const riskyIds = ['govt', 'credit', 'hy', 'equity', 'em', 'reit', 'cmdty'];

/**
 * Simulated monthly returns for the given assets. With `fatTails` the draws are
 * multivariate Student-t (ν = 5), which gives crash months where everything
 * falls together, as in real markets. Variance is the same either way.
 */
export function simulateHistory(ids: string[], months: number, seed = 2024, fatTails = true): number[][] {
  const u = universe(ids);
  const L = cholesky(u.corr);
  const z = makeGaussian(seed);
  const nu = 5;
  const out: number[][] = ids.map(() => []);
  for (let t = 0; t < months; t++) {
    const e = ids.map(() => z());
    const corr = L.map((row) => row.reduce((s, l, k) => s + l * e[k], 0));
    let k = 1;
    if (fatTails) {
      let chi = 0;
      for (let i = 0; i < nu; i++) chi += z() ** 2;
      k = Math.sqrt(nu / chi) * Math.sqrt((nu - 2) / nu);
    }
    ids.forEach((_, i) => {
      out[i].push(u.mu[i] / 12 + (u.vols[i] / Math.sqrt(12)) * corr[i] * k);
    });
  }
  return out;
}

/** Simulated monthly factor returns (excess over cash): market, size, value, momentum. */
export function simulateFactors(months: number, seed = 11) {
  const z = makeGaussian(seed);
  const mkt: number[] = [], smb: number[] = [], hml: number[] = [], mom: number[] = [];
  for (let t = 0; t < months; t++) {
    const m = 0.0045 + 0.045 * z();
    mkt.push(m);
    smb.push(0.0015 + 0.15 * (m - 0.0045) + 0.028 * z());
    const h = 0.0025 - 0.1 * (m - 0.0045) + 0.028 * z();
    hml.push(h);
    mom.push(0.005 - 0.3 * (h - 0.0025) + 0.038 * z());
  }
  return { mkt, smb, hml, mom };
}

export interface FundSpec {
  id: string;
  name: string;
  story: string;
  alpha: number; // monthly
  beta: number;
  smb: number;
  hml: number;
  mom: number;
  resid: number; // monthly residual vol
}

/** Four funds with known (hidden) exposures. The lesson asks you to uncover them by regression. */
export const funds: FundSpec[] = [
  { id: 'closet', name: 'Fund A: "Active" Large Cap', story: 'Charges an active fee of 1.2% a year.', alpha: 0, beta: 1.0, smb: -0.05, hml: 0.02, mom: 0, resid: 0.004 },
  { id: 'value', name: 'Fund B: Deep Value', story: 'Markets itself on a strong record of beating the index.', alpha: 0, beta: 0.95, smb: 0.35, hml: 0.65, mom: -0.1, resid: 0.012 },
  { id: 'skill', name: 'Fund C: Concentrated Quality', story: 'A small team running 30 stocks.', alpha: 0.0025, beta: 0.85, smb: 0.05, hml: -0.1, mom: 0.05, resid: 0.02 },
  { id: 'trend', name: 'Fund D: Equity Long/Short', story: 'Hedge fund, "uncorrelated returns", 2-and-20 fees.', alpha: 0, beta: 0.3, smb: 0.1, hml: 0, mom: 0.7, resid: 0.012 },
];

/** Monthly excess returns of a fund built from the factors plus noise. */
export function fundReturns(f: FundSpec, factors: ReturnType<typeof simulateFactors>, seed = 99): number[] {
  const z = makeGaussian(seed + f.id.length * 31);
  return factors.mkt.map((m, t) => f.alpha + f.beta * m + f.smb * factors.smb[t] + f.hml * factors.hml[t] + f.mom * factors.mom[t] + f.resid * z());
}

export interface Scenario {
  id: string;
  name: string;
  note: string;
  /** shock per asset id, as a fraction (−0.4 = −40%) */
  shocks: Record<string, number>;
}

/**
 * Stress scenarios. Rounded, approximate peak-to-trough or calendar-year moves of
 * broad indices, for teaching only.
 */
export const scenarios: Scenario[] = [
  {
    id: 'gfc',
    name: '2008 global financial crisis',
    note: 'Credit crunch: equities and credit crash, government bonds rally (flight to quality).',
    shocks: { cash: 0.03, govt: 0.08, credit: -0.05, hy: -0.27, equity: -0.4, em: -0.5, reit: -0.45, cmdty: -0.35 },
  },
  {
    id: 'covid',
    name: 'Covid crash (Feb–Mar 2020)',
    note: 'Fast, deep and short. Bonds helped a little; everything else fell together.',
    shocks: { cash: 0, govt: 0.02, credit: -0.06, hy: -0.15, equity: -0.25, em: -0.27, reit: -0.3, cmdty: -0.25 },
  },
  {
    id: 'inflation',
    name: '2022 inflation shock',
    note: 'Rates rose fast. Stocks AND bonds fell; the 60/40 had one of its worst years. Commodities rallied.',
    shocks: { cash: 0, govt: -0.15, credit: -0.14, hy: -0.11, equity: -0.13, em: -0.15, reit: -0.25, cmdty: 0.2 },
  },
  {
    id: 'stagflation',
    name: 'Hypothetical: stagflation',
    note: 'A forward-looking scenario a risk team might design: growth falls and inflation stays high.',
    shocks: { cash: 0.01, govt: -0.08, credit: -0.1, hy: -0.18, equity: -0.25, em: -0.3, reit: -0.22, cmdty: 0.15 },
  },
];
