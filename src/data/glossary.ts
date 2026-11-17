/**
 * Glossary of terms used in the course.
 * To add a term, add an entry here — the Glossary page sorts and indexes it automatically.
 *   module:  lesson id from src/lessons.ts where the term is taught
 *   formula: optional LaTeX (rendered with KaTeX)
 *   related: other glossary terms (exact `term` names) to link to
 */
export interface GlossaryEntry {
  term: string;
  aka?: string[];
  definition: string;
  formula?: string;
  module?: string;
  related?: string[];
}

export const glossary: GlossaryEntry[] = [
  // ── Basics ──
  { term: 'Buy side', definition: 'Firms that invest money: asset managers, pension funds, insurers, hedge funds, endowments and sovereign wealth funds.', module: 'basics', related: ['Sell side', 'Asset owner', 'Asset manager'] },
  { term: 'Sell side', definition: 'Firms that sell services to investors: investment banks and brokers providing research, trading, market making and new issues.', module: 'basics', related: ['Buy side'] },
  { term: 'Asset owner', definition: 'An institution that owns the money and its liabilities: a pension fund, insurer, sovereign fund or endowment. It sets the strategy and often hires asset managers.', module: 'basics', related: ['Asset manager', 'Pension fund'] },
  { term: 'Asset manager', aka: ['Investment manager', 'Fund manager'], definition: 'A firm that invests money on behalf of clients for a fee, through funds or segregated mandates.', module: 'basics', related: ['Asset owner', 'Mandate', 'Assets under management'] },
  { term: 'Assets under management', aka: ['AUM'], definition: 'The market value of the money a manager invests for clients. Fee revenue is roughly AUM × fee rate.', module: 'basics', related: ['Asset manager'] },
  { term: 'Pension fund', definition: 'An asset owner that collects contributions and pays retirement benefits. Its investment problem is defined by its liabilities: the pensions it has promised.', module: 'basics', related: ['Asset owner', 'Liability-driven investing', 'Funding ratio'] },
  { term: 'Investment policy statement', aka: ['IPS'], definition: 'The written agreement on a client’s objectives (return, risk) and constraints (horizon, liquidity, taxes, legal, unique preferences) that governs how the money is invested.', module: 'basics', related: ['Strategic asset allocation', 'Risk tolerance'] },
  { term: 'Mandate', definition: 'The instructions a client gives a manager: what to invest in, the benchmark, the risk limits and the fee.', module: 'basics', related: ['Benchmark', 'Asset manager'] },
  { term: 'Benchmark', definition: 'The yardstick a portfolio is measured against, usually a market index. A good benchmark is investable, specified in advance and matches the manager’s universe.', module: 'basics', related: ['Tracking error', 'Mandate'] },
  { term: 'Portfolio manager', aka: ['PM'], definition: 'The person who makes the final investment decisions for a portfolio and is accountable for its performance.', module: 'basics', related: ['Buy-side analyst'] },
  { term: 'Risk tolerance', definition: 'How much risk a client is willing (attitude) and able (capacity: horizon, wealth, income) to take. Capacity usually binds more than willingness.', module: 'basics', related: ['Investment policy statement'] },
  { term: 'Active management', definition: 'Trying to beat a benchmark by deviating from it: picking securities, timing markets or tilting to factors.', module: 'basics', related: ['Passive investing', 'Information ratio'] },
  { term: 'Passive investing', aka: ['Indexing'], definition: 'Holding the benchmark itself, usually through an index fund or ETF, at very low cost.', module: 'basics', related: ['Active management', 'Index fund'] },

  // ── Returns ──
  { term: 'Simple return', aka: ['Arithmetic return'], definition: 'The percentage change in value over a period, including income: (end − start + income)/start. Simple returns of assets add up across a portfolio.', formula: String.raw`R = \frac{P_1 + D - P_0}{P_0}`, module: 'returns', related: ['Log return'] },
  { term: 'Log return', aka: ['Continuously compounded return'], definition: 'ln(1 + R). Log returns add up over time, which makes them convenient for multi-period maths and modelling.', formula: String.raw`g = \ln(1 + R)`, module: 'returns', related: ['Simple return'] },
  { term: 'Arithmetic mean', definition: 'The simple average of period returns. It is the right estimate of next period’s expected return, but it overstates the growth rate of wealth.', module: 'returns', related: ['Geometric mean', 'Volatility drag'] },
  { term: 'Geometric mean', aka: ['CAGR', 'Compound annual growth rate'], definition: 'The constant return that would have produced the same final wealth. This is what the investor actually earned per period.', formula: String.raw`\bar R_g = \Big(\prod_t (1+R_t)\Big)^{1/T} - 1`, module: 'returns', related: ['Arithmetic mean', 'Volatility drag'] },
  { term: 'Volatility drag', aka: ['Variance drain'], definition: 'The gap between arithmetic and geometric mean returns caused by volatility: roughly σ²/2. A volatile asset compounds more slowly than its average return suggests.', formula: String.raw`\bar R_g \approx \bar R_a - \tfrac12\sigma^2`, module: 'returns', related: ['Geometric mean', 'Volatility'] },
  { term: 'Volatility', aka: ['σ', 'Vol', 'Standard deviation'], definition: 'The standard deviation of returns, usually annualised: the standard measure of total risk.', module: 'returns', related: ['Annualisation', 'Sharpe ratio'] },
  { term: 'Annualisation', definition: 'Converting periodic figures to annual ones: multiply mean returns by the number of periods per year, volatility by its square root (if returns are independent).', formula: String.raw`\sigma_{\text{year}} = \sigma_{\text{month}}\sqrt{12}`, module: 'returns', related: ['Volatility'] },
  { term: 'Risk-free rate', aka: ['r_f'], definition: 'The return on a riskless short-term investment, in practice a government bill or money-market rate.', module: 'returns', related: ['Excess return', 'Sharpe ratio'] },
  { term: 'Excess return', definition: 'Return above the risk-free rate: the reward for taking risk.', module: 'returns', related: ['Risk-free rate'] },
  { term: 'Sharpe ratio', definition: 'Excess return per unit of volatility. The standard measure of risk-adjusted return for a whole portfolio.', formula: String.raw`SR = \frac{E[R] - r_f}{\sigma}`, module: 'returns', related: ['Sortino ratio', 'Information ratio', 'Capital market line'] },
  { term: 'Sortino ratio', definition: 'Like the Sharpe ratio, but divides by downside deviation (volatility of returns below a target), so upside swings are not penalised.', module: 'returns', related: ['Sharpe ratio'] },
  { term: 'Maximum drawdown', aka: ['Max DD'], definition: 'The largest peak-to-trough fall in value over a period. It measures the pain an investor actually lived through.', module: 'returns', related: ['Calmar ratio'] },
  { term: 'Calmar ratio', definition: 'Annual return divided by the absolute maximum drawdown.', module: 'returns', related: ['Maximum drawdown'] },

  // ── Diversification ──
  { term: 'Correlation', aka: ['ρ'], definition: 'A number between −1 and 1 measuring how closely two returns move together. Below 1 means combining the assets reduces risk.', module: 'diversification', related: ['Diversification', 'Covariance matrix'] },
  { term: 'Covariance matrix', aka: ['Σ'], definition: 'The table of variances (diagonal) and covariances (off-diagonal) of a set of assets. Portfolio variance is wᵀΣw.', formula: String.raw`\sigma_p^2 = w^\top \Sigma\, w`, module: 'diversification', related: ['Correlation'] },
  { term: 'Diversification', definition: 'Combining assets that are not perfectly correlated so that part of their individual risk cancels out.', module: 'diversification', related: ['Systematic risk', 'Idiosyncratic risk', 'Correlation'] },
  { term: 'Systematic risk', aka: ['Market risk', 'Non-diversifiable risk'], definition: 'Risk shared by all assets (recessions, rates, sentiment) that remains however much you diversify. Investors are paid for bearing it.', module: 'diversification', related: ['Idiosyncratic risk', 'Beta'] },
  { term: 'Idiosyncratic risk', aka: ['Specific risk', 'Diversifiable risk'], definition: 'Risk particular to one company or asset. It largely disappears in a diversified portfolio, so in theory it earns no premium.', module: 'diversification', related: ['Systematic risk'] },
  { term: 'Efficient frontier', definition: 'The set of portfolios with the highest expected return for each level of risk.', module: 'diversification', related: ['Minimum-variance portfolio', 'Tangency portfolio'] },
  { term: 'Minimum-variance portfolio', aka: ['GMV'], definition: 'The portfolio with the lowest possible volatility. It needs only the covariance matrix, not expected returns.', formula: String.raw`w = \frac{\Sigma^{-1}\mathbf 1}{\mathbf 1^\top \Sigma^{-1}\mathbf 1}`, module: 'diversification', related: ['Efficient frontier'] },
  { term: 'Tangency portfolio', aka: ['Maximum-Sharpe portfolio'], definition: 'The risky portfolio with the highest Sharpe ratio, where a line from the risk-free rate touches the efficient frontier.', formula: String.raw`w \propto \Sigma^{-1}(\mu - r_f\mathbf 1)`, module: 'diversification', related: ['Capital market line', 'Two-fund separation'] },
  { term: 'Capital market line', aka: ['CML'], definition: 'The straight line of portfolios mixing cash with the tangency portfolio. With a risk-free asset it is the best risk–return trade-off available.', module: 'diversification', related: ['Tangency portfolio', 'Sharpe ratio'] },
  { term: 'Two-fund separation', definition: 'In mean–variance theory, every investor holds the same risky portfolio (the tangency portfolio) and only the mix with cash depends on risk aversion.', module: 'diversification', related: ['Tangency portfolio'] },
  { term: 'Short selling', definition: 'Selling a borrowed security in the hope of buying it back cheaper. Allows negative weights; most long-only funds cannot do it.', module: 'diversification' },

  // ── CAPM ──
  { term: 'CAPM', aka: ['Capital asset pricing model'], definition: 'The model in which an asset’s expected excess return is its beta times the market risk premium. Only systematic risk is rewarded.', formula: String.raw`E[R_i] = r_f + \beta_i\,(E[R_m] - r_f)`, module: 'capm', related: ['Beta', 'Security market line', 'Equity risk premium'] },
  { term: 'Beta', aka: ['β'], definition: 'Sensitivity of an asset’s return to the market’s: the slope of a regression of its excess returns on the market’s.', formula: String.raw`\beta = \frac{\mathrm{Cov}(R_i, R_m)}{\mathrm{Var}(R_m)}`, module: 'capm', related: ['CAPM', 'Alpha'] },
  { term: 'Alpha', aka: ['α', "Jensen's alpha"], definition: 'Return in excess of what the portfolio’s risk exposures (beta, factors) would have earned. The intercept of a regression on the market or factors.', module: 'capm', related: ['Beta', 'Factor model', 'Information ratio'] },
  { term: 'Security market line', aka: ['SML'], definition: 'Expected return plotted against beta. Under CAPM all assets lie on it; assets above it have positive alpha.', module: 'capm', related: ['CAPM'] },
  { term: 'Equity risk premium', aka: ['ERP', 'Market risk premium'], definition: 'The expected return of equities above the risk-free rate. Commonly assumed at around 4–6% a year.', module: 'capm', related: ['CAPM'] },
  { term: 'Factor model', definition: 'A model explaining returns by exposures to a few common drivers (market, size, value, momentum…) plus a specific part.', formula: String.raw`R_i - r_f = \alpha + \beta\,MKT + s\,SMB + h\,HML + m\,MOM + \varepsilon`, module: 'capm', related: ['Size factor', 'Value factor', 'Momentum factor'] },
  { term: 'Size factor', aka: ['SMB'], definition: 'Small minus big: the return of small-cap stocks over large-cap stocks.', module: 'capm', related: ['Factor model'] },
  { term: 'Value factor', aka: ['HML'], definition: 'High minus low: the return of cheap stocks (high book-to-market) over expensive ones.', module: 'capm', related: ['Factor model'] },
  { term: 'Momentum factor', aka: ['MOM', 'UMD', 'WML'], definition: 'The return of recent winners (past 12 months, skipping the last) over recent losers.', module: 'capm', related: ['Factor model'] },
  { term: 'Smart beta', aka: ['Factor investing'], definition: 'Rules-based funds that tilt towards factors (value, quality, low volatility…) at fees between passive and active.', module: 'capm', related: ['Factor model', 'Passive investing'] },
  { term: 'R-squared', aka: ['R²'], definition: 'Share of a portfolio’s return variance explained by the regression. An active fund with R² near 1 against its index is barely active.', module: 'capm', related: ['Closet indexer'] },
  { term: 't-statistic', definition: 'An estimate divided by its standard error. |t| above about 2 is the usual threshold for “statistically significant”.', module: 'capm', related: ['Alpha'] },
  { term: 'Closet indexer', definition: 'A fund charging active fees while holding something very close to its benchmark: high R², low tracking error.', module: 'capm', related: ['R-squared', 'Tracking error'] },

  // ── Construction ──
  { term: 'Estimation error', definition: 'The uncertainty in estimated inputs (especially expected returns). Optimisers amplify it, which is why raw Markowitz portfolios are unstable.', module: 'construction', related: ['Shrinkage', 'Black–Litterman model'] },
  { term: 'Shrinkage', definition: 'Pulling noisy estimates towards a sensible target (e.g. the grand mean, or equilibrium returns) to reduce estimation error.', module: 'construction', related: ['Estimation error'] },
  { term: 'Risk contribution', definition: 'The part of portfolio volatility that comes from one position. Contributions add up to total volatility.', formula: String.raw`RC_i = w_i \frac{(\Sigma w)_i}{\sigma_p}`, module: 'construction', related: ['Risk parity', 'Component VaR'] },
  { term: 'Risk parity', aka: ['Equal risk contribution', 'ERC'], definition: 'Weights chosen so that every asset contributes the same amount of risk. Usually holds a lot of bonds and may use leverage.', module: 'construction', related: ['Risk contribution', 'Inverse-volatility weighting', 'Leverage'] },
  { term: 'Inverse-volatility weighting', definition: 'Weights proportional to 1/σ. A simple approximation to risk parity that ignores correlations.', module: 'construction', related: ['Risk parity'] },
  { term: 'Implied equilibrium returns', aka: ['Reverse optimisation', 'Π'], definition: 'The expected returns that would make the market-cap portfolio optimal, given the covariance matrix and a risk aversion δ.', formula: String.raw`\Pi = \delta\,\Sigma\,w_{\text{mkt}}`, module: 'construction', related: ['Black–Litterman model'] },
  { term: 'Black–Litterman model', definition: 'A Bayesian method that starts from implied equilibrium returns and tilts them towards the investor’s views in proportion to confidence.', module: 'construction', related: ['Implied equilibrium returns', 'Estimation error'] },
  { term: 'Leverage', definition: 'Investing more than your capital by borrowing or using derivatives. Raises both return and risk.', module: 'construction', related: ['Risk parity'] },

  // ── Bonds ──
  { term: 'Yield to maturity', aka: ['YTM'], definition: 'The single discount rate that makes a bond’s cash flows equal its price.', module: 'bonds', related: ['Duration'] },
  { term: 'Duration', aka: ['Macaulay duration'], definition: 'The PV-weighted average time to a bond’s cash flows. Also the key measure of interest-rate sensitivity.', formula: String.raw`D = \frac{1}{P}\sum_t \frac{t\,CF_t}{(1+y)^t}`, module: 'bonds', related: ['Modified duration', 'Convexity'] },
  { term: 'Modified duration', definition: 'The percentage price change for a 1-unit change in yield: Macaulay duration / (1 + y).', formula: String.raw`\frac{\Delta P}{P} \approx -D_{\text{mod}}\,\Delta y`, module: 'bonds', related: ['Duration', 'DV01'] },
  { term: 'Convexity', definition: 'The curvature of the price–yield relationship. Positive convexity means prices rise more when yields fall than they drop when yields rise.', formula: String.raw`\frac{\Delta P}{P} \approx -D_{\text{mod}}\Delta y + \tfrac12 C\,\Delta y^2`, module: 'bonds', related: ['Duration'] },
  { term: 'DV01', aka: ['PV01', 'Dollar duration'], definition: 'The change in value (in money) for a one-basis-point fall in yields. Hedges are sized by matching DV01s.', module: 'bonds', related: ['Hedge ratio', 'Modified duration'] },
  { term: 'Liability-driven investing', aka: ['LDI'], definition: 'Investing to match the behaviour of liabilities (e.g. pensions), mainly by hedging their interest-rate and inflation sensitivity.', module: 'bonds', related: ['Funding ratio', 'Hedge ratio', 'Pension fund'] },
  { term: 'Funding ratio', aka: ['Funded status', 'Coverage ratio'], definition: 'Assets divided by the present value of liabilities. Below 100% the fund cannot meet its promises today.', module: 'bonds', related: ['Liability-driven investing'] },
  { term: 'Hedge ratio', definition: 'In LDI, the share of the liabilities’ interest-rate sensitivity (DV01) that the assets offset.', module: 'bonds', related: ['DV01', 'Liability-driven investing'] },
  { term: 'Interest-rate swap', definition: 'An exchange of fixed for floating interest payments. Pension funds receive fixed in long swaps to add duration without buying bonds.', module: 'bonds', related: ['Liability-driven investing'] },
  { term: 'Term premium', definition: 'The extra yield investors demand to hold a long bond instead of rolling short ones.', module: 'bonds' },

  // ── Allocation ──
  { term: 'Strategic asset allocation', aka: ['SAA', 'Policy portfolio'], definition: 'The long-run target mix of asset classes, set from the client’s objectives and long-run market assumptions.', module: 'allocation', related: ['Tactical asset allocation', 'Capital market assumptions'] },
  { term: 'Tactical asset allocation', aka: ['TAA'], definition: 'Short- to medium-term deviations from the strategic mix, within limits, to exploit market views.', module: 'allocation', related: ['Strategic asset allocation'] },
  { term: 'Capital market assumptions', aka: ['CMAs'], definition: 'Long-run forecasts of expected returns, volatilities and correlations for asset classes, used to set strategic allocations.', module: 'allocation', related: ['Strategic asset allocation'] },
  { term: 'Rebalancing', definition: 'Trading back to target weights after market moves have shifted them.', module: 'allocation', related: ['Turnover'] },
  { term: 'Turnover', definition: 'How much of a portfolio is traded over a period, as a share of its value. Drives transaction costs.', module: 'allocation', related: ['Transaction costs', 'Rebalancing'] },
  { term: 'Monte Carlo simulation', definition: 'Simulating thousands of random future paths to see the distribution of outcomes, not just the average.', module: 'allocation', related: ['Shortfall probability'] },
  { term: 'Shortfall probability', definition: 'The probability that wealth ends below a goal.', module: 'allocation', related: ['Monte Carlo simulation'] },
  { term: 'Glide path', definition: 'The planned fall in equity share as an investor approaches retirement, as used in target-date funds.', module: 'allocation', related: ['Human capital'] },
  { term: 'Human capital', definition: 'The present value of a person’s future earnings. For most young people it is their largest, and fairly bond-like, asset.', module: 'allocation', related: ['Glide path'] },

  // ── Performance ──
  { term: 'Time-weighted return', aka: ['TWR'], definition: 'Return computed by chain-linking sub-period returns, removing the effect of cash flows. The standard for judging managers.', formula: String.raw`1 + R_{TW} = \prod_k (1 + r_k)`, module: 'performance', related: ['Money-weighted return', 'GIPS'] },
  { term: 'Money-weighted return', aka: ['MWR', 'IRR', 'Internal rate of return'], definition: 'The internal rate of return of the actual cash flows: the investor’s own experience including their timing.', module: 'performance', related: ['Time-weighted return'] },
  { term: 'Tracking error', aka: ['TE', 'Active risk'], definition: 'The volatility of the difference between portfolio and benchmark returns.', module: 'performance', related: ['Information ratio', 'Benchmark'] },
  { term: 'Information ratio', aka: ['IR'], definition: 'Active return divided by tracking error: the Sharpe ratio of active management.', formula: String.raw`IR = \frac{R_p - R_b}{TE}`, module: 'performance', related: ['Tracking error', 'Fundamental law of active management'] },
  { term: 'Brinson attribution', aka: ['Brinson–Fachler'], definition: 'Splitting active return into allocation, selection and interaction effects across segments.', module: 'performance', related: ['Allocation effect', 'Selection effect'] },
  { term: 'Allocation effect', definition: 'Active return from over- or underweighting segments relative to the benchmark.', formula: String.raw`(w_{p,i} - w_{b,i})(r_{b,i} - R_b)`, module: 'performance', related: ['Brinson attribution'] },
  { term: 'Selection effect', definition: 'Active return from choosing securities that beat their segment of the benchmark.', formula: String.raw`w_{b,i}(r_{p,i} - r_{b,i})`, module: 'performance', related: ['Brinson attribution'] },
  { term: 'Survivorship bias', definition: 'Overstating average performance because funds that closed (usually the bad ones) drop out of the data.', module: 'performance' },
  { term: 'GIPS', aka: ['Global Investment Performance Standards'], definition: 'The CFA Institute’s standards for calculating and presenting investment performance fairly.', module: 'performance', related: ['Time-weighted return'] },

  // ── Risk ──
  { term: 'Value-at-Risk', aka: ['VaR'], definition: 'The loss that is exceeded with only a given probability (e.g. 5%) over a given horizon.', formula: String.raw`\text{VaR}_\alpha = z_\alpha\,\sigma\sqrt h - \mu h`, module: 'risk', related: ['Expected shortfall', 'Fat tails'] },
  { term: 'Expected shortfall', aka: ['ES', 'CVaR', 'Conditional VaR'], definition: 'The average loss in the worst (1 − α) of outcomes. It looks into the tail that VaR ignores.', module: 'risk', related: ['Value-at-Risk'] },
  { term: 'Fat tails', aka: ['Excess kurtosis'], definition: 'Extreme returns happen far more often than a normal distribution predicts.', module: 'risk', related: ['Value-at-Risk'] },
  { term: 'Component VaR', definition: 'The part of portfolio VaR attributable to one position. Components sum to the total.', module: 'risk', related: ['Risk contribution'] },
  { term: 'Stress test', definition: 'Revaluing the portfolio under an extreme but plausible scenario, historical or hypothetical.', module: 'risk', related: ['Value-at-Risk'] },
  { term: 'Liquidity risk', definition: 'The risk of not being able to sell an asset or raise cash quickly without a big price concession, e.g. to meet margin calls or redemptions.', module: 'risk' },

  // ── Active ──
  { term: 'Total expense ratio', aka: ['TER', 'Ongoing charges', 'OCF'], definition: 'The annual cost of a fund as a percentage of assets: management fee plus administration and other running costs (trading costs come on top).', module: 'active', related: ['Transaction costs', 'Performance fee'] },
  { term: 'Performance fee', aka: ['Incentive fee', '2 and 20'], definition: 'A fee paid as a share of returns above a hurdle; typical for hedge funds (traditionally 2% management + 20% of profits).', module: 'active', related: ['Total expense ratio'] },
  { term: 'Transaction costs', definition: 'The cost of trading: commissions, the bid–ask spread and market impact. They grow with turnover and with trade size.', module: 'active', related: ['Turnover'] },
  { term: 'Index fund', definition: 'A fund that tracks a market index at low cost. Includes many ETFs.', module: 'active', related: ['ETF', 'Passive investing'] },
  { term: 'ETF', aka: ['Exchange-traded fund'], definition: 'A fund listed and traded on an exchange like a share. Most track an index.', module: 'active', related: ['Index fund'] },
  { term: 'Arithmetic of active management', definition: 'Sharpe (1991): before costs the average actively managed dollar earns the market return, so after costs it must earn less.', module: 'active', related: ['Active management'] },
  { term: 'Information coefficient', aka: ['IC'], definition: 'The correlation between a manager’s forecasts and the outcomes. 0.05 is already good.', module: 'active', related: ['Fundamental law of active management'] },
  { term: 'Breadth', definition: 'The number of independent active bets per year.', module: 'active', related: ['Fundamental law of active management'] },
  { term: 'Fundamental law of active management', definition: 'Grinold: the information ratio is about skill (IC) times the square root of breadth.', formula: String.raw`IR \approx IC\sqrt{BR}`, module: 'active', related: ['Information coefficient', 'Breadth', 'Information ratio'] },

  // ── Career ──
  { term: 'Buy-side analyst', definition: 'Researches securities or asset classes and recommends positions to the portfolio manager. The usual entry point to a PM career.', module: 'career', related: ['Portfolio manager'] },
  { term: 'Investment committee', definition: 'The group that approves strategy, the strategic allocation and large decisions. Juniors often prepare its papers.', module: 'career', related: ['Strategic asset allocation'] },
  { term: 'Stock pitch', definition: 'A short, structured case for buying or selling a security: thesis, valuation, catalysts, risks.', module: 'career' },
  { term: 'CFA charter', aka: ['CFA'], definition: 'The Chartered Financial Analyst qualification: three exams covering ethics, analysis, valuation and portfolio management, plus work experience.', module: 'career' },
  { term: 'STAR method', definition: 'Answering behavioural questions as Situation, Task, Action, Result.', module: 'career' },
];
