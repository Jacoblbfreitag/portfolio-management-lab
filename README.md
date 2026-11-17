# Portfolio Management Lab

An interactive course on how professional investors build, run and judge portfolios, written for anyone aiming at a job on the buy side: asset managers, pension funds, insurers and wealth managers.
It goes from the stock/bond mix and the Sharpe ratio to risk parity, Black–Litterman, LDI, Brinson attribution and the fundamental law of active management, and ends with a module on getting the job.
Every model is written from scratch in TypeScript, every idea comes with a chart you can push around, and every module ends with the interview questions it prepares you for.

**▶ [Open the app](https://jacoblbfreitag.github.io/portfolio-management-lab/)**

It is a sibling project of [rates-options-lab](https://github.com/Jacoblbfreitag/rates-options-lab) and [energy-commodities-lab](https://github.com/Jacoblbfreitag/energy-commodities-lab), and uses the same lesson format and building blocks.

## Modules

| # | Module | What you learn |
|---|--------|----------------|
| 0 | Start here: the buy side | Asset owners vs managers, the investment process, the jobs, the stock/bond mix, asset-manager economics |
| 1 | Measuring return & risk | Simple vs log returns, volatility drag, annualisation, Sharpe, Sortino, drawdowns, factsheet traps |
| 2 | Diversification & the efficient frontier | Two-asset frontier, systematic vs idiosyncratic risk, Markowitz, tangency portfolio, CML |
| 3 | CAPM, beta & factor models | SML, beta/alpha by OLS, four-factor regressions on funds with hidden exposures |
| 4 | Portfolio construction in practice | Estimation error and shrinkage, risk contributions, risk parity, Black–Litterman |
| 5 | Bonds, duration & LDI | Price/yield, duration, convexity, DV01, pension funding ratio and hedge ratio |
| 6 | Asset allocation, rebalancing & goals | SAA vs TAA, Monte Carlo savings plans, rebalancing rules, glide paths |
| 7 | Performance measurement & attribution | TWR vs MWR, tracking error, information ratio, editable Brinson–Fachler attribution |
| 8 | Portfolio risk management | Parametric/historical VaR and ES, fat tails, component VaR, stress tests |
| 9 | Fees, costs & active vs passive | Fee compounding, turnover, Sharpe’s arithmetic, IR ≈ IC·√breadth, skill vs luck |
| 10 | Getting the job | Role finder, the interview process, pitch and case templates, skills checklist, question bank with drill mode, 12-week plan |

Each lesson follows the same pattern: a plain-words explanation, a worked example, the formula with a symbol table,
interactive charts, "Try this" exercises, an "On the job" box, key takeaways, an interview corner and a short quiz.
Hover any underlined term for its definition, or browse the searchable glossary.

## Running locally

Requires Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:5173/portfolio-management-lab/
npm test         # model, glossary, interview-bank and page-render tests
npm run build    # type-check + production build into dist/
```

## Project layout

```
src/
  models/        pure TypeScript finance code, no UI; read these alongside the lessons
    returns.ts       returns, annualisation, Sharpe, Sortino, drawdowns
    stats.ts         mean, std, covariance, quantiles
    meanVariance.ts  closed-form frontier, min-variance, tangency, long-only optimiser
    regression.ts    OLS with t-stats and R², CAPM helpers
    construction.ts  risk contributions, inverse vol, risk parity, Black–Litterman
    bonds.ts         price, duration, convexity, DV01, funding ratio, hedge ratio
    allocation.ts    Monte Carlo wealth fans, rebalancing backtests, glide path
    performance.ts   TWR, IRR, tracking error, IR, Brinson–Fachler, fees, fundamental law
    risk.ts          normal and historical VaR/ES, component VaR, stress P&L
    math/            matrix helpers, Cholesky, seeded RNG, normal CDF, solvers
  data/          illustrative capital market assumptions, simulated histories and funds,
                 stress scenarios, the glossary and the interview question bank
  components/    charts, sliders, formulas, lesson blocks, weight bars
  pages/         one file per module
tests/           numerical checks, glossary links, interview bank coverage, page render smoke test
```

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes to GitHub Pages.
In the repo settings set **Pages → Source** to **GitHub Actions**. The `base` in `vite.config.ts` must match the repo name
(`/portfolio-management-lab/`), and the "In the code" links in `src/components/Lesson.tsx` assume the same name.

## References

- Z. Bodie, A. Kane & A. Marcus, *Investments*
- CFA Institute, CFA Program curriculum: portfolio management readings
- A. Ang, *Asset Management: A Systematic Approach to Factor Investing* (2014)
- R. Grinold & R. Kahn, *Active Portfolio Management* (2nd ed. 2000)
- A. Ilmanen, *Expected Returns* (2011)
- H. Markowitz, "Portfolio Selection", *Journal of Finance* (1952)
- E. Fama & K. French, "Common Risk Factors in the Returns on Stocks and Bonds", *JFE* (1993)
- F. Black & R. Litterman, "Global Portfolio Optimization", *Financial Analysts Journal* (1992)
- W. Sharpe, "The Arithmetic of Active Management", *Financial Analysts Journal* (1991)
- G. Brinson, R. Hood & G. Beebower, "Determinants of Portfolio Performance", *FAJ* (1986)
- R. Michaud, "The Markowitz Optimization Enigma: Is 'Optimized' Optimal?", *FAJ* (1989)

Capital market assumptions and histories in this app are illustrative and simulated, not forecasts or live data, and nothing here is investment advice.
