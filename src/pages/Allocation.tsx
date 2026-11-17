import { useMemo, useState } from 'react';
import { Chart, line, palette } from '../components/Chart';
import { Playground, Slider, Stats, num, pct } from '../components/Controls';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Takeaways, Term, TryThis } from '../components/Lesson';
import { simulateHistory, universe } from '../data/assets';
import { backtestRebalance, glidePath, shortfallProbability, simulateWealth, type RebalanceRule } from '../models/allocation';
import { portfolioReturn, portfolioVol } from '../models/meanVariance';
import { annualizedReturn, annualizedVol, maxDrawdown, returnsFromPrices } from '../models/returns';

const U = universe(['equity', 'govt']);
const eur = (v: number) => `€${Math.round(v).toLocaleString('en')}`;

export default function Allocation() {
  // ── Monte Carlo ──
  const [initial, setInitial] = useState(20000);
  const [contrib, setContrib] = useState(6000);
  const [years, setYears] = useState(30);
  const [eq, setEq] = useState(0.7);
  const [goal, setGoal] = useState(500000);
  const mu = portfolioReturn([eq, 1 - eq], U.mu);
  const sigma = portfolioVol([eq, 1 - eq], U.cov);
  const fan = useMemo(() => simulateWealth({ initial, contribution: contrib, mu, sigma, years, paths: 3000 }), [initial, contrib, mu, sigma, years]);
  const pShort = shortfallProbability(fan.finals, goal);
  const paidIn = initial + contrib * years;

  // ── Rebalancing ──
  const [seed, setSeed] = useState(4);
  const [band, setBand] = useState(0.05);
  const [cost, setCost] = useState(10);
  const hist = useMemo(() => simulateHistory(['equity', 'govt'], 30 * 12, seed), [seed]);
  const rules: { rule: RebalanceRule; name: string; color: string }[] = [
    { rule: 'never', name: 'Never (buy & hold)', color: palette[3] },
    { rule: 'annual', name: 'Annually', color: palette[0] },
    { rule: 'threshold', name: `Bands ±${(band * 100).toFixed(0)}%`, color: palette[2] },
    { rule: 'monthly', name: 'Monthly', color: palette[5] },
  ];
  const results = rules.map((r) => ({ ...r, res: backtestRebalance(hist[0], hist[1], 0.6, r.rule, band, cost) }));
  const t = results[0].res.wealth.map((_, i) => i / 12);

  // ── Glide path ──
  const ages = Array.from({ length: 46 }, (_, i) => 22 + i);

  return (
    <article>
      <LessonHeader id="allocation" />

      <Section title="1. Strategic and tactical allocation">
        <InPlainWords>
          The <Term name="Strategic asset allocation">strategic asset allocation</Term> is the long-run recipe: say 60% global
          equities, 30% bonds, 10% real estate. It is set from the client’s goals and the house{' '}
          <Term name="Capital market assumptions">capital market assumptions</Term>, approved by an investment committee and
          reviewed every few years. <Term name="Tactical asset allocation">Tactical allocation</Term> is a deliberate,
          temporary tilt away from it (“overweight equities by 3% for the next six months”) within agreed limits.
        </InPlainWords>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th></th><th>Strategic (SAA)</th><th>Tactical (TAA)</th></tr></thead>
            <tbody>
              <tr><td>Horizon</td><td>5–10+ years</td><td>Weeks to 18 months</td></tr>
              <tr><td>Based on</td><td>Objectives, liabilities, long-run CMAs</td><td>Valuation, momentum, macro views</td></tr>
              <tr><td>Decided by</td><td>Board / investment committee</td><td>CIO, allocation team, within limits</td></tr>
              <tr><td>Measured against</td><td>The client’s goal or liabilities</td><td>The SAA itself</td></tr>
              <tr><td>Typical deviation</td><td>—</td><td>±2–10% per asset class</td></tr>
            </tbody>
          </table>
        </div>
        <Note title="How much does the SAA matter?">
          Brinson, Hood and Beebower (1986) found that the policy mix explains over 90% of the <em>variation</em> of a pension fund’s
          returns over time. That is often misquoted as “90% of the return”, but the point stands: for a diversified fund, the
          stock/bond mix matters far more than which stocks or managers you pick.
        </Note>
      </Section>

      <Section title="2. Will the client reach the goal? Monte Carlo">
        <p>
          Advisers and pension funds don’t promise a return; they show a range of outcomes. A{' '}
          <Term name="Monte Carlo simulation">Monte Carlo simulation</Term> draws thousands of possible futures from the capital
          market assumptions and reports percentiles and the <Term name="Shortfall probability">probability of missing the goal</Term>.
        </p>
        <Playground
          controls={
            <>
              <Slider label="Starting wealth" value={initial} min={0} max={200000} step={5000} onChange={setInitial} format={eur} />
              <Slider label="Saving per year" value={contrib} min={0} max={30000} step={500} onChange={setContrib} format={eur} />
              <Slider label="Years" value={years} min={5} max={45} step={1} onChange={setYears} format={(v) => `${v}y`} />
              <Slider label="Equity share (rest bonds)" value={eq} min={0} max={1} step={0.05} onChange={setEq} format={(v) => pct(v, 0)} />
              <div className="muted" style={{ fontSize: 13 }}>This mix: expected return {pct(mu, 1)}, vol {pct(sigma, 1)}, Sharpe {num((mu - 0.025) / sigma, 2)}.</div>
              <Slider label="Goal" value={goal} min={50000} max={2000000} step={10000} onChange={setGoal} format={eur} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Median outcome', value: eur(fan.p50[years]), hint: `paid in ${eur(paidIn)}` },
              { label: 'Bad case (5th pct.)', value: eur(fan.p5[years]) },
              { label: 'Good case (95th pct.)', value: eur(fan.p95[years]) },
              { label: 'Chance of missing goal', value: pct(pShort, 0) },
            ]}
          />
          <Chart
            data={[
              line(fan.years, fan.p95, '95th percentile', { line: { color: palette[0], width: 0 }, showlegend: false }),
              line(fan.years, fan.p5, '5–95% range', { fill: 'tonexty', fillcolor: 'rgba(31,111,180,0.12)', line: { color: palette[0], width: 0 } }),
              line(fan.years, fan.p75, '75th percentile', { line: { color: palette[0], width: 0 }, showlegend: false }),
              line(fan.years, fan.p25, '25–75% range', { fill: 'tonexty', fillcolor: 'rgba(31,111,180,0.25)', line: { color: palette[0], width: 0 } }),
              line(fan.years, fan.p50, 'Median', { line: { color: palette[0], width: 3 } }),
              line(fan.years, fan.years.map(() => goal), 'Goal', { line: { color: palette[3], dash: 'dash' } }),
            ]}
            x="Years"
            y="Wealth (€)"
          />
        </Playground>
        <TryThis
          items={[
            'Move equities from 30% to 90% at a 30-year horizon. The median rises a lot, but so does the spread. Does the chance of missing the goal fall or rise?',
            'Shorten the horizon to 5 years and repeat. With little time, more equity can make missing a near-term goal more likely.',
            'Raise saving by €2,000 a year. Saving more is the one lever that improves the bad case and the median at the same time.',
          ]}
        />
      </Section>

      <Section title="3. Rebalancing: keeping the risk you chose">
        <p>
          Markets move weights away from the target. Left alone, a 60/40 drifts towards whatever did best: usually equities, so
          the portfolio quietly takes more risk than the client agreed. <Term name="Rebalancing">Rebalancing</Term> brings it back, at
          the cost of trading (<Term name="Turnover">turnover</Term>). Below: 30 simulated years of a 60/40, under four rules.
        </p>
        <Playground
          controls={
            <>
              <Slider label="Simulated history (seed)" value={seed} min={1} max={40} step={1} onChange={setSeed} />
              <Slider label="Band width (for the band rule)" value={band} min={0.01} max={0.15} step={0.01} onChange={setBand} format={(v) => `±${(v * 100).toFixed(0)}%`} />
              <Slider label="Trading cost" value={cost} min={0} max={50} step={1} onChange={setCost} format={(v) => `${v}bp`} />
            </>
          }
        >
          <Chart
            data={results.map((r) => line(t, r.res.weight1, r.name, { line: { color: r.color, width: r.rule === 'never' ? 3 : 2 } }))}
            layout={{ yaxis: { tickformat: '.0%' } }}
            x="Years"
            y="Equity weight"
            height={300}
          />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Rule</th><th>Annual return</th><th>Volatility</th><th>Max drawdown</th><th>Trades</th><th>Avg. turnover / yr</th></tr></thead>
              <tbody>
                {results.map((r) => {
                  const rets = returnsFromPrices(r.res.wealth);
                  return (
                    <tr key={r.rule}>
                      <td>{r.name}</td>
                      <td>{pct(annualizedReturn(rets), 2)}</td>
                      <td>{pct(annualizedVol(rets), 1)}</td>
                      <td>{pct(maxDrawdown(r.res.wealth), 1)}</td>
                      <td>{r.res.trades}</td>
                      <td>{pct(r.res.turnover / 30, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Playground>
        <TryThis
          items={[
            'Click through several seeds. Buy-and-hold often ends with more wealth (equities usually win) but with higher volatility and a deeper drawdown: it is a different, riskier portfolio by the end.',
            'Compare monthly with ±5% bands. The bands achieve nearly the same risk control with a small fraction of the trades.',
            'Raise trading costs to 50bp. Monthly rebalancing now has a visible cost; this is why most institutions use bands.',
          ]}
        />
        <CodeRef file="src/models/allocation.ts">Monte Carlo savings plans, rebalancing rules and the glide path.</CodeRef>
      </Section>

      <Section title="4. Glide paths and human capital">
        <p>
          Target-date and lifecycle pension products cut equity exposure as members approach retirement. The reason is not that
          older people are more scared: it is <Term name="Human capital">human capital</Term>. A 25-year-old’s future salary is a
          large, bond-like asset, so their financial portfolio can carry the equity risk. By 64, human capital is almost gone and
          a crash cannot be made up by working longer.
        </p>
        <Chart
          data={[
            line(ages, ages.map((a) => glidePath(67 - a)), 'Equity share', { line: { color: palette[0], width: 3 }, fill: 'tozeroy', fillcolor: 'rgba(31,111,180,0.1)' }),
          ]}
          layout={{ yaxis: { tickformat: '.0%', range: [0, 1] } }}
          x="Age"
          y="Equity share of the pension"
          height={280}
        />
        <Example title="Danish market-rate pensions">
          Many Danish labour-market pension funds run lifecycle products where the risk profile follows the member’s age in a
          similar way. Being able to explain the human-capital argument is useful in interviews at any pension fund.
        </Example>
        <OnTheJob>
          A classic graduate project in a multi-asset or pension team: rerun the Monte Carlo with the new year’s capital market
          assumptions and write the memo explaining why the recommended allocation changed (or didn’t). Clear writing matters as
          much as the model.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'The strategic allocation (SAA) is the long-run mix and explains most of a diversified fund’s risk; TAA is a limited, temporary tilt.',
          'Monte Carlo shows the range of outcomes and the probability of missing a goal, not a single forecast.',
          'Without rebalancing, risk drifts up; band rules control drift with far less trading than calendar rules.',
          'Glide paths de-risk with age because human capital, a bond-like asset, runs down.',
        ]}
      />
      <InterviewCorner id="allocation" />
      <Quiz
        questions={[
          {
            q: 'A 60/40 portfolio has not been rebalanced through a long bull market. Its risk is now…',
            options: ['Lower than intended', 'As intended', 'Higher than intended', 'Impossible to tell'],
            answer: 2,
            why: 'Equities outgrew bonds, so the equity weight (and therefore volatility) has drifted above the 60% target.',
          },
          {
            q: 'Who normally approves the strategic asset allocation of a pension fund?',
            options: ['A junior analyst', 'The trading desk', 'The board or investment committee', 'The custodian'],
            answer: 2,
            why: 'The SAA is the most important decision and is owned by the governing body; the investment team proposes and implements it.',
          },
          {
            q: 'Why do lifecycle funds hold more equities for young members?',
            options: ['Young people like risk', 'Equities always outperform over 10 years', 'Young members have lots of bond-like human capital', 'Regulation requires it'],
            answer: 2,
            why: 'Counting future earnings, a young saver’s total wealth is already mostly “bonds”; the financial portfolio can therefore hold more equity.',
          },
        ]}
      />
      <LessonFooter id="allocation" />
    </article>
  );
}
