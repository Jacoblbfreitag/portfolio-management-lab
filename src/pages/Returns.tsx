import { useMemo, useState } from 'react';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { RF, assets } from '../data/assets';
import { simulateHistory } from '../data/assets';
import { annualizedReturn, annualizedVol, arithmeticAnnual, calmarRatio, drawdowns, geometricFromArithmetic, maxDrawdown, sharpeRatio, sortinoRatio, wealthIndex } from '../models/returns';

const choices = ['govt', 'hy', 'equity', 'em'] as const;

export default function Returns() {
  // ── Volatility drag ──
  const [mu, setMu] = useState(0.08);
  const [sigma, setSigma] = useState(0.2);
  const sigmas = linspace(0, 0.6, 61);

  // ── Track record ──
  const [asset, setAsset] = useState<(typeof choices)[number]>('equity');
  const [years, setYears] = useState(15);
  const [seed, setSeed] = useState(3);
  const r = useMemo(() => simulateHistory([asset], years * 12, seed)[0], [asset, years, seed]);
  const w = wealthIndex(r);
  const dd = drawdowns(w);
  const months = w.map((_, i) => i / 12);
  const a = assets.find((x) => x.id === asset)!;

  return (
    <article>
      <LessonHeader id="returns" />

      <Section title="1. What is a return?">
        <InPlainWords>
          A return is what you gained as a share of what you put in, counting both price changes and income (dividends,
          coupons). It sounds trivial, but averaging returns over time, annualising them and comparing them fairly is where
          most mistakes on factsheets, and in interviews, happen.
        </InPlainWords>
        <TexBlock>{String.raw`R_t = \frac{P_t + D_t - P_{t-1}}{P_{t-1}}, \qquad g_t = \ln(1 + R_t)`}</TexBlock>
        <Symbols
          items={[
            ['R_t', <><Term name="Simple return">Simple return</Term> over period t. Portfolio return = weighted sum of asset simple returns.</>],
            ['g_t', <><Term name="Log return">Log return</Term>. Log returns add up over time: a year’s log return is the sum of its months’.</>],
            ['P_t,\\,D_t', 'Price at the end of the period, and income paid during it'],
          ]}
        />
      </Section>

      <Section title="2. Arithmetic vs geometric: volatility drag">
        <p>
          A fund returns +50% then −50%. The <Term name="Arithmetic mean">arithmetic mean</Term> is 0%, but €100 became €150 and then
          €75. The <Term name="Geometric mean">geometric mean</Term>, the rate that actually compounds your money, is −13.4% a
          year. The more volatile the returns, the bigger the gap:
        </p>
        <TexBlock>{String.raw`\bar R_{\text{geo}} \approx \bar R_{\text{arith}} - \tfrac12 \sigma^2`}</TexBlock>
        <Playground
          controls={
            <>
              <Slider label="Arithmetic mean return μ" value={mu} min={0} max={0.15} step={0.005} onChange={setMu} format={(v) => pct(v, 1)} />
              <Slider label="Volatility σ" value={sigma} min={0} max={0.6} step={0.01} onChange={setSigma} format={(v) => pct(v, 0)} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Arithmetic mean', value: pct(mu, 1) },
              { label: 'Geometric (median) growth', value: pct(geometricFromArithmetic(mu, sigma), 2) },
              { label: <Term name="Volatility drag">Volatility drag</Term>, value: pct(0.5 * sigma * sigma, 2) },
              { label: 'Median €100 after 30 years', value: `€${Math.round(100 * Math.exp(30 * geometricFromArithmetic(mu, sigma)))}` },
            ]}
          />
          <Chart
            data={[
              line(sigmas, sigmas.map(() => mu), 'Arithmetic mean', { line: { color: palette[5], dash: 'dash' } }),
              line(sigmas, sigmas.map((s) => geometricFromArithmetic(mu, s)), 'Geometric growth', { line: { color: palette[0], width: 3 } }),
              { x: [sigma], y: [geometricFromArithmetic(mu, sigma)], type: 'scatter', mode: 'markers', name: 'Your σ', marker: { color: palette[3], size: 11 } },
            ]}
            layout={{ xaxis: { tickformat: '.0%' }, yaxis: { tickformat: '.0%' } }}
            x="Volatility"
            y="Annual return"
          />
        </Playground>
        <TryThis
          items={[
            'Set μ = 8% and σ = 40% (a volatile single stock or crypto). The median investor earns zero even though the average return is 8%.',
            'Compare leveraged ETFs: doubling exposure doubles μ but quadruples σ²/2. That is why a 2× ETF held for years usually earns much less than 2× the index.',
          ]}
        />
        <Note title="Which mean to use when">
          Use the <strong>arithmetic</strong> mean as the expected return for the <em>next</em> period (it goes into optimisers and the
          CAPM). Use the <strong>geometric</strong> mean to report what investors actually earned and to project the median of long-run wealth.
        </Note>
      </Section>

      <Section title="3. A track record, and the numbers on its factsheet">
        <p>
          Below is a simulated monthly history drawn from this course’s assumptions for the asset you pick. The returns have fat
          tails: occasional crash months, as in real markets. Change the seed to see a different “history” from the
          <em> same</em> distribution: a lesson in how much luck a 10-year record contains.
        </p>
        <Playground
          controls={
            <>
              <Toggle label="Asset" value={asset} onChange={setAsset} options={choices.map((id) => ({ value: id, label: assets.find((x) => x.id === id)!.short }))} />
              <Slider label="Years of history" value={years} min={3} max={40} step={1} onChange={setYears} format={(v) => `${v}y`} />
              <Slider label="Random seed (a different history)" value={seed} min={1} max={50} step={1} onChange={setSeed} />
              <div className="muted" style={{ fontSize: 13 }}>
                True assumptions: μ = {pct(a.mu, 1)}, σ = {pct(a.vol, 0)}. Risk-free {pct(RF, 1)}.
              </div>
            </>
          }
        >
          <Stats
            items={[
              { label: 'Annual return (CAGR)', value: pct(annualizedReturn(r), 1), hint: `arithmetic ${pct(arithmeticAnnual(r), 1)}` },
              { label: 'Volatility', value: pct(annualizedVol(r), 1) },
              { label: <Term name="Sharpe ratio">Sharpe</Term>, value: num(sharpeRatio(r, RF), 2) },
              { label: <Term name="Sortino ratio">Sortino</Term>, value: num(sortinoRatio(r, RF), 2) },
              { label: <Term name="Maximum drawdown">Max drawdown</Term>, value: pct(maxDrawdown(w), 1) },
              { label: <Term name="Calmar ratio">Calmar</Term>, value: num(calmarRatio(r), 2) },
            ]}
          />
          <Chart data={[line(months, w.map((x) => 100 * x), 'Value of €100', { line: { color: a.color, width: 2.5 } })]} layout={{ yaxis: { type: 'log' } }} x="Years" y="€ (log scale)" height={280} />
          <Chart data={[line(months, dd, 'Drawdown', { fill: 'tozeroy', line: { color: palette[3] } })]} layout={{ yaxis: { tickformat: '.0%' } }} x="Years" y="Below previous peak" height={220} />
        </Playground>
        <TryThis
          items={[
            'Keep Developed equity and 10 years, and click through seeds 1–20. Write down the highest and lowest Sharpe you see. The true Sharpe is (7% − 2.5%)/16% ≈ 0.28 every time.',
            'Switch to Govt bonds. The drawdowns are much smaller, but so is the return. Which one has the better Sharpe?',
            'Set 40 years. Estimates settle down, but even 40 years of data pin down the equity mean return only to about σ/√T = 16%/√40 ≈ ±2.5% a year (one standard error). That is as big as the difference between most asset classes.',
          ]}
        />
        <TexBlock>{String.raw`SR = \frac{\bar R - r_f}{\sigma}, \qquad \text{Sortino} = \frac{\bar R - r_f}{\sigma_{\text{down}}}, \qquad \text{Calmar} = \frac{\text{CAGR}}{|\text{MaxDD}|}`}</TexBlock>
        <Example title="Worked example: annualising">
          Monthly mean 0.6%, monthly vol 4.5%, risk-free 2.5% a year. Annual mean ≈ 12 × 0.6% = 7.2%; annual vol = 4.5% × √12 =
          15.6%; Sharpe = (7.2% − 2.5%)/15.6% = 0.30. Mean scales with time, vol with the <em>square root</em> of time (
          <Term name="Annualisation">annualisation</Term>).
        </Example>
        <CodeRef file="src/models/returns.ts" />
      </Section>

      <Section title="4. Reading a factsheet critically">
        <ul>
          <li><strong>Period chosen:</strong> “since inception” starting right after a crash flatters everything. Ask for calendar-year returns.</li>
          <li><strong>Arithmetic vs geometric:</strong> an average of yearly returns is higher than what investors earned.</li>
          <li><strong>Gross vs net of fees:</strong> the client earns net.</li>
          <li><strong>Smoothed prices:</strong> illiquid assets (private equity, property funds) show low vol and high Sharpe because valuations are stale.</li>
          <li><strong>Sharpe hides tails:</strong> strategies that sell insurance (short options) have high Sharpe until the crash. Look at max drawdown and the worst month.</li>
          <li><strong>Survivorship:</strong> the funds you see are the ones that survived.</li>
        </ul>
        <OnTheJob>
          As a junior analyst you will compute these numbers every week, for your own funds and for competitors in “peer
          group” reports. Getting the annualisation and the risk-free rate right, and noticing when a number looks too good, is
          what gets you trusted with more.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'Simple returns add across assets; log returns add across time.',
          'Geometric return ≈ arithmetic − σ²/2: volatility costs compound growth.',
          'Annualise means ×12 and vol ×√12 for monthly data (if returns are independent).',
          'Sharpe = excess return / vol; complement it with Sortino, max drawdown and Calmar.',
          'A 10-year track record is a noisy estimate: luck can easily double or halve a Sharpe ratio.',
        ]}
      />
      <InterviewCorner id="returns" />
      <Quiz
        questions={[
          {
            q: 'Returns of +20%, −10%, +20%, −10%. The geometric annual return is…',
            options: ['5.0%', 'About 3.9%', '0%', 'About 7.5%'],
            answer: 1,
            why: '1.2 × 0.9 = 1.08 every two years, so √1.08 − 1 ≈ 3.92% a year. The arithmetic mean (5%) overstates it.',
          },
          {
            q: 'Weekly volatility is 2%. Annual volatility is about…',
            options: ['2%', '14.4%', '104%', '28%'],
            answer: 1,
            why: '2% × √52 ≈ 2% × 7.2 = 14.4%.',
          },
          {
            q: 'Fund X: return 9%, vol 15%. Fund Y: return 6%, vol 7%. Risk-free 2%. Which has the higher Sharpe ratio?',
            options: ['X (0.47)', 'Y (0.57)', 'Equal', 'Need the drawdown to tell'],
            answer: 1,
            why: 'X: (9 − 2)/15 = 0.47. Y: (6 − 2)/7 = 0.57. With leverage you could scale Y to X’s risk and earn more.',
          },
        ]}
      />
      <LessonFooter id="returns" />
    </article>
  );
}
