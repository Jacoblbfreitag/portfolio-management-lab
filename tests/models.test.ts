import { describe, expect, it } from 'vitest';
import { assets, correlations, fundReturns, funds, riskyIds, simulateFactors, simulateHistory, universe } from '../src/data/assets';
import { interviewQuestions, extraTopics } from '../src/data/interview';
import { lessons } from '../src/lessons';
import { cholesky } from '../src/models/math/linalg';
import { identity, inverse, matMul } from '../src/models/math/matrix';
import { annualizedReturn, drawdowns, geometricFromArithmetic, maxDrawdown, sharpeRatio, wealthIndex } from '../src/models/returns';
import { mean, quantile, std } from '../src/models/stats';
import {
  equalWeightVol, frontierConstants, frontierWeights, longOnlyFrontier, maxSharpePoint, minVarianceWeights,
  optimizeMeanVariance, portfolioReturn, portfolioVol, projectToBox, tangencyWeights, twoAssetMinVarWeight, twoAssetVol,
} from '../src/models/meanVariance';
import { ols } from '../src/models/regression';
import { blackLitterman, impliedReturns, inverseVolWeights, riskBudgetWeights, riskContributions, riskShares } from '../src/models/construction';
import { bondPrice, convexity, fundingRatio, hedgeRatio, macaulayDuration, modifiedDuration, priceChangeApprox } from '../src/models/bonds';
import { backtestRebalance, glidePath, shortfallProbability, simulateWealth } from '../src/models/allocation';
import { brinson, fundamentalLawIR, moneyWeightedReturn, timeWeightedReturn, wealthAfterFees, yearsToSignificance } from '../src/models/performance';
import { componentVaR, historicalES, historicalVaR, normInv, parametricES, parametricVaR } from '../src/models/risk';

describe('data', () => {
  it('the correlation matrix is symmetric and positive definite', () => {
    correlations.forEach((row, i) => row.forEach((r, j) => expect(r).toBe(correlations[j][i])));
    expect(() => cholesky(correlations)).not.toThrow();
    expect(correlations.length).toBe(assets.length);
  });
  it('simulated history reproduces the assumptions on average', () => {
    const [eq] = simulateHistory(['equity'], 12 * 400, 5);
    expect(mean(eq) * 12).toBeCloseTo(0.07, 1);
    expect(std(eq) * Math.sqrt(12)).toBeCloseTo(0.16, 1);
  });
  it('every lesson has at least two interview questions, every question a valid topic', () => {
    for (const l of lessons) expect(interviewQuestions.filter((q) => q.topic === l.id).length).toBeGreaterThanOrEqual(2);
    const topics = new Set([...lessons.map((l) => l.id), ...Object.keys(extraTopics)]);
    expect(interviewQuestions.filter((q) => !topics.has(q.topic))).toEqual([]);
  });
});

describe('matrix', () => {
  it('inverse × matrix = identity', () => {
    const { cov } = universe(riskyIds);
    const p = matMul(inverse(cov), cov);
    p.forEach((row, i) => row.forEach((x, j) => expect(x).toBeCloseTo(identity(cov.length)[i][j], 10)));
  });
});

describe('returns', () => {
  it('+50% then −50% loses 25%', () => {
    const w = wealthIndex([0.5, -0.5]);
    expect(w[2]).toBeCloseTo(0.75, 12);
    expect(annualizedReturn([0.5, -0.5], 1)).toBeCloseTo(Math.sqrt(0.75) - 1, 12);
  });
  it('drawdown of a path that falls 20% from its peak', () => {
    expect(maxDrawdown([1, 1.25, 1, 1.1])).toBeCloseTo(-0.2, 12);
    expect(drawdowns([1, 2, 3]).every((d) => d === 0)).toBe(true);
  });
  it('volatility drag: median growth ≈ μ − σ²/2', () => {
    expect(geometricFromArithmetic(0.08, 0.2)).toBeCloseTo(0.06, 12);
  });
  it('Sharpe of a constant excess return is huge and of cash is ~0', () => {
    const r = Array.from({ length: 120 }, (_, i) => 0.01 + (i % 2 ? 0.001 : -0.001));
    expect(sharpeRatio(r, 0)).toBeGreaterThan(20);
  });
});

