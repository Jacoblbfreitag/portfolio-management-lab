import { useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { AssetLegend, WeightBar } from '../components/Weights';
import { RF, riskyIds, universe } from '../data/assets';
import {
  equalWeightVol, frontierWeights, longOnlyFrontier, maxSharpePoint, minVarianceWeights, portfolioReturn, portfolioVol,
  tangencyWeights, twoAssetMinVarWeight, twoAssetVol,
} from '../models/meanVariance';

const U = universe(riskyIds);

export default function Diversification() {
  // ── Two assets ──
  const [s1, setS1] = useState(0.16);
  const [s2, setS2] = useState(0.055);
  const [m1, setM1] = useState(0.07);
  const [m2, setM2] = useState(0.032);
  const [rho, setRho] = useState(-0.1);
  const ws = linspace(0, 1, 101);
  const curve = (r: number) => ({ x: ws.map((w) => twoAssetVol(w, s1, s2, r)), y: ws.map((w) => w * m1 + (1 - w) * m2) });
  const wMin = Math.min(1, Math.max(0, twoAssetMinVarWeight(s1, s2, rho)));

  // ── N assets ──
  const [sig, setSig] = useState(0.3);
  const [rhoN, setRhoN] = useState(0.3);
  const ns = Array.from({ length: 60 }, (_, i) => i + 1);

  // ── Frontier ──
  const [mode, setMode] = useState<'long' | 'short'>('long');
  const [rf, setRf] = useState(RF);
  const longFrontier = useMemo(() => longOnlyFrontier(U.mu, U.cov, { points: 40 }), []);
  const mins = Math.min(...U.mu);
  const maxs = Math.max(...U.mu);
  const shortTargets = linspace(mins - 0.01, maxs + 0.03, 60);
  const frontier =
    mode === 'long'
      ? longFrontier.map((p) => ({ vol: p.vol, ret: p.ret }))
      : shortTargets.map((m) => {
          const w = frontierWeights(U.mu, U.cov, m);
          return { vol: portfolioVol(w, U.cov), ret: m };
        });
  const tW = mode === 'long' ? maxSharpePoint(longFrontier, rf).weights : tangencyWeights(U.mu, U.cov, rf);
  const tRet = portfolioReturn(tW, U.mu);
  const tVol = portfolioVol(tW, U.cov);
  const gmv = mode === 'long' ? longFrontier[0].weights : minVarianceWeights(U.cov);
  const sharpe = (tRet - rf) / tVol;
  const cmlX = linspace(0, Math.max(...frontier.map((p) => p.vol), 0.22), 30);

  return (
    <article>
      <LessonHeader id="diversification" />

      <Section title="1. Two assets and the magic of correlation">
        <InPlainWords>
          When one asset zigs while the other zags, their ups and downs partly cancel. The portfolio is then less risky than
          either asset’s risk averaged together. How much less depends on one number: their{' '}
          <Term name="Correlation">correlation</Term>.
        </InPlainWords>
        <TexBlock>{String.raw`\sigma_p^2 = w^2\sigma_1^2 + (1-w)^2\sigma_2^2 + 2w(1-w)\rho\,\sigma_1\sigma_2`}</TexBlock>
        <Symbols
          items={[
            ['w', 'Weight in asset 1 (the rest is in asset 2)'],
            ['\\sigma_1,\\,\\sigma_2', 'Volatilities of the two assets'],
            ['\\rho', 'Correlation between them, from −1 to +1'],
          ]}
        />
        <Playground
          controls={
            <>
              <Slider label="Asset 1 (equities) return" value={m1} min={0} max={0.12} step={0.005} onChange={setM1} format={(v) => pct(v, 1)} />
              <Slider label="Asset 1 vol" value={s1} min={0.02} max={0.4} step={0.01} onChange={setS1} format={(v) => pct(v, 0)} />
              <Slider label="Asset 2 (bonds) return" value={m2} min={0} max={0.12} step={0.005} onChange={setM2} format={(v) => pct(v, 1)} />
              <Slider label="Asset 2 vol" value={s2} min={0.02} max={0.4} step={0.005} onChange={setS2} format={(v) => pct(v, 1)} />
              <Slider label="Correlation ρ" value={rho} min={-1} max={1} step={0.05} onChange={setRho} format={(v) => v.toFixed(2)} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Min-variance weight in asset 1', value: pct(wMin, 0) },
              { label: 'Lowest achievable vol', value: pct(twoAssetVol(wMin, s1, s2, rho), 1) },
              { label: '50/50 vol', value: pct(twoAssetVol(0.5, s1, s2, rho), 1), hint: `vs ${pct((s1 + s2) / 2, 1)} if ρ = 1` },
            ]}
          />
          <Chart
            data={[
              line(curve(1).x, curve(1).y, 'ρ = +1', { line: { color: palette[5], dash: 'dot' } }),
              line(curve(0).x, curve(0).y, 'ρ = 0', { line: { color: palette[1], dash: 'dash' } }),
              line(curve(-1).x, curve(-1).y, 'ρ = −1', { line: { color: palette[2], dash: 'dot' } }),
              line(curve(rho).x, curve(rho).y, `Your ρ = ${rho.toFixed(2)}`, { line: { color: palette[0], width: 3.5 } }),
              { x: [s1, s2], y: [m1, m2], type: 'scatter', mode: 'markers+text', text: ['Asset 1', 'Asset 2'], textposition: 'middle right', marker: { color: palette[3], size: 10 }, name: 'Assets' } as Data,
            ]}
            layout={{ xaxis: { tickformat: '.0%', rangemode: 'tozero' }, yaxis: { tickformat: '.1%' }, hovermode: 'closest' }}
            x="Volatility"
            y="Expected return"
          />
        </Playground>
        <TryThis
          items={[
            'Set ρ = 1. The curve becomes a straight line: no diversification at all, risk is just the weighted average.',
            'Set ρ = −1. You can build a portfolio with zero risk. In real markets nothing is perfectly negatively correlated, but the 2000–2020 stock/bond correlation of about −0.3 was a gift to 60/40 investors.',
            'Set ρ = +0.5, as in 2022 when stocks and bonds fell together. How much higher is the 50/50 vol?',
          ]}
        />
      </Section>

      <Section title="2. Systematic vs idiosyncratic risk">
        <p>
          Add more and more stocks, each with the same volatility σ and pairwise correlation ρ, in equal weights. The portfolio’s
          volatility falls towards a floor of σ√ρ. What disappears is <Term name="Idiosyncratic risk">idiosyncratic risk</Term>;
          what remains is <Term name="Systematic risk">systematic risk</Term>, which no amount of{' '}
          <Term name="Diversification">diversification</Term> removes, and which is why investors are paid to bear it (Module 3).
        </p>
        <TexBlock>{String.raw`\sigma_p = \sigma\sqrt{\tfrac1n + \left(1 - \tfrac1n\right)\rho} \;\xrightarrow{\;n\to\infty\;}\; \sigma\sqrt\rho`}</TexBlock>
        <Playground
          controls={
            <>
              <Slider label="Single-stock vol σ" value={sig} min={0.1} max={0.6} step={0.01} onChange={setSig} format={(v) => pct(v, 0)} />
              <Slider label="Average correlation ρ" value={rhoN} min={0} max={0.9} step={0.05} onChange={setRhoN} format={(v) => v.toFixed(2)} />
            </>
          }
        >
          <Stats
            items={[
              { label: '1 stock', value: pct(sig, 0) },
              { label: '10 stocks', value: pct(equalWeightVol(10, sig, rhoN), 1) },
              { label: '30 stocks', value: pct(equalWeightVol(30, sig, rhoN), 1) },
              { label: 'Floor (∞ stocks)', value: pct(sig * Math.sqrt(rhoN), 1) },
            ]}
          />
          <Chart
            data={[
              line(ns, ns.map((n) => equalWeightVol(n, sig, rhoN)), 'Portfolio vol', { line: { color: palette[0], width: 3 } }),
              line(ns, ns.map(() => sig * Math.sqrt(rhoN)), 'Systematic floor', { line: { color: palette[3], dash: 'dash' } }),
            ]}
            layout={{ yaxis: { tickformat: '.0%', rangemode: 'tozero' } }}
            x="Number of stocks"
            y="Volatility"
          />
        </Playground>
        <Note title="Rule of thumb">
          Most of the diversification benefit comes from the first 20–30 stocks. A concentrated 30-stock fund is not reckless;
          a 3-stock portfolio is. But correlations rise in crises, so the floor moves up exactly when you need diversification most.
        </Note>
      </Section>

      <Section title="3. Many assets: the efficient frontier">
        <p>
          With seven asset classes, every possible portfolio is a point on the risk/return chart. The upper edge is the{' '}
          <Term name="Efficient frontier">efficient frontier</Term>. Its leftmost point is the{' '}
          <Term name="Minimum-variance portfolio">minimum-variance portfolio</Term>. Add a risk-free asset and the best risky
          portfolio is the <Term name="Tangency portfolio">tangency portfolio</Term>, where a line from the risk-free rate just
          touches the frontier: the <Term name="Capital market line">capital market line</Term>.
        </p>
        <TexBlock>{String.raw`\min_w\; w^\top\Sigma w \quad\text{s.t.}\quad w^\top\mu = m,\; w^\top\mathbf 1 = 1 \qquad\Rightarrow\qquad w_{\text{tan}} \propto \Sigma^{-1}(\mu - r_f\mathbf 1)`}</TexBlock>
        <Playground
          controls={
            <>
              <Toggle
                label="Constraints"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'long', label: 'Long-only' },
                  { value: 'short', label: 'Shorts allowed' },
                ]}
              />
              <Slider label="Risk-free rate" value={rf} min={0} max={0.045} step={0.0025} onChange={setRf} format={(v) => pct(v, 2)} />
              <WeightBar weights={tW.map((x) => Math.max(x, 0))} assets={U.assets} label="Tangency portfolio (long side)" />
              <WeightBar weights={gmv.map((x) => Math.max(x, 0))} assets={U.assets} label="Minimum-variance portfolio (long side)" />
              <AssetLegend assets={U.assets} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Tangency return', value: pct(tRet, 1) },
              { label: 'Tangency vol', value: pct(tVol, 1) },
              { label: 'Max Sharpe', value: num(sharpe, 2) },
              { label: 'Largest short', value: pct(Math.min(0, ...tW), 0), hint: mode === 'long' ? 'none allowed' : 'in the tangency' },
            ]}
          />
          <Chart
            data={[
              line(frontier.map((p) => p.vol), frontier.map((p) => p.ret), mode === 'long' ? 'Long-only frontier' : 'Unconstrained frontier', { line: { color: palette[0], width: 3 } }),
              line(cmlX, cmlX.map((x) => rf + sharpe * x), 'Capital market line', { line: { color: palette[2], dash: 'dash' } }),
              { x: U.vols, y: U.mu, text: U.assets.map((a) => a.short), type: 'scatter', mode: 'markers+text', textposition: 'middle right', name: 'Asset classes', marker: { color: U.assets.map((a) => a.color), size: 9 } } as Data,
              { x: [tVol], y: [tRet], type: 'scatter', mode: 'markers', name: 'Tangency', marker: { color: palette[3], size: 13, symbol: 'star' } } as Data,
              { x: [0], y: [rf], type: 'scatter', mode: 'markers', name: 'Risk-free', marker: { color: palette[5], size: 9 } } as Data,
            ]}
            layout={{ xaxis: { tickformat: '.0%', range: [0, 0.24] }, yaxis: { tickformat: '.1%' }, hovermode: 'closest' }}
            x="Volatility"
            y="Expected return"
            height={400}
          />
        </Playground>
        <TryThis
          items={[
            'Switch to “Shorts allowed”. The frontier moves up and left (fewer constraints can only help in theory), but look at the tangency: large short positions in some assets. Would a client accept that?',
            'Raise the risk-free rate. The tangency portfolio moves up the frontier into riskier assets: with a higher cash rate, only riskier portfolios are worth leaving cash for.',
            'Notice where commodities and real estate end up in the long-only portfolios. Small changes in their assumed returns (Module 4) can swing them from 0% to 20%.',
          ]}
        />
        <Example title="Two-fund separation">
          Under these assumptions every mean–variance investor holds the same risky portfolio, the tangency portfolio, and only
          decides how much cash to hold alongside it (or how much to borrow). A cautious client might hold 40% tangency + 60%
          cash: expected return {pct(rf + 0.4 * (tRet - rf), 1)}, vol {pct(0.4 * tVol, 1)}. This is{' '}
          <Term name="Two-fund separation">two-fund separation</Term>, and it is why in theory the CML beats every portfolio on the frontier.
        </Example>
        <CodeRef file="src/models/meanVariance.ts">Closed-form frontier (Merton 1972) and a projected-gradient long-only optimiser.</CodeRef>
        <OnTheJob>
          Multi-asset teams run exactly this exercise when they set or review a client’s strategic allocation, using their house
          capital market assumptions. In practice it is always constrained (no shorts, maximum weights, liquidity limits) and
          the output is a starting point for discussion, not the answer.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'Portfolio risk depends on correlations: with ρ < 1 the whole is less risky than the average of its parts.',
          'Diversification removes idiosyncratic risk but not systematic risk; the floor is σ√ρ.',
          'The efficient frontier shows the best return for each level of risk; the minimum-variance portfolio needs no return forecasts.',
          'With a risk-free asset, all investors should hold the tangency portfolio mixed with cash (two-fund separation).',
          'Constraints (long-only, caps) lower the frontier but make portfolios realistic.',
        ]}
      />
      <InterviewCorner id="diversification" />
      <Quiz
        questions={[
          {
            q: 'Two assets have the same volatility of 20% and correlation 0. A 50/50 portfolio has volatility…',
            options: ['20%', '14.1%', '10%', '0%'],
            answer: 1,
            why: '√(0.25·0.04 + 0.25·0.04) = √0.02 = 14.1%. With ρ = 0 you cut risk by a factor √2.',
          },
          {
            q: 'Which portfolio does not need any expected-return estimates?',
            options: ['Tangency', 'Minimum variance', 'Any point on the frontier', 'Maximum return'],
            answer: 1,
            why: 'The minimum-variance portfolio depends only on Σ. Because return estimates are the noisiest input, this makes it popular in practice (low-volatility funds).',
          },
          {
            q: 'Why can’t diversification eliminate all risk in an equity portfolio?',
            options: ['Transaction costs', 'Stocks share common (systematic) risk, so correlations are positive', 'Regulation', 'Because of short-selling limits'],
            answer: 1,
            why: 'With average correlation ρ > 0, portfolio vol falls only to σ√ρ. That remaining market risk is what the CAPM says is rewarded.',
          },
        ]}
      />
      <LessonFooter id="diversification" />
    </article>
  );
}
