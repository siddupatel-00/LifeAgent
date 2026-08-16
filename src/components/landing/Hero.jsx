import { ArrowDownRight, ArrowUpRight, Check, Sparkles } from 'lucide-react';

const metrics = [
  ['sleep', 'Sleep debt', '−42 min', 'Good recovery'],
  ['training', 'Training load', '7.8 / 10', 'On target'],
  ['money', 'Cashflow', '$2,480', 'This month'],
];

export default function Hero({ onGetStarted, onSeeHowItWorks }) {
  return (
    <div className="hero-section">
      <div className="hero-grid-lines" aria-hidden="true" />
      <div className="landing-container hero-layout">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Personal operating system <span className="eyebrow-rule" /> 01 / 04</div>
          <h1>Make the parts of your life <em>work together.</em></h1>
          <p className="hero-lede">LifeAgent turns scattered signals from your sleep, training, money, and habits into one calm daily system.</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={onGetStarted}>Build your system <ArrowUpRight size={17} /></button>
            <button className="button button-link" type="button" onClick={onSeeHowItWorks}>See how it works <ArrowDownRight size={17} /></button>
          </div>
          <div className="hero-proof"><div className="proof-avatars"><span>AK</span><span>JM</span><span>RS</span><span>+</span></div><span>Built for people who take their days seriously.</span></div>
        </div>
        <div className="hero-product" aria-label="LifeAgent daily overview preview">
          <div className="product-window">
            <div className="window-bar"><div className="window-dots"><i /><i /><i /></div><span>lifeagent / today</span><span className="window-status"><span className="status-dot" /> synced</span></div>
            <div className="window-content">
              <div className="window-greeting"><div><span className="micro-label">THURSDAY, 17 APRIL</span><h2>Good morning, Siddu.</h2></div><span className="window-weather">18° <small>clear</small></span></div>
              <div className="focus-card"><div><span className="micro-label">TODAY'S FOCUS</span><strong>Protect the deep work.</strong><p>Your sleep is trending up. Keep the first two hours offline.</p></div><span className="focus-index">01</span></div>
              <div className="metric-list">{metrics.map(([kind, label, value, note]) => <div className="metric-row" key={kind}><span className={`metric-icon metric-${kind}`} aria-hidden="true">{kind === 'sleep' ? '◒' : kind === 'training' ? '↗' : '$'}</span><span className="metric-label">{label}<small>{note}</small></span><strong>{value}</strong><ArrowUpRight size={14} /></div>)}</div>
              <div className="assistant-note"><div className="assistant-icon"><Sparkles size={15} /></div><div><span className="micro-label">AGENT NOTE</span><p>“Move your finance review to Friday. You have a lower cognitive load after your training block.”</p></div><Check size={16} /></div>
            </div>
          </div>
          <div className="product-caption"><span>01</span><span>One view. Fewer decisions.</span><span>Scroll to explore ↓</span></div>
        </div>
      </div>
      <button className="hero-scroll" type="button" onClick={onSeeHowItWorks} aria-label="Scroll to systems"><span>scroll</span><i /></button>
    </div>
  );
}
