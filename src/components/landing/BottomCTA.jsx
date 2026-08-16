import { ArrowUpRight } from 'lucide-react';

export default function BottomCTA({ onGetStarted }) {
  return <section className="closing-section landing-container"><div className="closing-inner"><span className="section-kicker">Start with one day</span><h2>Your life already has<br /><em>the data. Use it.</em></h2><p>Build a calmer operating system for the way you actually live.</p><button className="button button-light" type="button" onClick={onGetStarted}>Make it yours <ArrowUpRight size={17} /></button><span className="closing-footnote">No credit card. No complicated setup.</span></div></section>;
}
