import { useState } from 'react';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, InterviewCorner, LessonFooter, LessonHeader, Note, OnTheJob, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { normCdf } from '../models/math/normal';
import { fundamentalLawIR, wealthAfterFees, yearsToSignificance } from '../models/performance';

const eur = (v: number) => `€${Math.round(v).toLocaleString('en')}`;

export default function Active() {
  // ── Fees ──
  const [gross, setGross] = useState(0.06);
  const [fee, setFee] = useState(0.015);
  const [passiveFee, setPassiveFee] = useState(0.002);
  const [years, setYears] = useState(30);
  const initial = 100000;
  const ys = Array.from({ length: years + 1 }, (_, i) => i);
  const wActive = wealthAfterFees(initial, gross, fee, years);
  const wPassive = wealthAfterFees(initial, gross, passiveFee, years);
  const wGross = wealthAfterFees(initial, gross, 0, years);

  // ── Turnover ──
  const [turnover, setTurnover] = useState(0.8);
  const [costBps, setCostBps] = useState(25);
  const tradingDrag = (turnover * 2 * costBps) / 1e4; // buy and sell side of each turnover unit

  // ── Fundamental law ──
  const [ic, setIc] = useState(0.05);
  const [breadth, setBreadth] = useState(50);
  const brs = linspace(1, 1000, 200);

  // ── Luck vs skill ──
  const [ir, setIr] = useState(0.5);
  const [managers, setManagers] = useState(1000);
  const [record, setRecord] = useState(10);
  const pLucky = 1 - normCdf(2); // t > 2 with zero skill
  const pSkillShows = 1 - normCdf(2 - ir * Math.sqrt(record));
  const irs = linspace(0.1, 1.5, 57);

  return (
    <article>
      <LessonHeader id="active" />

      <Section title="1. The cost of fees">
        <InPlainWords>
          A 1.5% fee sounds small next to a 6% return. But it is charged every year on the whole pot, so it compounds just like the
          return does, in the other direction. Over a working life it takes a third or more of the final wealth.
        </InPlainWords>
        <Playground
          controls={
            <>
              <Slider label="Gross market return" value={gross} min={0.02} max={0.1} step={0.0025} onChange={setGross} format={(v) => pct(v, 2)} />
              <Slider label={<>Active fund <Term name="Total expense ratio">ongoing charge</Term></>} value={fee} min={0} max={0.03} step={0.0005} onChange={setFee} format={(v) => pct(v, 2)} />
              <Slider label="Index fund charge" value={passiveFee} min={0} max={0.01} step={0.0005} onChange={setPassiveFee} format={(v) => pct(v, 2)} />
              <Slider label="Years" value={years} min={5} max={45} step={1} onChange={setYears} format={(v) => `${v}y`} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'No fees', value: eur(wGross) },
              { label: <Term name="Index fund">Index fund</Term>, value: eur(wPassive) },
              { label: 'Active fund (no alpha)', value: eur(wActive) },
              { label: 'Share of wealth lost to fees', value: pct(1 - wActive / wGross, 0), hint: 'active fund vs no fees' },
              { label: 'Alpha needed to match the index fund', value: pct(((1 + gross) * (fee - passiveFee)) / (1 - fee), 2), hint: 'every single year' },
            ]}
          />
          <Chart
            data={[
              line(ys, ys.map((y) => wealthAfterFees(initial, gross, 0, y)), 'No fees', { line: { color: palette[5], dash: 'dot' } }),
              line(ys, ys.map((y) => wealthAfterFees(initial, gross, passiveFee, y)), 'Index fund', { line: { color: palette[2], width: 3 } }),
              line(ys, ys.map((y) => wealthAfterFees(initial, gross, fee, y)), 'Active fund, no alpha', { line: { color: palette[3], width: 3 } }),
            ]}
            x="Years"
            y="Value of €100,000"
          />
        </Playground>
        <TryThis
          items={[
            'Set a 2% fee, as charged by many retail funds and wealth managers in Europe, over 40 years. How much of the final pot is gone?',
            <>Hedge funds traditionally charged “2 and 20”: 2% a year plus a 20% <Term name="Performance fee">performance fee</Term>. On a 6% gross return that is about 2% + 0.2 × 4% ≈ 2.8% a year.</>,
          ]}
        />
      </Section>

      <Section title="2. Hidden costs: turnover and trading">
        <p>
          The ongoing charge does not include <Term name="Transaction costs">trading costs</Term>: commissions, the bid–ask spread and
          market impact. They grow with <Term name="Turnover">turnover</Term>, which for many active equity funds is 50–100% a year.
        </p>
        <Playground
          controls={
            <>
              <Slider label="Annual turnover (one-way)" value={turnover} min={0} max={3} step={0.05} onChange={setTurnover} format={(v) => pct(v, 0)} />
              <Slider label="Cost per trade (each side)" value={costBps} min={1} max={100} step={1} onChange={setCostBps} format={(v) => `${v}bp`} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Trading cost drag', value: pct(tradingDrag, 2), hint: 'per year, on top of fees' },
              { label: 'Total cost (with the active fee)', value: pct(tradingDrag + fee, 2) },
            ]}
          />
        </Playground>
        <Note title="Why size matters">
          Market impact rises with trade size relative to daily volume. A strategy that works at €100m can stop working at €10bn:
          one reason successful funds close to new money, and why capacity is a standard question in manager due diligence.
        </Note>
      </Section>

      <Section title="3. The arithmetic of active management">
        <p>
          William Sharpe’s (1991) argument needs no data. Passive investors hold the market. So active investors, taken together,
          must also hold the market. Before costs, the average active euro therefore earns exactly the market return. After costs,
          it must earn less. This is the <Term name="Arithmetic of active management">arithmetic of active management</Term>.
        </p>
        <Example title="What it does not say">
          It does not say no manager has skill. It says active management is a zero-sum game between professionals before costs and
          negative-sum after them. To win you have to be better than the other professionals by more than your costs. That is the
          bar every PM is measured against, and the honest framing to use in interviews.
        </Example>
      </Section>

      <Section title="4. The fundamental law: skill × breadth">
        <p>
          Grinold’s <Term name="Fundamental law of active management">fundamental law</Term> says how good an active strategy can be.
          A small edge applied to many independent bets beats a large edge applied to a few.
        </p>
        <TexBlock>{String.raw`IR \approx IC \cdot \sqrt{BR}`}</TexBlock>
        <Symbols
          items={[
            ['IR', <><Term name="Information ratio">Information ratio</Term>: active return per unit of tracking error</>],
            ['IC', <><Term name="Information coefficient">Information coefficient</Term>: correlation of your forecasts with what happens</>],
            ['BR', <><Term name="Breadth">Breadth</Term>: independent bets per year</>],
          ]}
        />
        <Playground
          controls={
            <>
              <Slider label="Skill (IC)" value={ic} min={0.01} max={0.2} step={0.005} onChange={setIc} format={(v) => v.toFixed(3)} />
              <Slider label="Breadth (bets per year)" value={breadth} min={1} max={1000} step={1} onChange={setBreadth} />
            </>
          }
        >
          <Stats items={[{ label: 'Information ratio', value: num(fundamentalLawIR(ic, breadth), 2), hint: fundamentalLawIR(ic, breadth) > 0.5 ? 'top-quartile territory' : '' }]} />
          <Chart
            data={[0.02, 0.05, 0.1].map((c, k) => line(brs, brs.map((b) => fundamentalLawIR(c, b)), `IC = ${c}`, { line: { color: palette[k], width: 2.5 } })).concat([
              { x: [breadth], y: [fundamentalLawIR(ic, breadth)], type: 'scatter', mode: 'markers', name: 'You', marker: { color: palette[3], size: 11 } },
            ])}
            layout={{ xaxis: { type: 'log' } }}
            x="Breadth (log scale)"
            y="Information ratio"
            height={300}
          />
        </Playground>
        <TryThis
          items={[
            'A concentrated stock picker: 20 bets a year. What IC is needed for an IR of 0.5? (About 0.11, a very high hit rate.)',
            'A quant equity fund: 1,000 small independent bets with IC 0.02 gets an IR of about 0.63. This is why quant funds trade so many positions.',
          ]}
        />
      </Section>

      <Section title="5. Skill or luck?">
        <p>
          A manager’s alpha t-statistic is roughly IR × √years. To be confident (t ≈ 2) that a genuinely skilled manager is
          skilled takes a long time, and in a big enough crowd of unskilled managers, some will look brilliant by chance.
        </p>
        <TexBlock>{String.raw`t \approx IR\sqrt T \quad\Rightarrow\quad T_{t=2} = \left(\frac{2}{IR}\right)^2`}</TexBlock>
        <Playground
          controls={
            <>
              <Slider label="True IR of a skilled manager" value={ir} min={0.1} max={1.5} step={0.05} onChange={setIr} format={(v) => v.toFixed(2)} />
              <Slider label="Length of track record" value={record} min={1} max={30} step={1} onChange={setRecord} format={(v) => `${v}y`} />
              <Slider label="Unskilled managers in the market" value={managers} min={100} max={10000} step={100} onChange={setManagers} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Years to reach t = 2', value: `${num(yearsToSignificance(ir), 0)}y`, hint: 'on average' },
              { label: 'Chance the skilled one shows t > 2', value: pct(pSkillShows, 0), hint: `after ${record} years` },
              { label: 'Unskilled managers with t > 2', value: `≈ ${Math.round(managers * pLucky)}`, hint: 'pure luck, any horizon' },
            ]}
          />
          <Chart
            data={[line(irs, irs.map((x) => yearsToSignificance(x)), 'Years needed for t = 2', { line: { color: palette[0], width: 3 } })]}
            layout={{ yaxis: { type: 'log' } }}
            x="True information ratio"
            y="Years (log scale)"
            height={280}
          />
        </Playground>
        <Note title="What fund selectors do about it">
          Because track records are so noisy, professional manager research weighs the investment process, the team, incentives,
          capacity and consistency of style, not just past returns. Survivorship and selection bias make the published track records
          look better than the average experience.
        </Note>
        <CodeRef file="src/models/performance.ts">Fee compounding, the fundamental law and years-to-significance.</CodeRef>
        <OnTheJob>
          Expect a question on active vs passive in almost every buy-side interview, even at active managers. The strong answer
          acknowledges the arithmetic and the evidence, then explains where and how active management can still add value (less
          efficient markets, genuine process edge, risk management, client solutions) and what it must cost to be worth it.
        </OnTheJob>
      </Section>

      <Takeaways
        items={[
          'Fees compound: 1–2% a year takes a quarter to a third of wealth over a career.',
          'Turnover adds trading costs on top of the stated fee.',
          'Before costs, active management is zero-sum; after costs the average active euro must underperform.',
          'IR ≈ IC·√breadth: many small independent bets beat a few large ones.',
          'Proving skill takes (2/IR)² years: 16 years for an excellent IR of 0.5.',
        ]}
      />
      <InterviewCorner id="active" />
      <Quiz
        questions={[
          {
            q: 'Over 30 years at 6% gross, what share of final wealth does a 1% annual fee cost?',
            options: ['1%', 'About 10%', 'About 26%', 'About 50%'],
            answer: 2,
            why: '0.99³⁰ ≈ 0.74, so the investor ends with about 74% of the no-fee wealth: roughly a quarter lost.',
          },
          {
            q: 'IC = 0.04 and 100 independent bets a year. The information ratio is about…',
            options: ['0.04', '0.2', '0.4', '4.0'],
            answer: 2,
            why: '0.04 × √100 = 0.4.',
          },
          {
            q: 'Among 2,000 managers with no skill, how many will show an alpha t-stat above 2?',
            options: ['None', 'About 5', 'About 45', 'About 500'],
            answer: 2,
            why: 'P(t > 2) ≈ 2.3% under no skill, so about 46 managers will look significantly skilled by chance alone.',
          },
        ]}
      />
      <LessonFooter id="active" />
    </article>
  );
}
