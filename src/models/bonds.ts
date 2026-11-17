/**
 * Bonds in a portfolio: price, duration, convexity and liability matching.
 * Annual compounding throughout, so every number can be checked by hand.
 */

/** Cash flows of a bullet bond: coupon each year, coupon + face at maturity. */
export function bondCashflows(coupon: number, years: number, face = 100): { t: number; cf: number }[] {
  return Array.from({ length: years }, (_, i) => ({ t: i + 1, cf: face * coupon + (i + 1 === years ? face : 0) }));
}

export function bondPrice(coupon: number, ytm: number, years: number, face = 100): number {
  return bondCashflows(coupon, years, face).reduce((s, { t, cf }) => s + cf / (1 + ytm) ** t, 0);
}

/** Macaulay duration: the PV-weighted average time to the cash flows, in years. */
export function macaulayDuration(coupon: number, ytm: number, years: number): number {
  const p = bondPrice(coupon, ytm, years);
  return bondCashflows(coupon, years).reduce((s, { t, cf }) => s + (t * cf) / (1 + ytm) ** t, 0) / p;
}

/** Modified duration: % price change for a 1.00 (100%) change in yield, i.e. −(1/P)·dP/dy. */
export const modifiedDuration = (coupon: number, ytm: number, years: number) => macaulayDuration(coupon, ytm, years) / (1 + ytm);

/** Convexity: (1/P)·d²P/dy². */
export function convexity(coupon: number, ytm: number, years: number): number {
  const p = bondPrice(coupon, ytm, years);
  return bondCashflows(coupon, years).reduce((s, { t, cf }) => s + (t * (t + 1) * cf) / (1 + ytm) ** (t + 2), 0) / p;
}

/** Second-order Taylor estimate of the % price change for a yield change dy. */
export const priceChangeApprox = (modDur: number, conv: number, dy: number) => -modDur * dy + 0.5 * conv * dy * dy;

/** DV01 (PV01): money change in value for a 1bp fall in yield. */
export const dv01 = (value: number, modDur: number) => value * modDur * 1e-4;

/**
 * A stylised pension fund: liabilities are one payment of `L` due in `liabilityYears`
 * (so their duration is liabilityYears). Assets are `assets` split into a
 * zero-coupon bond of maturity `bondYears` (share `bondShare`) and equities.
 * Returns the funding ratio after a parallel yield shift `dy` and an equity return `eq`.
 */
export function fundingRatio(
  p: { assets: number; L: number; liabilityYears: number; bondYears: number; bondShare: number; y: number },
  dy: number,
  eq = 0,
): number {
  const liab = p.L / (1 + p.y + dy) ** p.liabilityYears;
  const bondNow = p.assets * p.bondShare;
  const bond = bondNow * ((1 + p.y) / (1 + p.y + dy)) ** p.bondYears;
  const equity = p.assets * (1 - p.bondShare) * (1 + eq);
  return (bond + equity) / liab;
}

/** Interest-rate hedge ratio: asset DV01 divided by liability DV01. 100% = rates no longer move the surplus. */
export function hedgeRatio(p: { assets: number; L: number; liabilityYears: number; bondYears: number; bondShare: number; y: number }): number {
  const liabPv = p.L / (1 + p.y) ** p.liabilityYears;
  const assetDv01 = (p.assets * p.bondShare * p.bondYears) / (1 + p.y);
  const liabDv01 = (liabPv * p.liabilityYears) / (1 + p.y);
  return assetDv01 / liabDv01;
}
