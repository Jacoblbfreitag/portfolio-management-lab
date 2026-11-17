/**
 * Interview question bank. Each lesson shows its own questions in an
 * "Interview corner"; the Career page shows all of them with filters.
 *   topic: a lesson id from src/lessons.ts, or 'behavioural' / 'markets'
 *   level: 'core' = expect it in a first-round interview, 'stretch' = later rounds or quant roles
 *   a:     a model answer: what a good candidate would say, in about 30–60 seconds
 */
export interface InterviewQuestion {
  topic: string;
  level: 'core' | 'stretch';
  q: string;
  a: string;
}

export const extraTopics: Record<string, string> = {
  behavioural: 'Behavioural & fit',
  markets: 'Markets & your views',
};

export const interviewQuestions: InterviewQuestion[] = [
  // ── Basics ──
  {
    topic: 'basics',
    level: 'core',
    q: 'What is the difference between the buy side and the sell side?',
    a: 'The buy side invests money: asset managers, pension funds, insurers, hedge funds, sovereign funds. It earns from fees or investment returns. The sell side (investment banks, brokers) sells services to the buy side: research, trading, underwriting, market making. A buy-side analyst’s recommendation is acted on with real money and judged on performance; a sell-side analyst publishes research for clients.',
  },
  {
    topic: 'basics',
    level: 'core',
    q: 'Walk me through the investment process.',
    a: 'Start with the client: objectives, risk tolerance, horizon, liquidity needs and constraints, written down in an investment policy statement. From that comes the strategic asset allocation (the long-run mix). Then portfolio construction: picking managers or securities and sizing them within risk limits. Then implementation: trading efficiently. Then monitoring and rebalancing, and finally performance measurement and attribution, which feeds back into the next decision.',
  },
  {
    topic: 'basics',
    level: 'core',
    q: 'Why do you want to work in asset management rather than investment banking?',
    a: 'Tie it to something real about you: you like forming a view and living with the outcome, the feedback loop is the market rather than a deal closing, the horizon is long, and the work is research-heavy. Mention something concrete you have done (a thesis, a personal portfolio you track, a competition). Avoid saying it is “better hours” as your main reason.',
  },
  {
    topic: 'basics',
    level: 'stretch',
    q: 'How does an asset manager make money, and what drives its profitability?',
    a: 'Revenue ≈ assets under management × fee rate, plus performance fees for some products. So revenue rises with markets and with net inflows. Costs are mostly people and technology, largely fixed, so margins expand in bull markets and compress in bear markets. Structural pressure comes from the shift to low-fee passive products, which pushes managers toward scale, alternatives or solutions businesses.',
  },
  // ── Returns ──
  {
    topic: 'returns',
    level: 'core',
    q: 'A fund returns +50% one year and −50% the next. What is its average return?',
    a: 'The arithmetic average is 0%, but the investor lost money: 1 × 1.5 × 0.5 = 0.75, a 25% loss. The geometric (compound) average is √0.75 − 1 ≈ −13.4% a year. The gap is volatility drag: roughly geometric ≈ arithmetic − σ²/2. Always quote the geometric return for what an investor actually earned.',
  },
  {
    topic: 'returns',
    level: 'core',
    q: 'What is the Sharpe ratio and what are its weaknesses?',
    a: 'Excess return over the risk-free rate divided by volatility: return per unit of total risk. Weaknesses: it treats upside and downside volatility the same, assumes returns are roughly normal (it flatters strategies that sell tail risk, like short options), can be inflated by smoothed or illiquid prices, and depends on the measurement period. Complement it with drawdown, Sortino and skew.',
  },
  {
    topic: 'returns',
    level: 'core',
    q: 'How do you annualise a monthly volatility of 4%?',
    a: 'Multiply by the square root of 12: 4% × 3.46 ≈ 13.9%. This assumes monthly returns are independent. If returns are positively autocorrelated (common for illiquid assets with smoothed prices), the true annual vol is higher than this scaling suggests.',
  },
  {
    topic: 'returns',
    level: 'stretch',
    q: 'Why might private equity or real estate funds report a high Sharpe ratio?',
    a: 'Their valuations are appraisal-based and updated infrequently, so reported returns are smoothed. Smoothing lowers measured volatility and correlation with public markets, inflating the Sharpe ratio and making them look like great diversifiers. Unsmoothing techniques (e.g. Getmansky–Lo–Makarov) typically raise the vol substantially.',
  },
  // ── Diversification ──
  {
    topic: 'diversification',
    level: 'core',
    q: 'Why does diversification work, and when does it fail?',
    a: 'Portfolio variance depends on covariances, not just individual variances. When assets are less than perfectly correlated, their idiosyncratic moves partly cancel, so the portfolio is less risky than the weighted average of its parts. It fails when correlations jump towards one in a crisis, which is exactly when you need it, and it cannot remove systematic (market) risk.',
  },
  {
    topic: 'diversification',
    level: 'core',
    q: 'What is the efficient frontier?',
    a: 'The set of portfolios that offer the highest expected return for each level of risk (or lowest risk for each return). Anything below it is inefficient: you can get more return for the same risk. With a risk-free asset, the best risky portfolio is the tangency portfolio, and every investor should hold a mix of it and cash along the capital market line: two-fund separation.',
  },
  {
    topic: 'diversification',
    level: 'stretch',
    q: 'With 30 stocks each of vol 30% and pairwise correlation 0.3, what is the vol of an equal-weighted portfolio?',
    a: 'σ_p = σ·√(1/n + (1 − 1/n)ρ) = 30% × √(1/30 + 29/30 × 0.3) = 30% × √(0.0333 + 0.29) ≈ 30% × 0.569 ≈ 17.1%. As n grows, it approaches 30% × √0.3 ≈ 16.4%: the systematic floor that diversification cannot remove.',
  },
  // ── CAPM ──
  {
    topic: 'capm',
    level: 'core',
    q: 'What is beta, and how do you estimate it?',
    a: 'Beta measures sensitivity to the market: β = Cov(R_i, R_m)/Var(R_m). A beta of 1.2 means the asset moves on average 1.2% when the market moves 1%. Estimate it by regressing the asset’s excess returns on the market’s, typically using 2–5 years of monthly or weekly data. Choices that matter: the index, the frequency, the window, and whether to shrink towards 1 (Blume adjustment).',
  },
  {
    topic: 'capm',
    level: 'core',
    q: 'A fund beat its benchmark by 3% a year. Is the manager skilled?',
    a: 'Not necessarily. First adjust for risk: if its beta is above 1 in a rising market, much of the outperformance is leverage. Then check factor exposures: a small-cap or value tilt can explain “alpha” that is just a known premium you could buy cheaply. Then statistical significance: with a tracking error of 6%, an IR of 0.5 needs about 16 years to be significant at t = 2. Finally look at the process: is it repeatable?',
  },
  {
    topic: 'capm',
    level: 'stretch',
    q: 'What are the Fama–French factors and why do they matter for a PM?',
    a: 'Market, size (SMB: small minus big), and value (HML: high minus low book-to-market), later extended with profitability and investment, and often momentum. They matter because they are the benchmark for skill: a manager whose returns are fully explained by factor loadings is delivering beta that can be bought cheaply in factor ETFs. They are also tools: many quant and smart-beta products harvest them deliberately.',
  },
  // ── Construction ──
  {
    topic: 'construction',
    level: 'core',
    q: 'Why do practitioners rarely use the unconstrained Markowitz optimiser?',
    a: 'It is extremely sensitive to expected-return inputs, which are estimated with huge error. It overweights assets whose returns are overestimated and whose risks are underestimated: an “error maximiser”. Outputs are concentrated, unstable and full of extreme long and short positions. Practitioners add constraints, shrink inputs (towards equilibrium returns, e.g. Black–Litterman), use risk-based methods (minimum variance, risk parity), or resample.',
  },
  {
    topic: 'construction',
    level: 'core',
    q: 'What is risk parity?',
    a: 'An allocation where each asset (or asset class) contributes the same amount to total portfolio risk. Because bonds are much less volatile than equities, a risk-parity portfolio holds a lot of bonds and is often levered to reach a target return. Its appeal: no return forecasts needed, and better balance across economic regimes than a 60/40, whose risk is roughly 90% equity. Its weakness: it suffers when bonds and equities fall together, as in 2022.',
  },
  {
    topic: 'construction',
    level: 'stretch',
    q: 'Explain Black–Litterman in two minutes.',
    a: 'Start from equilibrium: back out the expected returns that make the market-cap portfolio optimal, Π = δΣw_mkt. These are a sensible neutral prior. Then express views (absolute or relative, e.g. “EM beats DM by 2%”) with a confidence for each. Black–Litterman combines prior and views in a Bayesian way, weighting each by its uncertainty. The result is a set of expected returns that produce intuitive portfolios: the market portfolio, tilted towards your views in proportion to your confidence.',
  },
  // ── Bonds ──
  {
    topic: 'bonds',
    level: 'core',
    q: 'What is duration? If a bond has a modified duration of 7 and yields rise 50bp, what happens?',
    a: 'Duration measures a bond’s price sensitivity to yield changes; Macaulay duration is also the PV-weighted average time to cash flows. With modified duration 7, a 0.5% rise in yields lowers the price by about 7 × 0.5% = 3.5%. Convexity makes the actual fall slightly smaller than that (and a rally slightly bigger).',
  },
  {
    topic: 'bonds',
    level: 'core',
    q: 'Why would a pension fund buy long-dated bonds when yields are low?',
    a: 'Because its risk is relative to its liabilities, not absolute. Pension liabilities are long-dated and their present value rises when rates fall. Long bonds (or swaps) rise in value at the same time, hedging the funding ratio. Holding cash or short bonds might look safer in absolute terms but leaves the fund exposed to falling rates. This is liability-driven investing (LDI).',
  },
  {
    topic: 'bonds',
    level: 'stretch',
    q: 'What went wrong for UK LDI funds in 2022?',
    a: 'Many UK pension schemes hedged rates with leveraged LDI funds using gilts, repo and swaps. When gilt yields jumped very fast after the September 2022 mini-budget, collateral calls on those leveraged positions came faster than schemes could raise cash. Forced gilt sales pushed yields higher still, a feedback loop the Bank of England stopped with emergency purchases. The hedge was economically sound; the problem was leverage and liquidity management.',
  },
  // ── Allocation ──
  {
    topic: 'allocation',
    level: 'core',
    q: 'What is the difference between strategic and tactical asset allocation?',
    a: 'Strategic asset allocation (SAA) is the long-run policy mix, set from the client’s objectives and long-run capital market assumptions, usually reviewed every few years by an investment committee. It explains most of the variation in a diversified fund’s returns over time. Tactical asset allocation (TAA) is a deliberate, temporary deviation from the SAA, within limits, to exploit shorter-term views, measured against the SAA as a benchmark.',
  },
  {
    topic: 'allocation',
    level: 'core',
    q: 'Why rebalance a portfolio?',
    a: 'To keep its risk where the client chose it. Without rebalancing, the asset that rose most takes over and a 60/40 drifts to 75/25 equities in a long bull market, with much more risk than agreed. Rebalancing is also mildly contrarian (sell high, buy low), which helps in mean-reverting markets. The cost is trading and taxes, so many funds use bands (e.g. rebalance when a weight drifts ±5%) rather than a fixed calendar.',
  },
  {
    topic: 'allocation',
    level: 'stretch',
    q: 'A 30-year-old and a 60-year-old have the same risk aversion. Why might they hold different portfolios?',
    a: 'Because of human capital. The 30-year-old’s future salary is a large, bond-like asset, so their total wealth is already bond-heavy and their financial portfolio can hold more equities. As they age, human capital shrinks and the financial portfolio should de-risk: the logic behind target-date glide paths. Exceptions: someone whose income is equity-like (a banker paid in bonuses) should hold less equity.',
  },
  // ── Performance ──
  {
    topic: 'performance',
    level: 'core',
    q: 'Time-weighted vs money-weighted return: what is the difference and which do you use to judge a manager?',
    a: 'TWR chain-links returns between cash flows, so it removes the effect of when the client added or withdrew money. MWR is the IRR of the actual cash flows, so it reflects the investor’s own timing. Judge a manager with TWR, since they do not control client flows. MWR is right for the investor’s own experience, and for private equity, where the manager does control when capital is called.',
  },
  {
    topic: 'performance',
    level: 'core',
    q: 'What is tracking error and what is the information ratio?',
    a: 'Tracking error is the standard deviation of the difference between portfolio and benchmark returns: how much active risk the manager takes. The information ratio is active return divided by tracking error: active return per unit of active risk. An IR of 0.5 sustained over many years is very good; most active managers are near zero after fees.',
  },
  {
    topic: 'performance',
    level: 'stretch',
    q: 'Explain Brinson attribution.',
    a: 'It splits a portfolio’s active return into the effect of sector (or country, or asset class) weights and the effect of security choices within sectors. Allocation = (w_p − w_b)(r_b,sector − R_b): reward for overweighting segments that beat the benchmark. Selection = w_b(r_p,sector − r_b,sector): reward for picking better stocks in each segment. Interaction is the rest. The three add up exactly to the active return.',
  },
  // ── Risk ──
  {
    topic: 'risk',
    level: 'core',
    q: 'What is Value-at-Risk, and what are its limitations?',
    a: 'VaR at 95% over one month is the loss that is exceeded with only 5% probability. It is a single, comparable number. Limitations: it says nothing about how big losses are beyond that point; normal VaR underestimates fat tails; it relies on historical correlations that break in crises; and it is not subadditive in general, so it can penalise diversification. Expected shortfall (the average loss beyond VaR) and stress tests address these.',
  },
  {
    topic: 'risk',
    level: 'core',
    q: 'A 60/40 portfolio: what share of its risk comes from equities?',
    a: 'Around 90%, not 60%. Equities are about three times as volatile as bonds and the two are roughly uncorrelated, so the equity sleeve dominates the variance. With 16% and 5.5% vol and correlation −0.1, the equity risk contribution is above 90%. This is the main argument for risk-based allocation.',
  },
  {
    topic: 'risk',
    level: 'stretch',
    q: 'How would you design a stress test for a multi-asset portfolio?',
    a: 'Combine historical scenarios (2008, Covid 2020, 2022 rates shock), which are plausible by construction, with hypothetical forward-looking ones built around today’s vulnerabilities (stagflation, a sharp rise in credit spreads, a currency crisis). Translate each into shocks for the risk factors the portfolio is exposed to, revalue, and look at the loss, liquidity needs (margin calls, redemptions) and limit breaches. The point is the conversation it starts: what would we do?',
  },
  // ── Active ──
  {
    topic: 'active',
    level: 'core',
    q: 'Why do most active managers underperform their benchmark?',
    a: 'Sharpe’s arithmetic of active management: before costs, the average active dollar must earn the market return, because active and passive together hold the market. After fees and trading costs, the average active dollar must underperform. On top of that, the benchmark is costless and survivorship hides closed funds. Skilled managers exist, but they must beat other professionals, not the market.',
  },
  {
    topic: 'active',
    level: 'core',
    q: 'What does a 1% annual fee cost an investor over 30 years?',
    a: 'With a 6% gross return, wealth grows by 1.06³⁰ ≈ 5.74 without fees and by (1.06 × 0.99)³⁰ ≈ 4.25 with a 1% fee: about 26% less wealth at the end. The fee takes roughly a quarter of the final pot, not 1%.',
  },
  {
    topic: 'active',
    level: 'stretch',
    q: 'State the fundamental law of active management.',
    a: 'Grinold: IR ≈ IC × √breadth. IC (information coefficient) is the correlation between your forecasts and outcomes; breadth is the number of independent bets per year. A stock picker making 20 bets a year needs a high IC; a quant making 1,000 small independent bets can reach a good IR with IC = 0.03. The catch is “independent”: bets that share a factor exposure count much less.',
  },
  // ── Career ──
  {
    topic: 'career',
    level: 'core',
    q: 'Pitch me a stock.',
    a: 'Structure: (1) the recommendation and target in one sentence, (2) what the company does and how it makes money, (3) your thesis: two or three reasons the market is wrong, (4) valuation versus peers and history, (5) catalysts that will make the market see it, (6) key risks and what would make you change your mind. Keep it to two to three minutes and be ready for follow-ups on every number.',
  },
  {
    topic: 'career',
    level: 'core',
    q: 'How would you invest €1 million for a 45-year-old client?',
    a: 'Do not jump to an allocation. Ask first: their goals and horizon, income stability, other assets (pension, property), liquidity needs, tax situation, risk tolerance and capacity, and any ethical preferences. Then propose a diversified strategic allocation consistent with that (for example a 60–70% equity global portfolio with bonds for stability), implemented mainly with low-cost funds, rebalancing rules, and a review schedule. Show you think in terms of the client, not the product.',
  },
  {
    topic: 'career',
    level: 'stretch',
    q: 'Tell me about a portfolio or investment idea you got wrong.',
    a: 'They are testing self-awareness and process. Pick a real example, explain your original thesis, what happened, and specifically what you misjudged (a variable you ignored, sizing, holding too long). End with what you changed in your process. Never pick an example where the lesson is “the market was irrational”.',
  },
  // ── Markets ──
  {
    topic: 'markets',
    level: 'core',
    q: 'What is happening in markets right now that matters for a multi-asset portfolio?',
    a: 'Have a two-minute view ready, refreshed every week before interviews: central bank policy and the path of rates, inflation, the equity market’s valuation and leadership, credit spreads, the dollar/euro, and one or two themes. Give numbers (where is the 10-year yield, roughly?), state a view, and say what would change it. Read the FT, a central bank statement and one asset manager’s outlook.',
  },
  {
    topic: 'markets',
    level: 'core',
    q: 'Where do you think the 10-year government bond yield will be in a year, and why?',
    a: 'They do not expect a correct forecast; they want a framework. A yield is expected short rates over the horizon plus a term premium. So talk about the path of the policy rate (inflation versus target, growth, the labour market), what the market already prices, and what drives the term premium (supply of bonds, inflation uncertainty). Then commit to a direction and say what would prove you wrong.',
  },
  {
    topic: 'markets',
    level: 'stretch',
    q: 'Are equities expensive right now? How would you tell?',
    a: 'Compare valuation measures to history and to bonds: forward P/E, cyclically adjusted P/E (CAPE), the earnings yield minus real bond yields (the equity risk premium), and dispersion between sectors or regions. Note that high valuations predict lower long-run returns but are a poor timing tool. A good answer separates the index from its largest constituents and from other regions.',
  },
  // ── Behavioural ──
  {
    topic: 'behavioural',
    level: 'core',
    q: 'Tell me about yourself.',
    a: 'Ninety seconds, in a straight line that ends at this job: your studies, the one or two experiences that made you interested in investing, what you have done to build skills (thesis, projects, a competition, an internship), and why this firm and role is the logical next step. Rehearse it until it sounds natural, not memorised.',
  },
  {
    topic: 'behavioural',
    level: 'core',
    q: 'Why our firm?',
    a: 'Show you did the work: their investment philosophy, the products or clients (pension money? retail funds? alternatives?), recent news, and people you spoke to. Link it to your own interests: “You run your multi-asset funds with a risk-based approach, which is what I worked on in my thesis.” Generic praise (“great reputation”) is a red flag.',
  },
  {
    topic: 'behavioural',
    level: 'core',
    q: 'Describe a time you worked under pressure or disagreed with a team member.',
    a: 'Use STAR: situation, task, action, result. Be specific about what you personally did and keep the result measurable. For a disagreement, show you listened, used evidence to decide, and kept the relationship. Prepare three or four stories that cover teamwork, pressure, failure and leadership, and reuse them.',
  },
  {
    topic: 'behavioural',
    level: 'stretch',
    q: 'What do you read to keep up with markets, and what did you learn this week?',
    a: 'Name specific sources (the FT, Bloomberg, central bank minutes, an asset manager’s research, a podcast) and, crucially, one concrete thing you learned this week and why it matters for portfolios. This question is a filter for genuine interest. Have an answer ready every day you are interviewing.',
  },
];
