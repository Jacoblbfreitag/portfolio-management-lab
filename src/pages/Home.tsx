import { Link } from 'react-router-dom';
import { lessons } from '../lessons';

export function Home() {
  return (
    <div className="home">
      <header className="hero">
        <h1>Portfolio Management Lab</h1>
        <p>
          An interactive course on how professional investors build, run and judge portfolios, written for anyone aiming at a
          job on the buy side: asset managers, pension funds, insurers and wealth managers. Every model is built from scratch
          in this app’s code, every idea comes with a chart you can push around, and every module ends with the interview
          questions it prepares you for.
        </p>
      </header>

      <section className="section">
        <h2>How to use this</h2>
        <ol className="how">
          <li>
            <strong>New to the industry? Start with <Link to="/basics">Module 0</Link>.</strong> It explains who manages money,
            for whom, and what the different jobs are.
          </li>
          <li>
            <strong>Go in order.</strong> Modules 1–4 are portfolio theory: return and risk, diversification, CAPM and
            factors, and how real portfolios are built. Modules 5–9 are the practice: bonds and pensions, allocation, performance,
            risk and costs. Module 10 turns it into a job.
          </li>
          <li>
            <strong>Do the "Try this" boxes.</strong> Predict what a chart will do before you move the slider.
          </li>
          <li>
            <strong>Use the Interview corner.</strong> Each module ends with questions you will be asked. Answer out loud
            before you reveal the model answer. All of them are collected on the <Link to="/career">career page</Link>.
          </li>
          <li>
            <strong>Read the code.</strong> The "In the code" boxes link to the model files in <code>src/models/</code>. Being
            able to say “I built a risk-parity optimiser and a Brinson attribution from scratch” is a good interview line.
          </li>
          <li>
            <strong>Forgot a term?</strong> Look it up in the <Link to="/glossary">glossary</Link>.
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>Modules</h2>
        <div className="cards">
          {lessons.map((l) => (
            <Link key={l.id} to={l.path} className="card">
              <div className="card-num">Module {l.number}</div>
              <div className="card-title">{l.title}</div>
              <div className="card-summary">{l.summary}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Map of the course</h2>
        <div className="roadmap">
          <div><strong>The industry</strong><span>Asset owners · managers · the investment process · roles</span></div>
          <div><strong>Portfolio theory</strong><span>Returns · Sharpe · diversification · frontier · CAPM · factors</span></div>
          <div><strong>Building portfolios</strong><span>Risk parity · Black–Litterman · LDI · asset allocation · rebalancing</span></div>
          <div><strong>Judging portfolios</strong><span>TWR/MWR · attribution · VaR · stress tests · fees · skill vs luck</span></div>
          <div><strong>Getting the job</strong><span>Roles · the stock pitch · case studies · 40+ interview questions</span></div>
        </div>
        <p className="muted">
          Recommended companion reading: Bodie, Kane &amp; Marcus, <em>Investments</em>; the CFA Program curriculum
          (portfolio management readings); Andrew Ang, <em>Asset Management: A Systematic Approach to Factor Investing</em>;
          Grinold &amp; Kahn, <em>Active Portfolio Management</em>; Antti Ilmanen, <em>Expected Returns</em>.
        </p>
      </section>
    </div>
  );
}
