import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Toggle } from '../components/Controls';
import { Example, InterviewCard, LessonFooter, LessonHeader, Note, OnTheJob, Section, Takeaways, Term, TryThis } from '../components/Lesson';
import { extraTopics, interviewQuestions } from '../data/interview';
import { lessons } from '../lessons';

const topicLabel = (id: string) => extraTopics[id] ?? lessons.find((l) => l.id === id)?.title ?? id;

type Trait = 'maths' | 'writing' | 'markets' | 'people' | 'detail';
const traits: { id: Trait; label: string }[] = [
  { id: 'maths', label: 'Modelling, maths, code' },
  { id: 'markets', label: 'Forming views & debating them' },
  { id: 'writing', label: 'Writing & research' },
  { id: 'people', label: 'Clients & presenting' },
  { id: 'detail', label: 'Precision & control' },
];
const roles: { name: string; fit: Trait[]; what: string; skills: string }[] = [
  { name: 'Equity / credit research analyst', fit: ['writing', 'markets'], what: 'Cover a sector, build company models, pitch ideas to the PM.', skills: 'Accounting, valuation, Excel models, a clear pitch' },
  { name: 'Multi-asset / allocation analyst', fit: ['markets', 'maths', 'writing'], what: 'Capital market assumptions, SAA studies, tactical views, strategy notes.', skills: 'Modules 2, 4, 6; macro; Python' },
  { name: 'Quant analyst / researcher', fit: ['maths'], what: 'Factor models, optimisers, backtests, risk models, data pipelines.', skills: 'Statistics, Python, Modules 3, 4, 9' },
  { name: 'Risk analyst', fit: ['maths', 'detail'], what: 'Daily limits, VaR, stress tests, challenge the PMs.', skills: 'Module 8, statistics, Python/SQL' },
  { name: 'ALM / LDI analyst (pension, insurer)', fit: ['maths', 'detail', 'markets'], what: 'Match assets to liabilities, hedge rates and inflation with swaps.', skills: 'Module 5, fixed income, derivatives' },
  { name: 'Performance & attribution analyst', fit: ['detail', 'writing'], what: 'Returns, attribution, client and board reporting.', skills: 'Module 7, Excel, data quality' },
  { name: 'Manager research / fund selection', fit: ['people', 'writing', 'markets'], what: 'Interview and assess external managers for a pension or wealth manager.', skills: 'Modules 3, 7, 9; due diligence' },
  { name: 'Client portfolio manager / investment specialist', fit: ['people', 'markets'], what: 'Explain the strategy and performance to clients and consultants.', skills: 'Communication, Modules 7, 9' },
  { name: 'Wealth / private banking adviser', fit: ['people'], what: 'Build portfolios for individuals and families, and keep them invested.', skills: 'Modules 0, 6, 9; client skills' },
];

const STORAGE_KEY = 'pml-checklist-v1';
const checklistItems = [
  'Can explain every number on a fund factsheet (Module 1)',
  'Can draw the efficient frontier and the CML and explain the tangency portfolio (Module 2)',
  'Have run a factor regression on a real fund (Module 3; data: Kenneth French’s website)',
  'Can explain risk parity and Black–Litterman in two minutes each (Module 4)',
  'Know duration, DV01 and why pension funds hedge rates (Module 5)',
  'Can do TWR, IR and Brinson by hand (Module 7)',
  'Have a two-minute markets view, refreshed this week',
  'Have one stock pitch and one asset-allocation pitch rehearsed',
  'Have four STAR stories: teamwork, pressure, failure, leadership',
  'Python: pandas, a backtest, a chart (a GitHub repo you can show)',
  'Excel: a three-statement or DCF model, fast',
  'Registered for (or passed) CFA Level I, if you target investment roles',
  'Have spoken to at least three people working in the roles you want',
];

function loadChecks(): boolean[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as boolean[]) : [];
    return checklistItems.map((_, i) => Boolean(parsed[i]));
  } catch {
    return checklistItems.map(() => false);
  }
}

