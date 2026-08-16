import { ArrowUp, ArrowUpRight } from 'lucide-react';

export default function Footer({ onNavigate, onSignIn, onBackToTop }) {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="footer-main">
          <div>
            <button className="wordmark footer-wordmark" type="button" onClick={onBackToTop}>
              <span className="wordmark-mark">L</span>
              <span>lifeagent</span>
            </button>
            <p>
              One calm place for the<br />systems that move you forward.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <span className="footer-label">Explore</span>
              <button type="button" onClick={() => document.getElementById('systems')?.scrollIntoView({ behavior: 'smooth' })}>
                Systems
              </button>
              <button type="button" onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })}>
                Field notes
              </button>
            </div>
            <div>
              <span className="footer-label">Elsewhere</span>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                X / Twitter <ArrowUpRight size={13} />
              </a>
              <button type="button" onClick={onSignIn}>
                Sign in
              </button>
              <button type="button" onClick={() => onNavigate?.('contact', '/contact')}>
                Contact
              </button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 LifeAgent</span>
          <span>Made for better days <i /></span>
          <button type="button" onClick={onBackToTop}>
            Back to top <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}