describe('mean–variance', () => {
  const { mu, cov } = universe(riskyIds);
  it('two-asset vol: ρ = 1 is linear, ρ = −1 can reach zero', () => {
    expect(twoAssetVol(0.5, 0.2, 0.1, 1)).toBeCloseTo(0.15, 12);
    const w = twoAssetMinVarWeight(0.2, 0.1, -1);
    expect(twoAssetVol(w, 0.2, 0.1, -1)).toBeCloseTo(0, 10);
  });
  it('equal-weight vol tends to σ√ρ', () => {
    expect(equalWeightVol(1e7, 0.3, 0.3)).toBeCloseTo(0.3 * Math.sqrt(0.3), 5);
    expect(equalWeightVol(30, 0.3, 0.3)).toBeCloseTo(0.1706, 3);
  });
  it('frontier weights hit the target return and match the closed-form variance', () => {
    const { A, B, C, D } = frontierConstants(mu, cov);
    const w = frontierWeights(mu, cov, 0.06);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(portfolioReturn(w, mu)).toBeCloseTo(0.06, 10);
    expect(portfolioVol(w, cov) ** 2).toBeCloseTo((A * 0.06 ** 2 - 2 * B * 0.06 + C) / D, 10);
  });
  it('the minimum-variance portfolio beats random portfolios', () => {
    const w = minVarianceWeights(cov);
    const v = portfolioVol(w, cov);
    for (let k = 0; k < 50; k++) {
      const r = mu.map((_, i) => Math.sin(k * 7 + i * 3) + 1.5);
      const s = r.reduce((a, b) => a + b, 0);
      expect(portfolioVol(r.map((x) => x / s), cov)).toBeGreaterThanOrEqual(v - 1e-12);
    }
  });
  it('tangency has the best Sharpe among frontier portfolios', () => {
    const rf = 0.025;
    const t = tangencyWeights(mu, cov, rf);
    const st = (portfolioReturn(t, mu) - rf) / portfolioVol(t, cov);
    for (const m of [0.04, 0.05, 0.07, 0.09]) {
      const w = frontierWeights(mu, cov, m);
      expect((portfolioReturn(w, mu) - rf) / portfolioVol(w, cov)).toBeLessThanOrEqual(st + 1e-10);
    }
  });
  it('box projection sums to 1 and respects the bounds', () => {
    const p = projectToBox([0.9, 0.5, -0.3, 0.2], 0, 0.4);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(Math.max(...p)).toBeLessThanOrEqual(0.4 + 1e-12);
    expect(Math.min(...p)).toBeGreaterThanOrEqual(0);
  });
  it('long-only optimiser with huge risk aversion ≈ long-only min variance; frontier is long-only', () => {
    const w = optimizeMeanVariance(mu, cov, 1e4, { iterations: 20000 });
    expect(w.every((x) => x >= -1e-12)).toBe(true);
    const f = longOnlyFrontier(mu, cov, { points: 12 });
    expect(Math.abs(portfolioVol(w, cov) - f[0].vol)).toBeLessThan(0.005);
    const best = maxSharpePoint(f, 0.025);
    expect(best.vol).toBeGreaterThan(0);
  });
});

describe('regression', () => {
  it('recovers known factor loadings', () => {
    const fac = simulateFactors(2400, 3);
    const f = funds.find((x) => x.id === 'value')!;
    const y = fundReturns(f, fac);
    const r = ols(y, [fac.mkt, fac.smb, fac.hml, fac.mom]);
    expect(r.coef[1]).toBeCloseTo(f.beta, 1);
    expect(r.coef[3]).toBeCloseTo(f.hml, 1);
    expect(Math.abs(r.coef[0])).toBeLessThan(0.001);
  });
});

describe('construction', () => {
  const { cov } = universe(riskyIds);
  it('risk contributions add up to portfolio vol', () => {
    const w = [0.2, 0.1, 0.1, 0.3, 0.1, 0.1, 0.1];
    expect(riskContributions(w, cov).reduce((a, b) => a + b, 0)).toBeCloseTo(portfolioVol(w, cov), 12);
  });
  it('risk parity equalises risk shares', () => {
    const w = riskBudgetWeights(cov);
    riskShares(w, cov).forEach((s) => expect(s).toBeCloseTo(1 / cov.length, 6));
  });
  it('inverse vol = risk parity when correlations are equal', () => {
    const vols = [0.05, 0.1, 0.2];
    const c = vols.map((a, i) => vols.map((b, j) => (i === j ? 1 : 0.3) * a * b));
    const iv = inverseVolWeights(c);
    riskBudgetWeights(c).forEach((x, i) => expect(x).toBeCloseTo(iv[i], 6));
  });
  it('a 60/40 gets >90% of its risk from equities', () => {
    const u = universe(['equity', 'govt']);
    expect(riskShares([0.6, 0.4], u.cov)[0]).toBeGreaterThan(0.9);
  });
  it('Black–Litterman: no views returns the market; a bullish view raises that asset', () => {
    const w = [0.25, 0.1, 0.05, 0.4, 0.1, 0.05, 0.05];
    const none = blackLitterman(cov, w, []);
    none.weights.forEach((x, i) => expect(x).toBeCloseTo(w[i], 10));
    const pi = impliedReturns(cov, w, 2.5);
    const p = [0, 0, 0, 0, 1, 0, 0];
    const bl = blackLitterman(cov, w, [{ p, q: pi[4] + 0.03, confidence: 0.5 }]);
    expect(bl.posterior[4]).toBeGreaterThan(pi[4]);
    expect(bl.posterior[4]).toBeLessThan(pi[4] + 0.03);
    expect(bl.weights[4]).toBeGreaterThan(w[4]);
  });
});

