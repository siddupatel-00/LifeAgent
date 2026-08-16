import { ArrowUpRight, Brain, Dumbbell, Moon, WalletCards } from 'lucide-react';

const systems = [
  { number: '02', title: 'Sleep, without the guesswork.', copy: 'See recovery as a pattern, not a score. LifeAgent makes the next good decision obvious.', icon: Moon, className: 'system-sleep' },
  { number: '03', title: 'Training with context.', copy: 'Your gym log should know when to push, when to hold, and why.', icon: Dumbbell, className: 'system-training' },
  { number: '04', title: 'Money with a pulse.', copy: 'A quieter view of cashflow that helps you act before the month gets loud.', icon: WalletCards, className: 'system-money' },
];

function MiniBars() { return <div className="mini-bars" aria-hidden="true">{[32, 45, 38, 64, 52, 78, 61, 88, 72, 94].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>; }

export default function BentoGrid() {
  return (
    <section className="systems-section landing-container" aria-labelledby="systems-title">
      <div className="section-intro"><span className="section-kicker">A connected view</span><h2 id="systems-title">The tools are separate.<br /><em>Your life is not.</em></h2><p>LifeAgent gives every important signal a place to land, then helps you see what they mean together.</p></div>
      <div className="systems-grid">
        <article className="system-card system-agent"><div className="card-topline"><span>01 / agent</span><Brain size={18} /></div><h3>Less dashboard.<br /><em>More direction.</em></h3><p>The copilot watches for friction between your plans and your energy, then gives you one useful next move.</p><div className="agent-message"><span className="agent-avatar"><Brain size={14} /></span><span>“You can fit the run in today. Shift finance to tomorrow morning.”</span><ArrowUpRight size={15} /></div></article>
        {systems.map(({ number, title, copy, icon: Icon, className }) => <article className={`system-card ${className}`} key={number}><div className="card-topline"><span>{number} / system</span><Icon size={18} /></div><h3>{title}</h3><p>{copy}</p>{className === 'system-sleep' && <div className="sleep-line"><span /><span /><span /><span /><span /><span /><span /></div>}{className === 'system-training' && <MiniBars />}{className === 'system-money' && <div className="money-total"><small>available this month</small><strong>$2,480.00</strong><span>↑ 18.4%</span></div>}</article>)}
      </div>
      <div className="systems-footer"><span>Designed around your actual life.</span><span>Local-first by default <i /></span></div>
    </section>
  );
}
