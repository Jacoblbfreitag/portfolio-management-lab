import { useState } from 'react';
import type { Data } from 'plotly.js';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { bondPrice, convexity, dv01, fundingRatio, hedgeRatio, macaulayDuration, modifiedDuration, priceChangeApprox } from '../models/bonds';

export default function Bonds() {
  // ── Price / yield ──
  const [coupon, setCoupon] = useState(0.03);
  const [years, setYears] = useState(10);
  const [ytm, setYtm] = useState(0.03);
  const p0 = bondPrice(coupon, ytm, years);
  const md = modifiedDuration(coupon, ytm, years);
  const cx = convexity(coupon, ytm, years);
  const ys = linspace(Math.max(0.0, ytm - 0.03), ytm + 0.03, 61);

  // ── LDI ──
  const [bondShare, setBondShare] = useState(0.5);
  const [bondYears, setBondYears] = useState(10);
  const [y, setY] = useState(0.03);
  const liabilityYears = 20;
  const assets = 100;
  const L = 100 * (1 + y) ** liabilityYears; // funded at exactly 100% today
  const fund = { assets, L, liabilityYears, bondYears, bondShare, y };
  const shifts = linspace(-0.02, 0.02, 41);
  const hr = hedgeRatio(fund);
  // Bond tenor that would fully hedge with this bond share.
  const neededYears = bondShare > 0 ? liabilityYears / bondShare : Infinity;

  return (
    <article>
      <LessonHeader id="bonds" />

      <Section title="1. Prices, yields and duration">
        <InPlainWords>
          A bond is a promise of fixed payments. When market interest rates rise, those fixed payments are worth less, so the
          price falls. How much it falls depends mostly on how far away the payments are: that is{' '}
          <Term name="Duration">duration</Term>. A 10-year bond loses about 8–9% if yields rise one percentage point; a 2-year
          bond about 2%.
        </InPlainWords>
        <TexBlock>{String.raw`P = \sum_{t=1}^{T}\frac{CF_t}{(1+y)^t}, \qquad \frac{\Delta P}{P} \approx -D_{\text{mod}}\,\Delta y + \tfrac12\,C\,(\Delta y)^2`}</TexBlock>
        <Symbols
          items={[
            ['y', <><Term name="Yield to maturity">Yield to maturity</Term></>],
            ['D_{\\text{mod}}', <><Term name="Modified duration">Modified duration</Term> = Macaulay duration / (1 + y)</>],
            ['C', <><Term name="Convexity">Convexity</Term>: the curvature that makes the price–yield line bend</>],
          ]}
        />
        <Playground
          controls={
            <>
              <Slider label="Coupon" value={coupon} min={0} max={0.08} step={0.0025} onChange={setCoupon} format={(v) => pct(v, 2)} />
              <Slider label="Maturity (years)" value={years} min={1} max={40} step={1} onChange={setYears} format={(v) => `${v}y`} />
              <Slider label="Yield to maturity" value={ytm} min={0.005} max={0.08} step={0.0025} onChange={setYtm} format={(v) => pct(v, 2)} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Price (per 100)', value: num(p0, 2) },
              { label: 'Macaulay duration', value: `${num(macaulayDuration(coupon, ytm, years), 2)}y` },
              { label: 'Modified duration', value: num(md, 2) },
              { label: 'Convexity', value: num(cx, 1) },
              { label: <Term name="DV01">DV01</Term>, value: `€${Math.round(dv01(1e6, md))}`, hint: 'per €1m, per 1bp' },
            ]}
          />
          <Chart
            data={[
              line(ys, ys.map((yy) => bondPrice(coupon, yy, years)), 'Actual price', { line: { color: palette[0], width: 3 } }),
              line(ys, ys.map((yy) => p0 * (1 - md * (yy - ytm))), 'Duration only', { line: { color: palette[3], dash: 'dash' } }),
              line(ys, ys.map((yy) => p0 * (1 + priceChangeApprox(md, cx, yy - ytm))), 'Duration + convexity', { line: { color: palette[2], dash: 'dot' } }),
              { x: [ytm], y: [p0], type: 'scatter', mode: 'markers', name: 'Today', marker: { color: palette[5], size: 10 } } as Data,
            ]}
            layout={{ xaxis: { tickformat: '.1%' } }}
            x="Yield"
            y="Price"
          />
        </Playground>
        <TryThis
          items={[
            'Move maturity from 2 to 30 years. Duration (and the slope of the curve) grows with maturity, and so does convexity.',
            'Set the coupon to 0 (a zero-coupon bond). Macaulay duration equals the maturity exactly.',
            'Look at the gap between the dashed line and the actual price far from today’s yield. Duration alone always underestimates the price: that is positive convexity, which bond holders like.',
          ]}
        />
        <Example title="Worked example">
          A 10-year 3% bond at a 3% yield prices at par, with modified duration ≈ 8.5. If yields rise 50bp, its price falls about
          8.5 × 0.5% ≈ 4.3% (convexity trims that slightly). On €10m that is ≈ €425k, or a DV01 of about €8.5k per basis point.
        </Example>
        <CodeRef file="src/models/bonds.ts" />
      </Section>

      <Section title="2. Liability-driven investing: what pension funds actually manage">
        <p>
          A pension fund has promised payments decades away. Their present value moves with interest rates exactly like a long
          bond. So the fund’s real risk is not its asset return but its <Term name="Funding ratio">funding ratio</Term>: assets
          divided by the present value of liabilities. <Term name="Liability-driven investing">Liability-driven investing</Term>{' '}
          hedges that ratio, mainly by matching the interest-rate sensitivity (DV01) of the liabilities with bonds or{' '}
          <Term name="Interest-rate swap">swaps</Term>.
        </p>
        <TexBlock>{String.raw`\text{Funding ratio} = \frac{A}{PV(L)}, \qquad \text{Hedge ratio} = \frac{DV01_{\text{assets}}}{DV01_{\text{liabilities}}}`}</TexBlock>
        <p className="muted">
          This fund starts 100% funded: €100 of assets against liabilities of duration {liabilityYears} years. Assets are a zero-coupon
          bond and equities.
        </p>
        <Playground
          controls={
            <>
              <Slider label="Share in bonds" value={bondShare} min={0} max={1} step={0.05} onChange={setBondShare} format={(v) => pct(v, 0)} />
              <Slider label="Bond maturity (= its duration)" value={bondYears} min={1} max={50} step={1} onChange={setBondYears} format={(v) => `${v}y`} />
              <Slider label="Today’s yield" value={y} min={0.005} max={0.06} step={0.0025} onChange={setY} format={(v) => pct(v, 2)} />
            </>
          }
        >
          <Stats
            items={[
              { label: <Term name="Hedge ratio">Interest-rate hedge ratio</Term>, value: pct(hr, 0) },
              { label: 'Funding if yields −1%', value: pct(fundingRatio(fund, -0.01), 1) },
              { label: 'Funding if yields +1%', value: pct(fundingRatio(fund, 0.01), 1) },
              { label: 'Funding if equities −25%', value: pct(fundingRatio(fund, 0, -0.25), 1) },
              { label: 'Bond tenor for a full hedge', value: Number.isFinite(neededYears) ? `${num(neededYears, 0)}y` : '—', hint: 'at this bond share' },
            ]}
          />
          <Chart
            data={[
              line(shifts, shifts.map((d) => fundingRatio(fund, d)), 'Your fund', { line: { color: palette[0], width: 3 } }),
              line(shifts, shifts.map((d) => fundingRatio({ ...fund, bondShare: 0 }, d)), 'All equities (no hedge)', { line: { color: palette[3], dash: 'dash' } }),
              line(shifts, shifts.map((d) => fundingRatio({ ...fund, bondShare: 1, bondYears: liabilityYears }, d)), 'Fully matched', { line: { color: palette[2], dash: 'dot' } }),
            ]}
            layout={{ xaxis: { tickformat: '+.1%' }, yaxis: { tickformat: '.0%' } }}
            x="Parallel change in yields"
            y="Funding ratio"
          />
        </Playground>
        <TryThis
          items={[
            'With 50% in 10-year bonds the hedge ratio is only 25%. If yields fall 1%, the liabilities rise about 20% and the fund drops well below 100% funded, even though its bonds made money.',
            'Find a combination that reaches a 100% hedge ratio while keeping 50% in equities. You need very long bonds (40y) or, in practice, swaps or leverage: exactly what LDI funds provide.',
            'Set 100% bonds of 5 years. “Safe” assets, but a large interest-rate mismatch. Safe depends on what you are measured against.',
          ]}
        />
        <Note title="The UK LDI crisis of 2022">
          Many UK schemes used leveraged LDI to hedge rates while keeping assets in growth investments. When gilt yields spiked in
          September 2022, the hedges lost value fast and needed collateral at short notice. Forced selling pushed yields higher
          until the Bank of England intervened. The funding ratios were mostly fine; the problem was{' '}
          <Term name="Liquidity risk">liquidity risk</Term> from leverage.
        </Note>
        <OnTheJob>
          Pension funds and life insurers in Denmark and the rest of Europe employ large ALM (asset–liability management) and
          LDI teams. A typical junior task: compute the fund’s DV01 by maturity bucket for assets and liabilities, and propose
          swap trades to close the gaps. If you liked this section, these teams are worth targeting.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'Bond prices fall when yields rise; duration measures how much (≈ −D_mod × Δy).',
          'Convexity makes the price–yield relationship curve, helping the holder.',
          'DV01 = value × D_mod × 0.0001; hedges are sized by matching DV01.',
          'For a pension fund, risk is the funding ratio; liabilities behave like a long bond.',
          'LDI hedges rate risk with long bonds and swaps; leverage brings liquidity risk.',
        ]}
      />
      <InterviewCorner id="bonds" />
      <Quiz
        questions={[
          {
            q: 'A bond has modified duration 6 and convexity 50. Yields rise 1%. The price change is approximately…',
            options: ['−6.0%', '−5.75%', '−6.25%', '+6.0%'],
            answer: 1,
            why: '−6 × 1% + ½ × 50 × (1%)² = −6% + 0.25% = −5.75%.',
          },
          {
            q: 'Why does a fall in interest rates hurt a pension fund invested mainly in equities?',
            options: ['Equities always fall when rates fall', 'The present value of its liabilities rises', 'Its bonds lose value', 'It doesn’t'],
            answer: 1,
            why: 'Lower discount rates raise the PV of long-dated pension promises. Without matching duration in the assets, the funding ratio falls.',
          },
          {
            q: 'A zero-coupon bond maturing in 12 years has a Macaulay duration of…',
            options: ['Less than 12 years', 'Exactly 12 years', 'More than 12 years', 'Depends on the coupon'],
            answer: 1,
            why: 'There is only one cash flow, at year 12, so the PV-weighted average time is 12.',
          },
        ]}
      />
      <LessonFooter id="bonds" />
    </article>
  );
}
