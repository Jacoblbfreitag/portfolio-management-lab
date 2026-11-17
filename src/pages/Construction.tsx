import { useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { Chart, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { AssetLegend } from '../components/Weights';
import { RF, riskyIds, simulateHistory, universe } from '../data/assets';
import { blackLitterman, equalWeights, inverseVolWeights, riskBudgetWeights, riskShares } from '../models/construction';
import { covMatrix, mean } from '../models/stats';
import { longOnlyFrontier, maxSharpePoint, optimizeMeanVariance, portfolioReturn, portfolioVol } from '../models/meanVariance';

const U = universe(riskyIds);
const MKT = [0.28, 0.16, 0.03, 0.4, 0.07, 0.04, 0.02];

/** Stacked bars, one bar per portfolio, one colour per asset. */
function stacked(labels: string[], rows: number[][]): Data[] {
  return U.assets.map((a, i) => ({ x: labels, y: rows.map((r) => r[i]), type: 'bar', name: a.short, marker: { color: a.color }, hovertemplate: `${a.short}: %{y:.1%}<extra></extra>` }) as Data);
}

export default function Construction() {
  // ── Estimation error ──
  const [years, setYears] = useState(10);
  const [shrink, setShrink] = useState(0);
  const trials = useMemo(() => {
    return Array.from({ length: 8 }, (_, k) => {
      const h = simulateHistory(riskyIds, years * 12, 100 + k);
      const muHat = h.map((r) => mean(r) * 12);
      const grand = mean(muHat);
      const muS = muHat.map((m) => (1 - shrink) * m + shrink * grand);
      const covHat = covMatrix(h).map((row) => row.map((x) => x * 12));
      return optimizeMeanVariance(muS, covHat, 4, { iterations: 2500 });
    });
  }, [years, shrink]);
  const trueW = useMemo(() => optimizeMeanVariance(U.mu, U.cov, 4, { iterations: 2500 }), []);

  // ── Risk-based portfolios ──
  const strategies = useMemo(() => {
    const frontier = longOnlyFrontier(U.mu, U.cov, { points: 40 });
    const s6040 = U.assets.map((a) => (a.id === 'equity' ? 0.6 : a.id === 'govt' ? 0.4 : 0));
    return [
      { name: '60/40', w: s6040 },
      { name: 'Equal weight', w: equalWeights(U.mu.length) },
      { name: 'Inverse vol', w: inverseVolWeights(U.cov) },
      { name: 'Risk parity', w: riskBudgetWeights(U.cov) },
      { name: 'Min variance', w: frontier[0].weights },
      { name: 'Max Sharpe', w: maxSharpePoint(frontier, RF).weights },
    ];
  }, []);
  const [lev, setLev] = useState(1);
  const rp = strategies[3].w;
  const rpRet = RF + lev * (portfolioReturn(rp, U.mu) - RF);
  const rpVol = lev * portfolioVol(rp, U.cov);

  // ── Black–Litterman ──
  const [emView, setEmView] = useState(0.03);
  const [emConf, setEmConf] = useState(0.5);
  const [useCmdty, setUseCmdty] = useState<'off' | 'on'>('off');
  const [cmdtyView, setCmdtyView] = useState(0.0);
  const bl = useMemo(() => {
    const p1 = U.mu.map(() => 0);
    p1[riskyIds.indexOf('em')] = 1;
    p1[riskyIds.indexOf('equity')] = -1;
    const views = [{ p: p1, q: emView, confidence: emConf }];
    if (useCmdty === 'on') {
      const p2 = U.mu.map(() => 0);
      p2[riskyIds.indexOf('cmdty')] = 1;
      views.push({ p: p2, q: cmdtyView, confidence: 0.6 });
    }
    return blackLitterman(U.cov, MKT, views, { delta: 2.5, tau: 0.05 });
  }, [emView, emConf, useCmdty, cmdtyView]);
  const naive = useMemo(() => {
    // Plug the same view straight into the CMAs: EM return = DM return + view.
    const mu = U.mu.slice();
    mu[riskyIds.indexOf('em')] = mu[riskyIds.indexOf('equity')] + emView;
    return maxSharpePoint(longOnlyFrontier(mu, U.cov, { points: 30 }), RF).weights;
  }, [emView]);

  const labels = U.assets.map((a) => a.short);

  return (
    <article>
      <LessonHeader id="construction" />

      <Section title="1. Why raw Markowitz fails: estimation error">
        <InPlainWords>
          The optimiser in Module 2 trusts its inputs completely. But expected returns are estimated from noisy history and
          are wrong by several percent. The optimiser then piles into whatever looks best <em>by mistake</em>. Richard Michaud
          called mean–variance optimisers “error maximisers”. This is the single most important practical lesson about them.
        </InPlainWords>
        <p>
          Each bar below is the optimal long-only portfolio estimated from a different simulated history. Every history comes
          from the <em>same</em> true distribution, so the right answer is the same every time (the first bar).
        </p>
        <Playground
          controls={
            <>
              <Slider label="Years of history used" value={years} min={3} max={50} step={1} onChange={setYears} format={(v) => `${v}y`} />
              <Slider label={<><Term name="Shrinkage">Shrink</Term> means to the grand mean</>} value={shrink} min={0} max={1} step={0.05} onChange={setShrink} format={(v) => pct(v, 0)} />
              <AssetLegend assets={U.assets} />
            </>
          }
        >
          <Chart
            data={stacked(['True', ...trials.map((_, k) => `History ${k + 1}`)], [trueW, ...trials])}
            layout={{ barmode: 'stack', yaxis: { tickformat: '.0%', range: [0, 1] }, showlegend: false, hovermode: 'closest' }}
            x=""
            y="Weight"
            height={340}
          />
        </Playground>
        <TryThis
          items={[
            'With 10 years of data, the “optimal” portfolios are all different, and often concentrated in one or two assets. Which history would you have bet your client’s money on?',
            'Raise the history to 50 years. Better, but still unstable: means converge slowly (σ/√T).',
            'Set shrinkage to 70–100%. Weights become far more stable because the optimiser now relies on the covariance matrix, which is estimated much better than the means.',
          ]}
        />
        <Note title="What practitioners do instead">
          Constrain the weights (caps, floors), shrink inputs towards a neutral target, use risk-based methods that need no
          return forecasts (section 2), or start from market equilibrium and add views (section 3). All are ways of managing{' '}
          <Term name="Estimation error">estimation error</Term>.
        </Note>
      </Section>

      <Section title="2. Who is really taking the risk? Risk contributions and risk parity">
        <p>
          Capital weights hide where the risk is. The <Term name="Risk contribution">risk contribution</Term> of each holding
          tells you how much of the portfolio’s volatility it causes. The contributions add up exactly to the total:
        </p>
        <TexBlock>{String.raw`RC_i = w_i\,\frac{(\Sigma w)_i}{\sigma_p}, \qquad \sum_i RC_i = \sigma_p`}</TexBlock>
        <Symbols
          items={[
            ['w_i', 'Capital weight of asset i'],
            ['(\\Sigma w)_i', 'Covariance of asset i with the whole portfolio'],
            ['\\sigma_p', 'Portfolio volatility'],
          ]}
        />
        <div className="grid-2">
          <Chart data={stacked(strategies.map((s) => s.name), strategies.map((s) => s.w))} layout={{ barmode: 'stack', yaxis: { tickformat: '.0%', range: [0, 1] }, showlegend: false, title: { text: 'Capital weights', font: { size: 13 } }, hovermode: 'closest' }} x="" y="" height={320} />
          <Chart data={stacked(strategies.map((s) => s.name), strategies.map((s) => riskShares(s.w, U.cov)))} layout={{ barmode: 'stack', yaxis: { tickformat: '.0%', range: [0, 1] }, showlegend: false, title: { text: 'Risk contributions', font: { size: 13 } }, hovermode: 'closest' }} x="" y="" height={320} />
        </div>
        <AssetLegend assets={U.assets} />
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="data">
            <thead><tr><th>Portfolio</th><th>Expected return</th><th>Volatility</th><th>Sharpe</th><th>Equity risk share</th><th>Needs return forecasts?</th></tr></thead>
            <tbody>
              {strategies.map((s) => {
                const r = portfolioReturn(s.w, U.mu);
                const v = portfolioVol(s.w, U.cov);
                const sh = riskShares(s.w, U.cov);
                const eqShare = sh[riskyIds.indexOf('equity')] + sh[riskyIds.indexOf('em')];
                return (
                  <tr key={s.name}>
                    <td>{s.name}</td><td>{pct(r, 2)}</td><td>{pct(v, 1)}</td><td>{num((r - RF) / v, 2)}</td><td>{pct(eqShare, 0)}</td>
                    <td>{s.name === 'Max Sharpe' ? 'Yes' : s.name === '60/40' ? 'No (convention)' : 'No'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          A 60/40 portfolio is 60% equities by capital but well over 90% by risk. <Term name="Risk parity">Risk parity</Term> gives
          every asset an equal risk share, which means a lot of bonds and a low expected return. Risk-parity funds therefore use{' '}
          <Term name="Leverage">leverage</Term> to reach a useful return:
        </p>
        <Playground controls={<Slider label="Leverage on risk parity" value={lev} min={1} max={3} step={0.1} onChange={setLev} format={(v) => `${v.toFixed(1)}×`} />}>
          <Stats
            items={[
              { label: 'Levered return', value: pct(rpRet, 2), hint: 'borrowing at the cash rate' },
              { label: 'Levered vol', value: pct(rpVol, 1) },
              { label: '60/40 for comparison', value: `${pct(portfolioReturn(strategies[0].w, U.mu), 1)} / ${pct(portfolioVol(strategies[0].w, U.cov), 1)}`, hint: 'return / vol' },
            ]}
          />
        </Playground>
        <TryThis
          items={[
            'Find the leverage at which risk parity has the same vol as the 60/40. Is its return higher? That is the whole pitch for risk parity: a better-diversified portfolio, levered up.',
            <>Compare <Term name="Inverse-volatility weighting">inverse vol</Term> and risk parity. They are close; inverse vol is the version you can compute on a napkin.</>,
          ]}
        />
        <CodeRef file="src/models/construction.ts">Risk contributions, inverse-vol, and risk budgeting by cyclical coordinate descent.</CodeRef>
      </Section>

      <Section title="3. Black–Litterman: start from the market, add your views">
        <p>
          Instead of estimating expected returns from history, reverse the problem: what returns would make the global
          market portfolio optimal? These <Term name="Implied equilibrium returns">implied equilibrium returns</Term> are a neutral
          starting point. Then the <Term name="Black–Litterman model">Black–Litterman model</Term> tilts them towards your views,
          by as much as your confidence justifies.
        </p>
        <TexBlock>{String.raw`\Pi = \delta\,\Sigma\,w_{\text{mkt}}, \qquad \mu_{BL} = \big[(\tau\Sigma)^{-1} + P^\top\Omega^{-1}P\big]^{-1}\big[(\tau\Sigma)^{-1}\Pi + P^\top\Omega^{-1}Q\big]`}</TexBlock>
        <Symbols
          items={[
            ['\\Pi', 'Implied equilibrium returns'],
            ['\\delta', 'Market risk aversion (2.5 here)'],
            ['P,\\,Q', 'Which assets each view is about, and what it says'],
            ['\\Omega', 'Uncertainty of the views (lower = more confident)'],
            ['\\tau', 'Uncertainty of the equilibrium prior (0.05 here)'],
          ]}
        />
        <Playground
          controls={
            <>
              <Slider label="View 1: EM beats DM equity by" value={emView} min={-0.05} max={0.08} step={0.0025} onChange={setEmView} format={(v) => pct(v, 2)} />
              <Slider label="Confidence in view 1" value={emConf} min={0.05} max={0.95} step={0.05} onChange={setEmConf} format={(v) => pct(v, 0)} />
              <Toggle label="View 2: commodities return…" value={useCmdty} onChange={setUseCmdty} options={[{ value: 'off', label: 'No view' }, { value: 'on', label: 'Set a view' }]} />
              {useCmdty === 'on' && <Slider label="Commodities expected return" value={cmdtyView} min={-0.05} max={0.1} step={0.005} onChange={setCmdtyView} format={(v) => pct(v, 1)} />}
            </>
          }
        >
          <Chart
            data={[
              { x: labels, y: bl.prior, type: 'bar', name: 'Equilibrium Π', marker: { color: palette[5] } } as Data,
              { x: labels, y: bl.posterior, type: 'bar', name: 'Black–Litterman', marker: { color: palette[0] } } as Data,
            ]}
            layout={{ barmode: 'group', yaxis: { tickformat: '.1%' }, title: { text: 'Expected returns', font: { size: 13 } } }}
            x=""
            y=""
            height={280}
          />
          <Chart
            data={[
              { x: labels, y: MKT, type: 'bar', name: 'Market weights', marker: { color: palette[5] } } as Data,
              { x: labels, y: bl.weights, type: 'bar', name: 'Black–Litterman weights', marker: { color: palette[0] } } as Data,
              { x: labels, y: naive, type: 'bar', name: 'Naive: view plugged into Markowitz', marker: { color: palette[1] } } as Data,
            ]}
            layout={{ barmode: 'group', yaxis: { tickformat: '.0%' }, title: { text: 'Portfolio weights', font: { size: 13 } } }}
            x=""
            y=""
            height={300}
          />
        </Playground>
        <TryThis
          items={[
            'Set view 1 to the equilibrium difference (move it until EM and DM weights equal the market’s). A view that agrees with the market changes nothing.',
            'Set view 1 to +3% and raise confidence from 10% to 90%. The tilt from DM to EM grows smoothly. Compare the orange bars: plugging the same view straight into Markowitz gives a corner solution.',
            'Turn on a commodities view of 8%. Only commodities and the assets correlated with them move: Black–Litterman spreads a view through the covariance matrix.',
          ]}
        />
        <Example title="Why the industry likes it">
          Black–Litterman (Goldman Sachs, 1990–92) solves the two complaints PMs have about optimisers: you do not need a return
          forecast for every asset, and the portfolios look sensible: the market, plus tilts you can explain to an investment
          committee in one sentence each.
        </Example>
        <OnTheJob>
          Multi-asset and quant teams use exactly these tools. A typical junior task is to rerun the risk contribution report
          after a rebalance, or to translate the house views from the strategy meeting into Black–Litterman inputs and check that the
          resulting tilts stay inside the tracking-error budget.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'Optimisers amplify errors in expected returns; unconstrained outputs are unstable and concentrated.',
          'Fixes: constraints, shrinkage, risk-based methods, and equilibrium-plus-views (Black–Litterman).',
          'Risk contributions add up to total vol; a 60/40 has over 90% of its risk in equities.',
          'Risk parity equalises risk contributions and usually needs leverage to reach a useful return.',
          'Black–Litterman starts from implied returns Π = δΣw_mkt and tilts towards views in proportion to confidence.',
        ]}
      />
      <InterviewCorner id="construction" />
      <Quiz
        questions={[
          {
            q: 'Which input to a mean–variance optimiser is estimated least precisely?',
            options: ['Volatilities', 'Correlations', 'Expected returns', 'The risk-free rate'],
            answer: 2,
            why: 'The standard error of a mean is σ/√T: about 2.5% a year for equities even with 40 years of data. Volatilities and correlations are estimated far more precisely, especially from daily data.',
          },
          {
            q: 'In a risk-parity portfolio of stocks and bonds, compared with 60/40 you would typically see…',
            options: ['More equities', 'More bonds, often with leverage', 'Only cash', 'The same weights'],
            answer: 1,
            why: 'Bonds are about a third as volatile as equities, so equal risk requires roughly three times as much in bonds. To get a competitive return the portfolio is then levered.',
          },
          {
            q: 'With no views, Black–Litterman recommends…',
            options: ['Equal weights', 'The minimum-variance portfolio', 'The market portfolio', 'All cash'],
            answer: 2,
            why: 'The prior returns are reverse-engineered to make the market portfolio optimal, so with no views the answer is the market itself.',
          },
        ]}
      />
      <LessonFooter id="construction" />
    </article>
  );
}

