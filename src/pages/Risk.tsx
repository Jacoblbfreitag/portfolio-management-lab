import { useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { Chart, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { normPdf } from '../models/math/normal';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { AssetLegend, WeightBar } from '../components/Weights';
import { riskyIds, scenarios, simulateHistory, universe } from '../data/assets';
import { componentVaR, historicalES, historicalVaR, parametricES, parametricVaR, stressLoss } from '../models/risk';
import { portfolioReturn, portfolioVol } from '../models/meanVariance';
import { mean, std } from '../models/stats';

const U = universe(riskyIds);
// govt, credit, hy, equity, em, reit, cmdty
const presets = {
  conservative: { name: 'Conservative', w: [0.45, 0.25, 0.05, 0.15, 0.03, 0.05, 0.02] },
  balanced: { name: 'Balanced', w: [0.25, 0.15, 0.05, 0.35, 0.08, 0.08, 0.04] },
  growth: { name: 'Growth', w: [0.08, 0.05, 0.05, 0.55, 0.15, 0.08, 0.04] },
};
type PresetId = keyof typeof presets;
const HIST = simulateHistory(riskyIds, 12 * 60, 31);

export default function Risk() {
  const [pid, setPid] = useState<PresetId>('balanced');
  const [conf, setConf] = useState(0.95);
  const [value, setValue] = useState(100);
  const [fat, setFat] = useState<'fat' | 'normal'>('fat');
  const w = presets[pid].w;
  const muA = portfolioReturn(w, U.mu);
  const volA = portfolioVol(w, U.cov);
  const muM = muA / 12;
  const volM = volA / Math.sqrt(12);
  const hist = useMemo(() => (fat === 'fat' ? HIST : simulateHistory(riskyIds, 12 * 60, 31, false)), [fat]);
  const port = hist[0].map((_, t) => w.reduce((s, x, i) => s + x * hist[i][t], 0));
  const pVaR = parametricVaR(muM, volM, conf);
  const pES = parametricES(muM, volM, conf);
  const hVaR = historicalVaR(port, conf);
  const hES = historicalES(port, conf);
  const worst = Math.min(...port);
  const sdHist = std(port);
  const beyond3 = port.filter((r) => r < mean(port) - 3 * sdHist).length;
  const xs = linspace(Math.min(...port), Math.max(...port), 120);
  const binW = (Math.max(...port) - Math.min(...port)) / 50;

  const cv = componentVaR(w, U.cov.map((r) => r.map((x) => x / 12)), conf);

  const [sid, setSid] = useState(scenarios[0].id);
  const sc = scenarios.find((s) => s.id === sid)!;
  const shocks = riskyIds.map((id) => sc.shocks[id]);

  return (
    <article>
      <LessonHeader id="risk" />

      <Section title="1. Value-at-Risk and Expected Shortfall">
        <InPlainWords>
          “What is the most we could lose?” has no answer: in theory, everything. The useful question is “how bad is a bad
          month?”. <Term name="Value-at-Risk">Value-at-Risk</Term> answers: at 95% confidence, the loss you exceed only one month in
          twenty. <Term name="Expected shortfall">Expected Shortfall</Term> asks the next question: in those worst months, how
          much do you lose on average?
        </InPlainWords>
        <TexBlock>{String.raw`\text{VaR}_\alpha = z_\alpha\,\sigma\sqrt h - \mu h, \qquad \text{ES}_\alpha = \sigma\sqrt h\,\frac{\varphi(z_\alpha)}{1 - \alpha} - \mu h`}</TexBlock>
        <Symbols
          items={[
            ['\\alpha', 'Confidence level, e.g. 95% or 99%'],
            ['z_\\alpha', 'Normal quantile: 1.645 at 95%, 2.326 at 99%'],
            ['h', 'Horizon in years (1/12 for a month)'],
            ['\\varphi', 'Standard normal density'],
          ]}
        />
        <Playground
          controls={
            <>
              <Toggle label="Portfolio" value={pid} onChange={setPid} options={(Object.keys(presets) as PresetId[]).map((k) => ({ value: k, label: presets[k].name }))} />
              <WeightBar weights={w} assets={U.assets} />
              <AssetLegend assets={U.assets} />
              <Slider label="Confidence" value={conf} min={0.9} max={0.995} step={0.005} onChange={setConf} format={(v) => pct(v, 1)} />
              <Slider label="Portfolio value (€m)" value={value} min={10} max={1000} step={10} onChange={setValue} format={(v) => `€${v}m`} />
              <Toggle label="History" value={fat} onChange={setFat} options={[{ value: 'fat', label: 'Fat-tailed' }, { value: 'normal', label: 'Normal' }]} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Normal VaR (1 month)', value: pct(pVaR, 2), hint: `€${(pVaR * value).toFixed(1)}m` },
              { label: 'Normal ES', value: pct(pES, 2), hint: `€${(pES * value).toFixed(1)}m` },
              { label: 'Historical VaR', value: pct(hVaR, 2), hint: `€${(hVaR * value).toFixed(1)}m` },
              { label: 'Historical ES', value: pct(hES, 2), hint: `€${(hES * value).toFixed(1)}m` },
              { label: 'Worst month (60 yrs)', value: pct(worst, 1), hint: `${((mean(port) - worst) / sdHist).toFixed(1)} std devs` },
            ]}
          />
          <Chart
            data={[
              { x: port, type: 'histogram', histnorm: 'probability density', xbins: { size: binW }, name: 'Simulated months', marker: { color: 'rgba(31,111,180,0.45)' } } as Data,
              { x: xs, y: xs.map((x) => normPdf((x - muM) / volM) / volM), type: 'scatter', mode: 'lines', name: 'Normal', line: { color: palette[1], width: 2.5 } } as Data,
              { x: [-hVaR, -hVaR], y: [0, normPdf(0) / volM], type: 'scatter', mode: 'lines', name: 'Historical VaR', line: { color: palette[3], dash: 'dash', width: 2 } } as Data,
              { x: [-hES, -hES], y: [0, normPdf(0) / volM], type: 'scatter', mode: 'lines', name: 'Historical ES', line: { color: palette[3], dash: 'dot', width: 2 } } as Data,
            ]}
            layout={{ xaxis: { tickformat: '.0%' }, hovermode: 'closest', bargap: 0.02 }}
            x="Monthly return"
            y="Density"
          />
        </Playground>
        <TryThis
          items={[
            'At 95%, normal and historical VaR are close. Raise confidence to 99.5%: historical numbers pull ahead of the normal ones. That is the effect of fat tails, and why regulators moved banks from VaR to ES.',
            <>Switch the history to “Normal”. The worst month shrinks and months beyond 3 standard deviations almost disappear. Real markets look like the <Term name="Fat tails">fat-tailed</Term> version: this one has {beyond3} months beyond −3σ, where a normal distribution expects about {(port.length * 0.00135).toFixed(1)}.</>,
            'Compare Conservative and Growth. VaR roughly scales with the equity share.',
          ]}
        />
      </Section>

      <Section title="2. Where does the risk come from?">
        <p>
          As with volatility in Module 4, VaR splits into <Term name="Component VaR">component VaRs</Term> that add up to the total.
          This is how a risk report tells a PM which positions to cut if the portfolio is over its limit.
        </p>
        <Chart
          data={[{ x: U.assets.map((a) => a.short), y: cv.component, type: 'bar', marker: { color: U.assets.map((a) => a.color) }, name: 'Component VaR', hovertemplate: '%{x}: %{y:.2%}<extra></extra>' } as Data]}
          layout={{ yaxis: { tickformat: '.1%' }, showlegend: false, title: { text: `${presets[pid].name}: 1-month normal VaR ${pct(cv.total, 2)} (zero mean)`, font: { size: 13 } } }}
          x=""
          y="Contribution to VaR"
          height={280}
        />
        <Example title="Reading it">
          In the {presets[pid].name} portfolio, developed and emerging equities are {pct(w[3] + w[4], 0)} of the capital but{' '}
          {pct((cv.component[3] + cv.component[4]) / cv.total, 0)} of the VaR. Government bonds are {pct(w[0], 0)} of the capital and
          only {pct(cv.component[0] / cv.total, 0)} of the VaR, because they are barely correlated with everything else. If you need
          to cut risk, the chart tells you where cutting works.
        </Example>
      </Section>

      <Section title="3. Stress tests">
        <p>
          VaR is built from history’s normal months. A <Term name="Stress test">stress test</Term> asks a different question: what
          happens in a specific crisis? Historical scenarios are plausible by construction; hypothetical ones probe today’s
          vulnerabilities.
        </p>
        <Toggle label="Scenario" value={sid} onChange={setSid} options={scenarios.map((s) => ({ value: s.id, label: s.name }))} />
        <p className="muted">{sc.note}</p>
        <div className="grid-2">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Portfolio</th><th>Scenario P&amp;L</th><th>In €m (of {value})</th><th>× 1-month 95% VaR</th></tr></thead>
              <tbody>
                {(Object.keys(presets) as PresetId[]).map((k) => {
                  const loss = stressLoss(presets[k].w, shocks);
                  const v = parametricVaR(portfolioReturn(presets[k].w, U.mu) / 12, portfolioVol(presets[k].w, U.cov) / Math.sqrt(12), 0.95);
                  return (
                    <tr key={k}>
                      <td>{presets[k].name}</td>
                      <td className={loss >= 0 ? 'pos' : 'neg'}>{pct(loss, 1)}</td>
                      <td>{(loss * value).toFixed(1)}</td>
                      <td>{(-loss / v).toFixed(1)}×</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Chart
            data={[{ x: U.assets.map((a) => a.short), y: w.map((x, i) => x * shocks[i]), type: 'bar', marker: { color: w.map((x, i) => (x * shocks[i] >= 0 ? palette[2] : palette[3])) }, name: 'P&L by asset' } as Data]}
            layout={{ yaxis: { tickformat: '.1%' }, showlegend: false, title: { text: `${presets[pid].name}: P&L by asset class`, font: { size: 13 } } }}
            x=""
            y=""
            height={260}
          />
        </div>
        <TryThis
          items={[
            'Compare 2008 and 2022 for the Conservative portfolio. In 2008 its bonds cushioned the fall; in 2022 they were the problem. A portfolio that is “safe” in one regime is not safe in all of them.',
            'Look at the last column: a stress loss can be many times the monthly VaR. Both numbers belong in a risk report.',
          ]}
        />
        <Note title="Beyond market risk">
          A full risk framework also covers <Term name="Liquidity risk">liquidity</Term> (can we meet redemptions and margin calls?),
          counterparty risk, currency risk and concentration. Stress tests are where these come together.
        </Note>
        <CodeRef file="src/models/risk.ts">Parametric and historical VaR/ES, component VaR and stress P&amp;L.</CodeRef>
        <OnTheJob>
          An independent risk team checks the investment team’s positions against limits every day, runs the stress tests, and
          has to be able to challenge a senior PM with numbers. Risk is a common and respected entry route to the buy side,
          particularly for candidates with a quantitative background.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'VaR is the loss exceeded with probability 1 − α; ES is the average loss beyond it.',
          'Normal VaR understates extreme losses because real returns have fat tails; the gap grows with confidence.',
          'Component VaRs add up to total VaR and show which positions drive risk; hedges contribute negatively.',
          'Stress tests complement VaR with specific crises; bonds protected in 2008 but not in 2022.',
        ]}
      />
      <InterviewCorner id="risk" />
      <Quiz
        questions={[
          {
            q: 'Portfolio monthly vol 3%, mean 0. The 1-month 99% normal VaR is about…',
            options: ['3.0%', '4.9%', '7.0%', '9.0%'],
            answer: 2,
            why: '2.326 × 3% ≈ 7.0%.',
          },
          {
            q: 'Why is Expected Shortfall often preferred to VaR?',
            options: ['It is always smaller', 'It accounts for the size of losses in the tail', 'It does not need data', 'It is easier to compute'],
            answer: 1,
            why: 'VaR says where the tail starts; ES averages over the tail, so it captures how bad the bad outcomes are. It is also subadditive, so it rewards diversification.',
          },
          {
            q: 'An asset has a negative component VaR. Increasing its weight slightly will…',
            options: ['Raise portfolio VaR', 'Lower portfolio VaR', 'Not change VaR', 'Make VaR undefined'],
            answer: 1,
            why: 'A negative contribution means the position hedges the rest of the portfolio, so adding a little more reduces total risk.',
          },
        ]}
      />
      <LessonFooter id="risk" />
    </article>
  );
}
