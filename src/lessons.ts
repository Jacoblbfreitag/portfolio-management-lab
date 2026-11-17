/** The course outline. Add a lesson here and it appears in the sidebar and overview. */
export interface LessonInfo {
  id: string;
  number: number;
  path: string;
  title: string;
  summary: string;
  goals: string[];
}

export const lessons: LessonInfo[] = [
  {
    id: 'basics',
    number: 0,
    path: '/basics',
    title: 'Start here: the buy side',
    summary: 'Who manages money, for whom, and how: asset owners vs managers, the investment process, and the jobs along it.',
    goals: [
      'Tell apart asset owners (pension funds, insurers, sovereign funds) and asset managers',
      'Describe the investment process from the client’s objectives to the performance report',
      'Name the main buy-side roles and what each does all day',
      'Explain the trade-off between risk and return with a simple stock/bond mix',
    ],
  },
  {
    id: 'returns',
    number: 1,
    path: '/returns',
    title: 'Measuring return & risk',
    summary: 'Simple vs log returns, arithmetic vs geometric means, volatility drag, Sharpe, Sortino and drawdowns.',
    goals: [
      'Compute and annualise returns and volatility correctly',
      'Explain why the geometric mean is below the arithmetic mean (volatility drag)',
      'Compute and interpret Sharpe, Sortino, maximum drawdown and Calmar',
      'Spot the classic traps in a fund factsheet',
    ],
  },
  {
    id: 'diversification',
    number: 2,
    path: '/diversification',
    title: 'Diversification & the efficient frontier',
    summary: 'Correlation, the two-asset frontier, systematic vs idiosyncratic risk, Markowitz and the tangency portfolio.',
    goals: [
      'Show how correlation below one lowers portfolio risk',
      'Explain why diversification cannot remove systematic risk',
      'Build the efficient frontier and find the minimum-variance and tangency portfolios',
      'Explain the capital market line and two-fund separation',
    ],
  },
  {
    id: 'capm',
    number: 3,
    path: '/capm',
    title: 'CAPM, beta & factor models',
    summary: 'Beta and alpha, the security market line, and using Fama–French regressions to see what a fund really holds.',
    goals: [
      'Estimate a fund’s beta and alpha by regression and judge the t-stat',
      'Use the CAPM to set a required return',
      'Explain the size, value and momentum factors',
      'Show that a fund’s “alpha” can be hidden factor exposure',
    ],
  },
  {
    id: 'construction',
    number: 4,
    path: '/construction',
    title: 'Portfolio construction in practice',
    summary: 'Why raw Markowitz fails, risk contributions, risk parity, constraints and Black–Litterman.',
    goals: [
      'Explain why optimisers are “error maximisers”',
      'Compute each asset’s contribution to portfolio risk',
      'Compare equal-weight, inverse-vol, minimum-variance, risk parity and max-Sharpe portfolios',
      'Blend market-implied returns with your own views using Black–Litterman',
    ],
  },
  {
    id: 'bonds',
    number: 5,
    path: '/bonds',
    title: 'Bonds, duration & LDI',
    summary: 'Bond prices and yields, duration and convexity, and how pension funds hedge their liabilities.',
    goals: [
      'Price a bond and explain the price–yield relationship',
      'Use duration and convexity to estimate a price change',
      'Explain why a pension fund’s real risk is its funding ratio, not its asset return',
      'Set an interest-rate hedge ratio with DV01',
    ],
  },
  {
    id: 'allocation',
    number: 6,
    path: '/allocation',
    title: 'Asset allocation, rebalancing & goals',
    summary: 'Strategic vs tactical allocation, Monte Carlo of savings plans, rebalancing rules and glide paths.',
    goals: [
      'Explain strategic and tactical asset allocation and who decides each',
      'Read a Monte Carlo fan chart and the probability of missing a goal',
      'Compare rebalancing rules on risk, return and turnover',
      'Explain the logic behind lifecycle (target-date) glide paths',
    ],
  },
  {
    id: 'performance',
    number: 7,
    path: '/performance',
    title: 'Performance measurement & attribution',
    summary: 'Time- vs money-weighted returns, benchmarks, tracking error, information ratio and Brinson attribution.',
    goals: [
      'Compute TWR and MWR and say which to use when',
      'Judge whether a benchmark is fair',
      'Compute tracking error and the information ratio',
      'Split active return into allocation and selection with Brinson',
    ],
  },
  {
    id: 'risk',
    number: 8,
    path: '/risk',
    title: 'Portfolio risk management',
    summary: 'VaR and expected shortfall, fat tails, risk decomposition, stress tests and the risk report.',
    goals: [
      'Compute parametric and historical VaR and ES',
      'Explain why normal VaR understates crash risk',
      'Decompose portfolio VaR into contributions by asset',
      'Run and read a stress test',
    ],
  },
  {
    id: 'active',
    number: 9,
    path: '/active',
    title: 'Fees, costs & active vs passive',
    summary: 'The cost of fees, turnover and trading, the arithmetic of active management, the fundamental law and luck vs skill.',
    goals: [
      'Show how a 1% fee compounds over a career',
      'Explain why active management is a zero-sum game before costs',
      'Use the fundamental law IR ≈ IC·√breadth',
      'Estimate how many years it takes to tell skill from luck',
    ],
  },
  {
    id: 'career',
    number: 10,
    path: '/career',
    title: 'Getting the job',
    summary: 'Roles and paths, what interviews test, the stock/portfolio pitch, certifications, and a full interview question bank.',
    goals: [
      'Pick the buy-side roles that fit your profile',
      'Prepare a stock pitch and a portfolio case study',
      'Practise the technical and behavioural questions you will be asked',
      'Build a 12-week preparation plan',
    ],
  },
];
