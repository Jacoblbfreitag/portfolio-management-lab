import { useState } from 'react';
import type { Data } from 'plotly.js';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, pct } from '../components/Controls';
import { InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Takeaways, Term, TryThis, Example } from '../components/Lesson';
import { universe } from '../data/assets';
import { portfolioReturn, portfolioVol } from '../models/meanVariance';
import { normInv } from '../models/risk';

const u = universe(['equity', 'govt']);

export default function Basics() {
  const [eq, setEq] = useState(0.6);
  const [amount, setAmount] = useState(100000);
  const w = [eq, 1 - eq];
  const mu = portfolioReturn(w, u.mu);
  const vol = portfolioVol(w, u.cov);
  const bad = mu - normInv(0.95) * vol;
  const good = mu + normInv(0.95) * vol;
  const mixes = linspace(0, 1, 101);

  const [aum, setAum] = useState(20);
  const [feeBps, setFeeBps] = useState(45);
  const [costs, setCosts] = useState(55);
  const revenue = (aum * 1e9 * feeBps) / 1e4 / 1e6; // €m
  const profit = revenue - costs;

  return (
    <article>
      <LessonHeader id="basics" />

      <Section title="1. Who manages money, for whom">
        <InPlainWords>
          Somebody has money they need to grow or protect: a pension fund that has promised pensions, an insurer that has to
          pay claims, a family saving for retirement. They are the <Term name="Asset owner">asset owners</Term>. Many of them
          hire specialists to invest it: <Term name="Asset manager">asset managers</Term>, paid a fee on the money they run.
          Together they make up the <Term name="Buy side">buy side</Term>. Banks and brokers that sell them research and trading
          are the <Term name="Sell side">sell side</Term>.
        </InPlainWords>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Type</th><th>What they need</th><th>Typical horizon</th><th>Examples</th></tr>
            </thead>
            <tbody>
              <tr><td><Term name="Pension fund">Pension fund</Term> / sovereign fund</td><td>Pay promised or target pensions; preserve national wealth</td><td>Decades</td><td>ATP, PFA, PensionDanmark, Norway’s NBIM (a sovereign fund)</td></tr>
              <tr><td>Insurer</td><td>Match claims and guaranteed returns, under solvency rules</td><td>Years to decades</td><td>Life and non-life insurers</td></tr>
              <tr><td>Asset manager</td><td>Beat or track a benchmark for clients, grow AUM</td><td>Set by the mandate</td><td>Bank-owned managers, independent houses, global firms</td></tr>
              <tr><td>Wealth manager / private bank</td><td>Advice and portfolios for individuals and families</td><td>The client’s life</td><td>Private banking arms of banks</td></tr>
              <tr><td>Hedge fund</td><td>Absolute returns, often market-neutral</td><td>Months to years</td><td>Multi-strategy, macro, long/short equity</td></tr>
              <tr><td>Endowment / foundation</td><td>Fund spending forever</td><td>Perpetual</td><td>University endowments, industrial foundations</td></tr>
            </tbody>
          </table>
        </div>
        <Note title="Denmark and the Nordics">
          The Nordic buy side is dominated by large pension funds, many of which run most of their money in-house, plus the
          asset-management arms of the big banks and a group of independent managers. That means many entry-level jobs are at
          asset owners, not only at classic fund managers: worth knowing when you look for openings.
        </Note>
      </Section>

      <Section title="2. The investment process">
        <p>Every professional portfolio, from a €50k private client to a €100bn pension fund, runs through the same loop:</p>
        <div className="roadmap">
          <div><strong>1. Understand the client</strong><span>Objectives, <Term name="Risk tolerance">risk tolerance</Term>, horizon, liquidity, constraints → the <Term name="Investment policy statement">IPS</Term></span></div>
          <div><strong>2. Strategic allocation</strong><span>The long-run mix of asset classes (Module 6)</span></div>
          <div><strong>3. Portfolio construction</strong><span>Choosing securities or managers and sizing them (Modules 2–4)</span></div>
          <div><strong>4. Implementation</strong><span>Trading at low cost (Module 9)</span></div>
          <div><strong>5. Monitoring &amp; risk</strong><span>Rebalancing, limits, stress tests (Modules 6, 8)</span></div>
          <div><strong>6. Measurement</strong><span>Performance vs the <Term name="Benchmark">benchmark</Term> and attribution (Module 7)</span></div>
        </div>
        <OnTheJob>
          <p style={{ marginTop: 0 }}>The jobs map onto the loop. Entry-level titles vary, but these are the main seats:</p>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Role</th><th>What you do all day</th><th>Modules that matter most</th></tr></thead>
              <tbody>
                <tr><td>Investment / research analyst</td><td>Research companies, sectors or asset classes; build models; pitch ideas to the PM</td><td>1, 3, 7</td></tr>
                <tr><td><Term name="Portfolio manager">Portfolio manager</Term></td><td>Make the decisions, size positions, answer for performance</td><td>All</td></tr>
                <tr><td>Multi-asset / allocation analyst</td><td>Capital market assumptions, SAA studies, tactical views</td><td>2, 4, 6</td></tr>
                <tr><td>Quant analyst</td><td>Factor models, optimisers, backtests, risk models</td><td>3, 4, 8, 9</td></tr>
                <tr><td>Risk manager</td><td>Measure and limit risk, run stress tests, challenge PMs</td><td>8, 5</td></tr>
                <tr><td>Performance analyst</td><td>Returns, attribution, client reporting</td><td>7</td></tr>
                <tr><td>ALM / LDI analyst (pensions, insurance)</td><td>Match assets to liabilities, hedge rates and inflation</td><td>5, 6</td></tr>
                <tr><td>Investment specialist / client portfolio manager</td><td>Explain the strategy to clients and consultants</td><td>7, 9</td></tr>
              </tbody>
            </table>
          </div>
        </OnTheJob>
      </Section>

      <Section title="3. Your first portfolio: the stock/bond mix">
        <p>
          The most important decision for most investors is how much to put in equities versus bonds. Here are this course’s
          illustrative long-run assumptions: developed-market equities {pct(u.mu[0], 1)} expected return with {pct(u.vols[0], 0)}{' '}
          volatility, government bonds {pct(u.mu[1], 1)} with {pct(u.vols[1], 1)}, correlation {u.corr[0][1]}.
        </p>
        <Playground
          controls={
            <>
              <Slider label="Equity share" value={eq} min={0} max={1} step={0.05} onChange={setEq} format={(v) => `${(v * 100).toFixed(0)}% / ${(100 - v * 100).toFixed(0)}%`} />
              <Slider label="Amount invested" value={amount} min={10000} max={1000000} step={10000} onChange={setAmount} format={(v) => `€${v.toLocaleString('en')}`} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Expected return', value: pct(mu, 1), hint: `≈ €${Math.round(mu * amount).toLocaleString('en')} a year` },
              { label: 'Volatility', value: pct(vol, 1) },
              { label: 'A bad year (1 in 20)', value: pct(bad, 1), hint: `≈ €${Math.round(bad * amount).toLocaleString('en')}` },
              { label: 'A good year (1 in 20)', value: pct(good, 1) },
            ]}
          />
          <Chart
            data={[
              line(mixes.map((m) => portfolioVol([m, 1 - m], u.cov)), mixes.map((m) => portfolioReturn([m, 1 - m], u.mu)), 'All stock/bond mixes', { line: { color: palette[0], width: 3 }, hovertemplate: '%{x:.1%} vol, %{y:.1%} return<extra></extra>' }),
              { x: [vol], y: [mu], type: 'scatter', mode: 'markers+text', text: [`${(eq * 100).toFixed(0)}/${(100 - eq * 100).toFixed(0)}`], textposition: 'top left', name: 'Your mix', marker: { color: palette[3], size: 12 } } as Data,
            ]}
            layout={{ xaxis: { tickformat: '.0%' }, yaxis: { tickformat: '.1%' }, hovermode: 'closest' }}
            x="Volatility (risk)"
            y="Expected return"
          />
        </Playground>
        <TryThis
          items={[
            'Start at 0% equity and add equities in steps. Risk barely rises at first, and can even fall slightly: a little equity diversifies a bond portfolio. Module 2 explains why.',
            'Go to 100% equity. The expected return is about double that of bonds, but in a bad year (1 in 20) you lose around a fifth of the money. Would your client stay invested after that?',
            'Find the mix where the “bad year” is about −10%. That is a typical way an adviser turns a client’s loss tolerance into an allocation.',
          ]}
        />
        <Example title="Worked example: the 60/40">
          A 60/40 portfolio: expected return 0.6 × 7% + 0.4 × 3.2% = {pct(portfolioReturn([0.6, 0.4], u.mu), 2)}. Its volatility is
          not the weighted average (0.6 × 16% + 0.4 × 5.5% = 11.8%) but {pct(portfolioVol([0.6, 0.4], u.cov), 1)}, because the
          two assets are not perfectly correlated. Diversification is the only free lunch in finance.
        </Example>
      </Section>

      <Section title="4. How an asset manager makes money">
        <p>
          It helps in interviews to understand the business you are joining. A manager earns a percentage of{' '}
          <Term name="Assets under management">assets under management</Term>, while most of its costs (people, systems, data) are fixed.
        </p>
        <Playground
          controls={
            <>
              <Slider label="AUM (€bn)" value={aum} min={1} max={200} step={1} onChange={setAum} format={(v) => `€${v}bn`} />
              <Slider label="Average fee (bp a year)" value={feeBps} min={5} max={150} step={1} onChange={setFeeBps} format={(v) => `${v}bp`} />
              <Slider label="Annual costs (€m)" value={costs} min={10} max={500} step={5} onChange={setCosts} format={(v) => `€${v}m`} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Revenue', value: `€${revenue.toFixed(0)}m` },
              { label: 'Operating profit', value: `€${profit.toFixed(0)}m` },
              { label: 'Margin', value: revenue > 0 ? pct(profit / revenue, 0) : '—' },
              { label: 'If markets fall 20%', value: `€${(revenue * 0.8 - costs).toFixed(0)}m`, hint: 'profit, same costs' },
            ]}
          />
        </Playground>
        <TryThis
          items={[
            'Cut the fee from 45bp to 15bp, as clients move to passive funds. How much more AUM is needed to keep the same profit? This is why the industry keeps consolidating.',
            'Drop AUM 20% (a bear market). Profit falls far more than 20% because costs are fixed: operating leverage.',
          ]}
        />
      </Section>

      <Takeaways
        items={[
          'Asset owners (pensions, insurers, sovereign funds) own the money and its liabilities; asset managers invest it for a fee.',
          'The investment process runs from the client’s objectives to strategic allocation, construction, implementation, monitoring and measurement.',
          'The stock/bond mix is the biggest decision; portfolio risk is less than the weighted average of the parts.',
          'Asset managers’ revenue is AUM × fee, so profits swing with markets and fee pressure.',
        ]}
      />
      <InterviewCorner id="basics" />
      <Quiz
        questions={[
          {
            q: 'Which of these is an asset owner rather than an asset manager?',
            options: ['A mutual fund company', 'A pension fund', 'A broker', 'An index provider'],
            answer: 1,
            why: 'A pension fund owns its assets and its liabilities (the promised pensions). It may hire asset managers to invest part of the money.',
          },
          {
            q: 'What comes first in the investment process?',
            options: ['Picking stocks', 'Setting the strategic allocation', 'Understanding the client’s objectives and constraints', 'Measuring performance'],
            answer: 2,
            why: 'Everything else (allocation, construction, the benchmark) follows from what the client needs, written down in the investment policy statement.',
          },
          {
            q: 'Equities have 16% vol, bonds 5.5%, correlation −0.1. The vol of a 60/40 is…',
            options: ['Exactly 11.8%', 'Less than 11.8%', 'More than 11.8%', 'Cannot tell'],
            answer: 1,
            why: 'The weighted average of vols (11.8%) is only reached with correlation 1. With any lower correlation the portfolio is less risky; here about 9.6%.',
          },
        ]}
      />
      <LessonFooter id="basics" />
    </article>
  );
}