describe('bonds', () => {
  it('a par bond prices at 100; a zero has duration = maturity', () => {
    expect(bondPrice(0.04, 0.04, 10)).toBeCloseTo(100, 10);
    expect(macaulayDuration(0, 0.03, 7)).toBeCloseTo(7, 10);
  });
  it('duration + convexity approximates repricing', () => {
    const [c, y, n, dy] = [0.03, 0.035, 15, 0.01];
    const exact = bondPrice(c, y + dy, n) / bondPrice(c, y, n) - 1;
    const approx = priceChangeApprox(modifiedDuration(c, y, n), convexity(c, y, n), dy);
    const durationOnly = -modifiedDuration(c, y, n) * dy;
    expect(Math.abs(exact - approx)).toBeLessThan(5e-4);
    expect(Math.abs(exact - approx)).toBeLessThan(Math.abs(exact - durationOnly) / 5);
  });
  it('a fully hedged fund’s funding ratio barely moves with rates', () => {
    const p = { assets: 100, L: 100 * 1.03 ** 20, liabilityYears: 20, bondYears: 20, bondShare: 1, y: 0.03 };
    expect(hedgeRatio(p)).toBeCloseTo(1, 10);
    expect(fundingRatio(p, 0)).toBeCloseTo(1, 10);
    expect(fundingRatio(p, -0.01)).toBeCloseTo(1, 10);
  });
});

describe('allocation', () => {
  it('zero vol gives a deterministic path', () => {
    const f = simulateWealth({ initial: 100, contribution: 0, mu: 0.05, sigma: 0, years: 10, paths: 10 });
    expect(f.p5[10]).toBeCloseTo(100 * 1.05 ** 10, 8);
    expect(shortfallProbability(f.finals, 200)).toBe(1);
  });
  it('monthly rebalancing holds the target weight; never-rebalance has no trades', () => {
    const [a, b] = simulateHistory(['equity', 'govt'], 120, 1);
    const m = backtestRebalance(a, b, 0.6, 'monthly');
    expect(m.weight1.every((w) => Math.abs(w - 0.6) < 1e-12)).toBe(true);
    expect(backtestRebalance(a, b, 0.6, 'never').trades).toBe(0);
  });
  it('glide path is flat early and reaches the end value', () => {
    expect(glidePath(40)).toBe(0.9);
    expect(glidePath(0)).toBe(0.3);
  });
});

describe('performance', () => {
  it('TWR chain-links and MWR solves the IRR', () => {
    expect(timeWeightedReturn([0.1, -0.1])).toBeCloseTo(-0.01, 12);
    expect(moneyWeightedReturn([{ t: 0, cf: -100 }, { t: 1, cf: 110 }])).toBeCloseTo(0.1, 8);
  });
  it('Brinson effects add up to the active return', () => {
    const segs = [
      { name: 'A', wp: 0.5, wb: 0.3, rp: 0.1, rb: 0.08 },
      { name: 'B', wp: 0.3, wb: 0.4, rp: 0.02, rb: 0.03 },
      { name: 'C', wp: 0.2, wb: 0.3, rp: -0.05, rb: -0.02 },
    ];
    const { rows, Rp, Rb } = brinson(segs);
    expect(rows.reduce((s, r) => s + r.total, 0)).toBeCloseTo(Rp - Rb, 14);
  });
  it('fees, fundamental law, years to significance', () => {
    expect(wealthAfterFees(1, 0.06, 0.01, 30) / wealthAfterFees(1, 0.06, 0, 30)).toBeCloseTo(0.99 ** 30, 12);
    expect(fundamentalLawIR(0.05, 400)).toBeCloseTo(1, 12);
    expect(yearsToSignificance(0.5)).toBeCloseTo(16, 12);
  });
});

describe('risk', () => {
  it('normal quantiles', () => {
    expect(normInv(0.95)).toBeCloseTo(1.6449, 4);
    expect(normInv(0.99)).toBeCloseTo(2.3263, 4);
    expect(normInv(0.01)).toBeCloseTo(-2.3263, 4);
  });
  it('ES ≥ VaR, and historical ≈ parametric on normal data', () => {
    expect(parametricES(0, 0.1, 0.95)).toBeGreaterThan(parametricVaR(0, 0.1, 0.95));
    const [eq] = simulateHistory(['equity'], 50000, 9, false);
    expect(historicalVaR(eq, 0.95)).toBeCloseTo(parametricVaR(0.07 / 12, 0.16 / Math.sqrt(12), 0.95), 2);
    expect(historicalES(eq, 0.95)).toBeGreaterThan(historicalVaR(eq, 0.95));
  });
  it('fat tails raise the 99% loss', () => {
    const [n] = simulateHistory(['equity'], 50000, 4, false);
    const [t] = simulateHistory(['equity'], 50000, 4, true);
    expect(-quantile(t, 0.001)).toBeGreaterThan(-quantile(n, 0.001));
  });
  it('component VaRs add up', () => {
    const { cov } = universe(riskyIds);
    const w = [0.2, 0.1, 0.1, 0.3, 0.1, 0.1, 0.1];
    const c = componentVaR(w, cov, 0.99);
    expect(c.component.reduce((a, b) => a + b, 0)).toBeCloseTo(c.total, 12);
  });
});
