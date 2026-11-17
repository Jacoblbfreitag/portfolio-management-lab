import { useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { fundReturns, funds, simulateFactors } from '../data/assets';
import { capmReturn, ols } from '../models/regression';

const FACTORS = simulateFactors(240, 11);

export default function Capm() {
  // ── SML ──
  const [rf, setRf] = useState(0.025);
  const [erp, setErp] = useState(0.05);
  const [beta, setBeta] = useState(1.2);
  const [expected, setExpected] = useState(0.1);
  const betas = linspace(0, 2, 41);
  const required = capmReturn(rf, beta, erp);

  // ── Fund regressions ──
  const [fundId, setFundId] = useState('value');
  const [years, setYears] = useState(10);
  const fund = funds.find((f) => f.id === fundId)!;
  const n = years * 12;
  const fac = useMemo(() => ({ mkt: FACTORS.mkt.slice(-n), smb: FACTORS.smb.slice(-n), hml: FACTORS.hml.slice(-n), mom: FACTORS.mom.slice(-n) }), [n]);
  const y = useMemo(() => fundReturns(fund, FACTORS).slice(-n), [fund, n]);
  const capm = ols(y, [fac.mkt]);
  const ff = ols(y, [fac.mkt, fac.smb, fac.hml, fac.mom]);
  const xs = linspace(Math.min(...fac.mkt), Math.max(...fac.mkt), 2);
  const yr = (a: number) => pct(a * 12, 2);

  return (
    <article>
      <LessonHeader id="capm" />

      <Section title="1. Only systematic risk is paid">
        <InPlainWords>
          Module 2 showed that idiosyncratic risk can be diversified away for free. So the market should not pay you for
          bearing it. What it pays for is exposure to the risk everyone shares: the market. The{' '}
          <Term name="CAPM">CAPM</Term> turns this into a formula: an asset’s expected return depends only on its{' '}
          <Term name="Beta">beta</Term>, its sensitivity to the market.
        </InPlainWords>
        <TexBlock>{String.raw`E[R_i] = r_f + \beta_i\,\big(E[R_m] - r_f\big), \qquad \beta_i = \frac{\mathrm{Cov}(R_i, R_m)}{\mathrm{Var}(R_m)}`}</TexBlock>
        <Symbols
          items={[
            ['r_f', <>The <Term name="Risk-free rate">risk-free rate</Term></>],
            ['E[R_m] - r_f', <>The market (or <Term name="Equity risk premium">equity risk premium</Term>): what investors expect for holding the market</>],
            ['\\beta_i', 'How much the asset moves, on average, per 1% market move'],
          ]}
        />
        <Playground
          controls={
            <>
              <Slider label="Risk-free rate" value={rf} min={0} max={0.05} step={0.0025} onChange={setRf} format={(v) => pct(v, 2)} />
              <Slider label="Equity risk premium" value={erp} min={0.02} max={0.08} step={0.0025} onChange={setErp} format={(v) => pct(v, 2)} />
              <Slider label="Stock beta" value={beta} min={0} max={2} step={0.05} onChange={setBeta} format={(v) => v.toFixed(2)} />
              <Slider label="Your expected return for the stock" value={expected} min={0} max={0.2} step={0.0025} onChange={setExpected} format={(v) => pct(v, 1)} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'CAPM required return', value: pct(required, 2) },
              { label: 'Your expected alpha', value: pct(expected - required, 2), hint: expected > required ? 'above the SML: buy' : 'below the SML: avoid / sell' },
            ]}
          />
          <Chart
            data={[
              line(betas, betas.map((b) => capmReturn(rf, b, erp)), 'Security market line', { line: { color: palette[0], width: 3 } }),
              { x: [beta], y: [expected], type: 'scatter', mode: 'markers', name: 'Your forecast', marker: { color: expected > required ? palette[2] : palette[3], size: 12 } } as Data,
              { x: [1], y: [rf + erp], type: 'scatter', mode: 'markers+text', text: ['Market'], textposition: 'top left', name: 'Market', marker: { color: palette[5], size: 9 } } as Data,
            ]}
            layout={{ yaxis: { tickformat: '.0%' }, hovermode: 'closest' }}
            x="Beta"
            y="Expected return"
          />
        </Playground>
        <Example title="Worked example: a required return">
          r_f = 2.5%, ERP = 5%, β = 1.2 → required return 2.5% + 1.2 × 5% = 8.5%. If your analysis says the stock will return 10%,
          your forecast <Term name="Alpha">alpha</Term> is 1.5%: the point plots above the{' '}
          <Term name="Security market line">security market line</Term>. The same number is the cost of equity in a DCF valuation.
        </Example>
      </Section>

      <Section title="2. Beta and alpha from a regression">
        <p>
          In practice you estimate beta and alpha by regressing a fund’s monthly excess returns on the market’s. Then add the
          size, value and momentum factors (a <Term name="Factor model">factor model</Term>) to see whether the alpha survives.
          Below are four simulated funds with hidden exposures. Your job: find out what each one really is.
        </p>
        <TexBlock>{String.raw`R_{i,t} - r_f = \alpha + \beta\,MKT_t + s\,SMB_t + h\,HML_t + m\,MOM_t + \varepsilon_t`}</TexBlock>
        <Playground
          controls={
            <>
              <Toggle label="Fund" value={fundId} onChange={setFundId} options={funds.map((f) => ({ value: f.id, label: f.name.split(':')[0] }))} />
              <div style={{ fontSize: 14 }}>
                <strong>{fund.name}</strong>
                <div className="muted">{fund.story}</div>
              </div>
              <Slider label="Years of data" value={years} min={3} max={20} step={1} onChange={setYears} format={(v) => `${v}y`} />
            </>
          }
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Model</th><th>Alpha (annual)</th><th>t(alpha)</th><th>Market β</th><th>Size</th><th>Value</th><th>Momentum</th><th>R²</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>CAPM</td><td>{yr(capm.coef[0])}</td><td>{num(capm.t[0], 2)}</td><td>{num(capm.coef[1], 2)}</td><td>—</td><td>—</td><td>—</td><td>{num(capm.r2, 2)}</td>
                </tr>
                <tr>
                  <td>4-factor</td><td>{yr(ff.coef[0])}</td><td>{num(ff.t[0], 2)}</td><td>{num(ff.coef[1], 2)}</td><td>{num(ff.coef[2], 2)}</td><td>{num(ff.coef[3], 2)}</td><td>{num(ff.coef[4], 2)}</td><td>{num(ff.r2, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Chart
            data={[
              { x: fac.mkt, y, type: 'scatter', mode: 'markers', name: 'Months', marker: { color: palette[0], size: 5, opacity: 0.55 } } as Data,
              line(xs, xs.map((x) => capm.coef[0] + capm.coef[1] * x), `Fit: β = ${num(capm.coef[1], 2)}`, { line: { color: palette[3], width: 3 } }),
            ]}
            layout={{ xaxis: { tickformat: '.0%' }, yaxis: { tickformat: '.0%' }, hovermode: 'closest' }}
            x="Market excess return (monthly)"
            y="Fund excess return"
            height={320}
          />
        </Playground>
        <TryThis
          items={[
            <>Fund A: look at <Term name="R-squared">R²</Term> and beta. It charges an active fee for something the index gives you for a few basis points: a <Term name="Closet indexer">closet indexer</Term>.</>,
            'Fund B: the CAPM alpha looks good. Add the factors: the value and size loadings explain it, and the alpha is no longer significant. You could buy that exposure in a cheap value ETF.',
            'Fund C: the only one with true alpha built in (3% a year). Drop the history to 3 years: is the t-stat above 2? How many years do you need? (Module 9 has the formula.)',
            'Fund D: a “market-neutral, uncorrelated” hedge fund whose return is mostly momentum. Uncorrelated with the market is not the same as uncorrelated with everything.',
          ]}
        />
        <Note title="The factors">
          <Term name="Size factor">SMB</Term>: small minus big caps. <Term name="Value factor">HML</Term>: cheap minus expensive
          stocks. <Term name="Momentum factor">Momentum</Term>: recent winners minus losers. Each has earned a premium over long
          history (with long dry spells) and each can be bought cheaply in <Term name="Smart beta">smart-beta</Term> funds. That
          is why the four-factor alpha, not the CAPM alpha, is the fair measure of a stock picker’s skill.
        </Note>
        <CodeRef file="src/models/regression.ts">OLS with t-statistics and R², written out with the normal equations.</CodeRef>
        <OnTheJob>
          Fund selectors at pension funds and wealth managers (“manager research”) run these regressions on every fund they
          consider. Quant teams use the same tool in reverse: to build portfolios with chosen factor exposures. Being able to read
          this table and say “this is a value fund, not a skilled one” is exactly the kind of judgement interviewers test.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'CAPM: expected return = r_f + β × market premium. Only systematic risk is rewarded.',
          'Beta is the regression slope of excess returns on the market; alpha is the intercept.',
          'A positive CAPM alpha can be hidden factor exposure (size, value, momentum).',
          'Judge alpha by its t-statistic: short track records cannot prove skill.',
          'High R² and low tracking error with active fees = closet indexing.',
        ]}
      />
      <InterviewCorner id="capm" />
      <Quiz
        questions={[
          {
            q: 'r_f = 3%, market return 8%, β = 0.8. The CAPM expected return is…',
            options: ['6.4%', '7.0%', '8.0%', '9.4%'],
            answer: 1,
            why: '3% + 0.8 × (8% − 3%) = 3% + 4% = 7%.',
          },
          {
            q: 'A fund has a CAPM alpha of 2% (t = 2.5) but a four-factor alpha of 0.1% (t = 0.1) with a value loading of 0.6. The best description is…',
            options: ['A skilled stock picker', 'A value fund: its outperformance came from the value premium', 'A closet indexer', 'A fund with negative beta'],
            answer: 1,
            why: 'Once the value factor is included the alpha disappears. The return was real, but it came from a cheaply available factor tilt, not from skill.',
          },
          {
            q: 'Beta is…',
            options: ['Correlation with the market', 'Cov(R_i, R_m)/Var(R_m)', 'Volatility divided by market volatility', 'The intercept of the regression'],
            answer: 1,
            why: 'β = ρ·σ_i/σ_m = Cov/Var. Correlation alone ignores the relative size of the moves; volatility ratio alone ignores correlation.',
          },
        ]}
      />
      <LessonFooter id="capm" />
    </article>
  );
}