export default function Career() {
  // ── Role finder ──
  const [likes, setLikes] = useState<Trait[]>(['maths', 'markets']);
  const toggleLike = (t: Trait) => setLikes((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]));
  const ranked = roles
    .map((r) => ({ ...r, score: r.fit.filter((f) => likes.includes(f)).length / Math.sqrt(r.fit.length) }))
    .sort((a, b) => b.score - a.score);

  // ── Checklist (remembered in this browser only) ──
  const [checks, setChecks] = useState<boolean[]>(() => checklistItems.map(() => false));
  useEffect(() => setChecks(loadChecks()), []);
  const toggleCheck = (i: number) =>
    setChecks((c) => {
      const next = c.map((v, j) => (j === i ? !v : v));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: the checklist still works for this visit */
      }
      return next;
    });

  // ── Question bank ──
  const [topic, setTopic] = useState('all');
  const [level, setLevel] = useState<'all' | 'core' | 'stretch'>('all');
  const [query, setQuery] = useState('');
  const shown = useMemo(
    () =>
      interviewQuestions.filter(
        (q) => (topic === 'all' || q.topic === topic) && (level === 'all' || q.level === level) && (!query || (q.q + ' ' + q.a).toLowerCase().includes(query.toLowerCase())),
      ),
    [topic, level, query],
  );
  const [drill, setDrill] = useState<number | null>(null);
  const nextDrill = () => setDrill((d) => {
    if (shown.length <= 1) return 0;
    let k = Math.floor(Math.random() * shown.length);
    if (k === d) k = (k + 1) % shown.length;
    return k;
  });
  const topics = [...lessons.map((l) => l.id), ...Object.keys(extraTopics)].filter((t) => interviewQuestions.some((q) => q.topic === t));

  return (
    <article>
      <LessonHeader id="career" />

      <Section title="1. Pick your seat">
        <p>
          “Portfolio management” is a destination, not an entry-level job. Almost nobody starts as a{' '}
          <Term name="Portfolio manager">PM</Term>: people get there after years as an analyst, quant, risk manager or allocation
          specialist. Pick the entry seat that fits what you enjoy. Tick what you like doing:
        </p>
        <div className="toggle" role="group" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          {traits.map((t) => (
            <button key={t.id} type="button" className={likes.includes(t.id) ? 'active' : ''} onClick={() => toggleLike(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Role (best fit first)</th><th style={{ textAlign: 'left' }}>What you do</th><th style={{ textAlign: 'left' }}>What to show</th></tr></thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={r.name} style={{ opacity: r.score === 0 ? 0.5 : 1, fontWeight: i < 2 && r.score > 0 ? 600 : 400 }}>
                  <td>{r.name}</td>
                  <td style={{ textAlign: 'left', whiteSpace: 'normal' }}>{r.what}</td>
                  <td style={{ textAlign: 'left', whiteSpace: 'normal' }}>{r.skills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note title="Where the jobs are (Denmark and the Nordics)">
          Look beyond classic fund managers. Large pension funds and insurers run most of their money in-house and hire
          graduates into investment, ALM, risk and quant teams. The banks’ asset-management and private-banking arms recruit
          through graduate programmes. Independent asset managers hire fewer people, often through networks and student jobs.
          Sovereign and public funds elsewhere in the Nordics are another option. Student assistant jobs (studiejob) during your
          master’s are one of the most common routes in: apply early.
        </Note>
      </Section>

      <Section title="2. What the process looks like">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Stage</th><th style={{ textAlign: 'left' }}>What they test</th><th style={{ textAlign: 'left' }}>How to prepare</th></tr></thead>
            <tbody>
              <tr><td>CV &amp; cover letter</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Genuine interest, relevant skills, attention to detail</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>One page; quantified results; a projects line (thesis, this course’s models, a GitHub repo)</td></tr>
              <tr><td>Online tests</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Numerical and logical reasoning, sometimes personality</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Practise timed tests; most people fail on speed, not difficulty</td></tr>
              <tr><td>First interview</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Motivation, fit, basic technicals, markets awareness</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>“Tell me about yourself”, “why us”, the core questions below</td></tr>
              <tr><td>Technical interview</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Portfolio theory, valuation, statistics, maybe a coding test</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Modules 1–9; the stretch questions; mental maths</td></tr>
              <tr><td>Case / pitch</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Can you form a view, structure it and defend it?</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>A stock pitch and an allocation case, section 3</td></tr>
              <tr><td>Final round</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Would we trust you with money and clients?</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Know the firm’s funds and philosophy; ask good questions</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. The stock pitch and the portfolio case">
        <div className="grid-2">
          <Example title="Stock pitch: 3 minutes">
            <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              <li><strong>Call:</strong> “Buy X, 25% upside to €Y over 12 months.”</li>
              <li><strong>Business:</strong> what it sells, to whom, how it makes money.</li>
              <li><strong>Thesis:</strong> two or three reasons the market is wrong. Be specific and contrarian.</li>
              <li><strong>Valuation:</strong> multiples vs peers and history, or a DCF; what is priced in?</li>
              <li><strong>Catalysts:</strong> what will make the market agree, and when.</li>
              <li><strong>Risks:</strong> what would make you wrong, and your stop.</li>
              <li><strong>Portfolio fit:</strong> sizing, and what it adds to a portfolio (the PM view).</li>
            </ol>
          </Example>
          <Example title="Portfolio case: “Invest this money”">
            <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              <li><strong>Ask first:</strong> objectives, horizon, liabilities or spending, liquidity, constraints (legal, tax, ESG) → an <Term name="Investment policy statement">IPS</Term>.</li>
              <li><strong>Risk budget:</strong> how big a loss can they take? Turn it into a volatility or drawdown limit.</li>
              <li><strong>Strategic mix:</strong> a diversified allocation with reasons for each piece (Modules 2, 6).</li>
              <li><strong>Implementation:</strong> passive vs active by asset class, costs (Module 9).</li>
              <li><strong>Risk:</strong> stress test it; what happens in 2008 and 2022? (Module 8)</li>
              <li><strong>Governance:</strong> benchmark, rebalancing rule, review schedule (Modules 6, 7).</li>
            </ol>
          </Example>
        </div>
        <TryThis
          items={[
            'Practise the case on this prompt: “A Danish foundation has €200m, must pay out 4% a year for grants, wants to keep its real value forever, and cannot invest in fossil fuels.” Use the Monte Carlo in Module 6 and the stress tests in Module 8 to back your answer with numbers.',
            'Pick one listed Nordic company and write a one-page pitch. Then ask a friend to attack every number.',
          ]}
        />
        <OnTheJob>
          The best interview answers sound like the work. Interviewers notice when you can say: “I would start with the
          liabilities”, “that alpha is probably a value tilt”, or “60/40 has more than 90% of its risk in equities”. Every
          module in this course was written to give you sentences like these.
        </OnTheJob>
      </Section>

      <Section title="4. Skills checklist">
        <p className="muted">Ticks are saved in this browser only.</p>
        <ul className="checklist">
          {checklistItems.map((item, i) => (
            <li key={item}>
              <input type="checkbox" id={`chk-${i}`} checked={checks[i]} onChange={() => toggleCheck(i)} />
              <label htmlFor={`chk-${i}`}>{item}</label>
            </li>
          ))}
        </ul>
        <p>
          <strong>{checks.filter(Boolean).length} / {checklistItems.length}</strong> done.
        </p>
        <Note title="Certifications">
          The <Term name="CFA charter">CFA Program</Term> is the standard credential for investment roles and its Level I is a
          clear signal of interest on a graduate CV. For risk roles, the FRM is common; for alternatives, the CAIA. None replaces
          a strong master’s and real projects, and you do not need any of them to get a first job.
        </Note>
      </Section>

      <Section title="5. Interview question bank">
        <p>
          All {interviewQuestions.length} questions from the course. Answer out loud, in under a minute, before revealing the model
          answer. Use the drill to get them in random order.
        </p>
        <div className="career-filters">
          <select value={topic} onChange={(e) => { setTopic(e.target.value); setDrill(null); }} aria-label="Filter by topic" className="search" style={{ flex: '0 1 280px', minWidth: 0 }}>
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>{topicLabel(t)}</option>
            ))}
          </select>
          <Toggle value={level} onChange={(v) => { setLevel(v); setDrill(null); }} options={[{ value: 'all', label: 'All' }, { value: 'core', label: 'First round' }, { value: 'stretch', label: 'Stretch' }]} />
          <input className="search" type="search" placeholder="Search questions…" value={query} onChange={(e) => { setQuery(e.target.value); setDrill(null); }} />
          <button type="button" className="button" onClick={nextDrill} disabled={shown.length === 0}>
            {drill === null ? 'Start a drill' : 'Next random question'}
          </button>
          {drill !== null && (
            <button type="button" className="link-button" onClick={() => setDrill(null)}>
              Show all
            </button>
          )}
        </div>
        {shown.length === 0 && <p className="muted">No questions match.</p>}
        {drill !== null && shown[drill] ? (
          <InterviewCard key={shown[drill].q} q={shown[drill].q} a={shown[drill].a} level={shown[drill].level} topicLabel={topicLabel(shown[drill].topic)} />
        ) : (
          shown.map((x) => <InterviewCard key={x.q} q={x.q} a={x.a} level={x.level} topicLabel={topicLabel(x.topic)} />)
        )}
      </Section>

      <Section title="6. A 12-week plan">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Weeks</th><th style={{ textAlign: 'left' }}>Learn</th><th style={{ textAlign: 'left' }}>Do</th></tr></thead>
            <tbody>
              <tr><td>1–2</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}><Link to="/basics">Modules 0</Link>–<Link to="/diversification">2</Link></td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>List 20 target firms and roles; start reading the FT daily; write your “tell me about yourself”</td></tr>
              <tr><td>3–4</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}><Link to="/capm">Modules 3</Link>–<Link to="/construction">4</Link></td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Run a factor regression on a real fund in Python; reach out to three people for coffee chats</td></tr>
              <tr><td>5–6</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}><Link to="/bonds">Modules 5</Link>–<Link to="/allocation">6</Link></td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Write your stock pitch; draft the CV with a projects section; first applications</td></tr>
              <tr><td>7–8</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}><Link to="/performance">Modules 7</Link>–<Link to="/risk">8</Link></td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Practise the portfolio case; timed numerical tests</td></tr>
              <tr><td>9–10</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}><Link to="/active">Module 9</Link></td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Mock interviews with friends using the drill above; record yourself once</td></tr>
              <tr><td>11–12</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Review the weakest modules</td><td style={{ textAlign: 'left', whiteSpace: 'normal' }}>Refresh your markets view weekly; research each firm before its interview</td></tr>
            </tbody>
          </table>
        </div>
        <Note title="Use your own work">
          A master’s thesis, a project or this course’s code is a better talking point than any certificate. Be ready to explain
          what you built, why it matters to an investor, and one thing that surprised you. If your thesis is quantitative or about
          risk, it maps naturally onto risk, ALM and quant roles.
        </Note>
      </Section>

      <Takeaways
        items={[
          'Nobody starts as a PM: choose an entry seat (analyst, quant, risk, ALM, allocation, performance) that fits you.',
          'Interviews test motivation, technical basics, a markets view and whether you can structure and defend a case.',
          'Prepare one stock pitch and one portfolio case, with numbers.',
          'Practise the question bank out loud; refresh your markets view every week.',
          'Your own projects and thesis are your best evidence of interest and skill.',
        ]}
      />
      <LessonFooter id="career" />
    </article>
  );
}
