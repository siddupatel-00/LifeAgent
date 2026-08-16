const notes = [
  ['01', '“The best productivity tool I have used is the one that tells me to stop adding tools.”', 'Maya Chen', 'Founder, Northstar'],
  ['02', '“It feels less like tracking myself and more like finally having a second brain with taste.”', 'Arjun Mehta', 'Independent builder'],
  ['03', '“The small recommendations are the whole point. One clear move beats another page of charts.”', 'Lena Ortiz', 'Product designer'],
];

export default function WallOfLove() {
  return <section className="stories-section landing-container" aria-labelledby="stories-title"><div className="stories-heading"><span className="section-kicker">Field notes</span><h2 id="stories-title">A little less noise.<br /><em>A lot more signal.</em></h2></div><div className="notes-grid">{notes.map(([number, quote, name, role]) => <figure className="note-card" key={number}><span className="note-number">{number}</span><blockquote>{quote}</blockquote><figcaption><span className="note-avatar">{name.split(' ').map((word) => word[0]).join('')}</span><span><strong>{name}</strong><small>{role}</small></span></figcaption></figure>)}</div></section>;
}
