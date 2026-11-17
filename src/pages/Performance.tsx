import { useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { Chart, line, palette } from '../components/Chart';
import { Playground, Slider, Stats, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Takeaways, Term, TryThis } from '../components/Lesson';
import { makeGaussian } from '../models/math/rng';
import { brinson, informationRatio, moneyWeightedReturn, timeWeightedReturn, trackingError, type Segment } from '../models/performance';
import { wealthIndex } from '../models/returns';

const initialSegments: Segment[] = [
  { name: 'Technology', wp: 0.3, wb: 0.25, rp: 0.22, rb: 0.18 },
  { name: 'Financials', wp: 0.15, wb: 0.2, rp: 0.08, rb: 0.1 },
  { name: 'Health care', wp: 0.2, wb: 0.15, rp: 0.03, rb: 0.05 },
  { name: 'Energy', wp: 0.05, wb: 0.1, rp: 0.12, rb: 0.15 },
  { name: 'Everything else', wp: 0.3, wb: 0.3, rp: 0.07, rb: 0.06 },
];

export default function Performance() {
  // ── TWR vs MWR ──
  const [r1, setR1] = useState(0.2);
  const [r2, setR2] = useState(-0.1);
  const [flow, setFlow] = useState(200);
  const v1 = 100 * (1 + r1);
  const v2 = (v1 + flow) * (1 + r2);
  const twr = timeWeightedReturn([r1, r2]);
  const twrAnnual = Math.sqrt(1 + twr) - 1;
  const mwr = moneyWeightedReturn([{ t: 0, cf: -100 }, { t: 1, cf: -flow }, { t: 2, cf: v2 }]);

  // ── Tracking error & IR ──
  const [te, setTe] = useState(0.04);
  const [ir, setIr] = useState(0.3);
  const [seed, setSeed] = useState(1);
  const active = useMemo(() => {
    const z = makeGaussian(seed * 7 + 1);
    return Array.from({ length: 120 }, () => (ir * te) / 12 + (te / Math.sqrt(12)) * z());
  }, [te, ir, seed]);
  const zeros = active.map(() => 0);
  const cum = wealthIndex(active).map((w) => w - 1);

  // ── Brinson ──
  const [segs, setSegs] = useState(initialSegments);
  const { rows, Rp, Rb } = brinson(segs);
  const set = (i: number, key: keyof Segment, v: number) => setSegs((s) => s.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  const sumWp = segs.reduce((s, x) => s + x.wp, 0);
  const sumWb = segs.reduce((s, x) => s + x.wb, 0);
  const totals = rows.reduce((t, r) => ({ a: t.a + r.allocation, s: t.s + r.selection, i: t.i + r.interaction }), { a: 0, s: 0, i: 0 });

  return (
    <article>
      <LessonHeader id="performance" />

      <Section title="1. Time-weighted vs money-weighted return">
        <InPlainWords>
          A client puts €100 in a fund, which rises 20%. Delighted, they add €200 just before it falls 10%. The fund manager did
          well over the two years, but the client lost money, because of <em>their</em> timing. Both statements are true, and
          you need two different return measures to say so.
        </InPlainWords>
        <TexBlock>{String.raw`1 + R_{TW} = \prod_k (1 + r_k), \qquad 0 = \sum_t \frac{CF_t}{(1 + R_{MW})^t}`}</TexBlock>
        <Playground
          controls={
            <>
              <Slider label="Fund return, year 1" value={r1} min={-0.3} max={0.4} step={0.01} onChange={setR1} format={(v) => pct(v, 0)} />
              <Slider label="Fund return, year 2" value={r2} min={-0.3} max={0.4} step={0.01} onChange={setR2} format={(v) => pct(v, 0)} />
              <Slider label="Client adds (−: withdraws) after year 1" value={flow} min={-100} max={400} step={10} onChange={setFlow} format={(v) => `€${v}`} />
            </>
          }
        >
          <Stats
            items={[
              { label: <Term name="Time-weighted return">Time-weighted</Term>, value: `${pct(twrAnnual, 2)} / yr`, hint: `${pct(twr, 1)} total: the manager’s skill` },
              { label: <Term name="Money-weighted return">Money-weighted (IRR)</Term>, value: `${pct(mwr, 2)} / yr`, hint: 'the client’s experience' },
              { label: 'Client’s money in / out', value: `€${100 + flow} → €${v2.toFixed(0)}` },
            ]}
          />
          <Example title="The cash flows">
            <table>
              <tbody>
                <tr><th>Start</th><td>invest €100</td></tr>
                <tr><th>End of year 1</th><td>worth €{v1.toFixed(0)}; client adds €{flow} → €{(v1 + flow).toFixed(0)}</td></tr>
                <tr><th>End of year 2</th><td>worth €{v2.toFixed(0)}</td></tr>
              </tbody>
            </table>
          </Example>
        </Playground>
        <TryThis
          items={[
            'Set the flow to €0. With no cash flows, TWR = MWR.',
            'Make the client add money after a good year that is followed by a bad one. MWR falls below TWR: “performance chasing” costs real investors money.',
            'Make the client withdraw €80 after a good year. Now MWR is above TWR. Was the client skilful or lucky?',
          ]}
        />
        <Note title="Which to use">
          Judge a manager by TWR because clients, not the manager, decide when money comes and goes. That is what{' '}
          <Term name="GIPS">GIPS</Term> requires for funds. Use MWR for the investor’s own outcome, and for private equity, where the
          manager does decide when capital is called and returned.
        </Note>
      </Section>

      <Section title="2. Benchmarks, tracking error and the information ratio">
        <p>
          Active managers are judged relative to a <Term name="Benchmark">benchmark</Term>. A fair one is investable, chosen in
          advance, unambiguous, and reflects the manager’s universe and style. A small-cap manager measured against a large-cap
          index will look brilliant or terrible for reasons that have nothing to do with skill.
        </p>
        <TexBlock>{String.raw`TE = \operatorname{sd}(R_p - R_b)\sqrt{12}, \qquad IR = \frac{\overline{R_p - R_b}\cdot 12}{TE}`}</TexBlock>
        <Playground
          controls={
            <>
              <Slider label="Target tracking error" value={te} min={0.005} max={0.1} step={0.005} onChange={setTe} format={(v) => pct(v, 1)} />
              <Slider label="True information ratio (skill)" value={ir} min={-0.5} max={1} step={0.05} onChange={setIr} format={(v) => v.toFixed(2)} />
              <Slider label="Random seed (luck)" value={seed} min={1} max={40} step={1} onChange={setSeed} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Expected active return', value: pct(ir * te, 2), hint: 'IR × TE' },
              { label: <Term name="Tracking error">Measured TE</Term>, value: pct(trackingError(active, zeros), 2) },
              { label: <Term name="Information ratio">Measured IR</Term>, value: num(informationRatio(active, zeros), 2), hint: '10 years of data' },
            ]}
          />
          <Chart
            data={[line(active.map((_, i) => (i + 1) / 12), cum.slice(1), 'Cumulative active return', { line: { color: palette[0], width: 3 }, fill: 'tozeroy', fillcolor: 'rgba(31,111,180,0.1)' })]}
            layout={{ yaxis: { tickformat: '.0%' } }}
            x="Years"
            y="Ahead of / behind the benchmark"
            height={300}
          />
        </Playground>
        <TryThis
          items={[
            'Set a true IR of 0.5, which would make this one of the best managers in the industry, and click through seeds. How often does the manager trail the benchmark over 10 years?',
            'Set a true IR of 0 (no skill). How many seeds produce a measured IR above 0.3, enough to win a mandate?',
            'Double the tracking error. The expected active return doubles, but the IR, the quality of the skill, does not change.',
          ]}
        />
      </Section>

      <Section title="3. Brinson attribution: where did the active return come from?">
        <p>
          The manager beat the benchmark by {pct(Rp - Rb, 2)}. Was it from <em>which sectors</em> they over- and underweighted, or
          from <em>which stocks</em> they picked inside each sector? <Term name="Brinson attribution">Brinson attribution</Term>{' '}
          answers that. Edit any number in the table.
        </p>
        <TexBlock>{String.raw`\underbrace{(w_{p,i} - w_{b,i})(r_{b,i} - R_b)}_{\text{allocation}} \;+\; \underbrace{w_{b,i}(r_{p,i} - r_{b,i})}_{\text{selection}} \;+\; \underbrace{(w_{p,i} - w_{b,i})(r_{p,i} - r_{b,i})}_{\text{interaction}}`}</TexBlock>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Sector</th><th>Port. weight %</th><th>Bench. weight %</th><th>Port. return %</th><th>Bench. return %</th><th>Allocation</th><th>Selection</th><th>Interaction</th><th>Total</th></tr>
            </thead>
            <tbody>
              {segs.map((s, i) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  {(['wp', 'wb', 'rp', 'rb'] as const).map((k) => (
                    <td key={k}>
                      <input
                        type="number"
                        step={1}
                        value={Math.round(s[k] * 1000) / 10}
                        onChange={(e) => set(i, k, Number(e.target.value) / 100)}
                        style={{ width: 64, font: 'inherit', textAlign: 'right' }}
                        aria-label={`${s.name} ${k}`}
                      />
                    </td>
                  ))}
                  {[rows[i].allocation, rows[i].selection, rows[i].interaction, rows[i].total].map((v, j) => (
                    <td key={j} className={v >= 0 ? 'pos' : 'neg'}>{pct(v, 2)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td><strong>Total</strong></td>
                <td style={{ color: Math.abs(sumWp - 1) > 1e-6 ? 'var(--bad)' : undefined }}>{pct(sumWp, 0)}</td>
                <td style={{ color: Math.abs(sumWb - 1) > 1e-6 ? 'var(--bad)' : undefined }}>{pct(sumWb, 0)}</td>
                <td>{pct(Rp, 2)}</td>
                <td>{pct(Rb, 2)}</td>
                <td><strong>{pct(totals.a, 2)}</strong></td>
                <td><strong>{pct(totals.s, 2)}</strong></td>
                <td><strong>{pct(totals.i, 2)}</strong></td>
                <td><strong>{pct(Rp - Rb, 2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        {(Math.abs(sumWp - 1) > 1e-6 || Math.abs(sumWb - 1) > 1e-6) && <p className="muted">Weights should add up to 100% for the effects to sum to the active return.</p>}
        <Chart
          data={[
            { x: segs.map((s) => s.name), y: rows.map((r) => r.allocation), type: 'bar', name: 'Allocation', marker: { color: palette[0] } } as Data,
            { x: segs.map((s) => s.name), y: rows.map((r) => r.selection), type: 'bar', name: 'Selection', marker: { color: palette[2] } } as Data,
            { x: segs.map((s) => s.name), y: rows.map((r) => r.interaction), type: 'bar', name: 'Interaction', marker: { color: palette[5] } } as Data,
          ]}
          layout={{ barmode: 'group', yaxis: { tickformat: '.2%' } }}
          x=""
          y="Contribution to active return"
          height={300}
        />
        <TryThis
          items={[
            'Overweighting Health care was a mistake (it lagged the benchmark): negative allocation effect. But overweighting Technology helped. Find the change that would have added most.',
            'Set every portfolio weight equal to the benchmark’s. Allocation and interaction vanish: what is left is pure stock selection.',
            'Set every portfolio return equal to the benchmark’s. Now only the allocation effect remains.',
          ]}
        />
        <CodeRef file="src/models/performance.ts">TWR, IRR by bisection, tracking error, IR and Brinson–Fachler.</CodeRef>
        <OnTheJob>
          Performance and attribution analysts produce these numbers monthly for every fund, and PMs have to explain them to
          clients and the investment committee. “Most of our outperformance came from stock selection in technology, partly offset by
          our underweight in energy” is the sentence this table writes for you.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'TWR removes the effect of client cash flows and is used to judge managers; MWR (IRR) is the investor’s own experience.',
          'A good benchmark is investable, specified in advance and matches the manager’s style.',
          'Tracking error is active risk; the information ratio is active return per unit of active risk.',
          'Ten years of data cannot reliably separate an IR of 0.3 from luck.',
          'Brinson splits active return into allocation, selection and interaction, which add up exactly.',
        ]}
      />
      <InterviewCorner id="performance" />
      <Quiz
        questions={[
          {
            q: 'A fund returns +10% in year 1 and +10% in year 2. A client invests €100 at the start and €1,000 after year 1. Which is true?',
            options: ['TWR > MWR', 'TWR = MWR', 'TWR < MWR', 'MWR is undefined'],
            answer: 1,
            why: 'Every euro earned 10% a year whenever it was invested, so the IRR is also 10%. The two measures only differ when returns vary across periods with different amounts invested.',
          },
          {
            q: 'Active return 1.5% a year, tracking error 5%. The information ratio is…',
            options: ['0.03', '0.3', '3.3', '7.5'],
            answer: 1,
            why: 'IR = 1.5%/5% = 0.3.',
          },
          {
            q: 'You overweight a sector by 5%. The sector’s benchmark return was 12% and the total benchmark returned 8%. The allocation effect is…',
            options: ['+0.2%', '+0.6%', '−0.2%', '+0.4%'],
            answer: 0,
            why: '(w_p − w_b)(r_b,i − R_b) = 5% × (12% − 8%) = 0.2%.',
          },
        ]}
      />
      <LessonFooter id="performance" />
    </article>
  );
}
