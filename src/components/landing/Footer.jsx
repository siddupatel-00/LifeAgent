import React from 'react';
import { 
  Sparkles, 
  ArrowUp, 
  Heart, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

/**
 * Staff-Level Semantic Footer for LifeAgent
 * Multi-column navigation, capability links, and operational status indicator.
 */
export default function Footer({ 
  onNavigate, 
  onSignIn, 
  onGetStarted 
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer" role="contentinfo">
      <div className="landing-container">
        <div className="landing-footer-grid">
          {/* Column 1: Brand & Operational Status */}
          <div>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}
              onClick={scrollToTop}
            >
              <div style={{ background: 'var(--accent-blue)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Sparkles size={18} aria-hidden="true" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                LIFE AGENT
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '18px', maxWidth: '320px' }}>
              The Personal AI Agent for Your Entire Life. Engineered for speed, clean typography, and privacy-first local telemetry.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 12px', borderRadius: '20px', fontWeight: 600 }}>
              <span className="landing-pulse-dot" style={{ width: '6px', height: '6px' }} aria-hidden="true" />
              <span>All Systems Operational • v2.0</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="landing-footer-col-title">Navigation</h4>
            <div className="landing-footer-links">
              <button 
                type="button" 
                className="landing-footer-link" 
                onClick={() => onNavigate && onNavigate('about', '/about')}
              >
                About LifeAgent
              </button>
              <button 
                type="button" 
                className="landing-footer-link" 
                onClick={() => onNavigate && onNavigate('blog', '/blog')}
              >
                Engineering Blog
              </button>
              <button 
                type="button" 
                className="landing-footer-link" 
                onClick={() => onNavigate && onNavigate('waitlist', '/waitlist')}
              >
                VIP Waitlist
              </button>
              <button 
                type="button" 
                className="landing-footer-link" 
                onClick={() => onNavigate && onNavigate('contact', '/contact')}
              >
                Contact & Support
              </button>
              <button 
                type="button" 
                className="landing-footer-link" 
                onClick={onSignIn}
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Column 3: Capabilities */}
          <div>
            <h4 className="landing-footer-col-title">Capabilities</h4>
            <div className="landing-footer-links">
              <span className="landing-footer-link" style={{ cursor: 'default' }}>Polyphasic Sleep</span>
              <span className="landing-footer-link" style={{ cursor: 'default' }}>Gym Volume & PRs</span>
              <span className="landing-footer-link" style={{ cursor: 'default' }}>Cashflow Command</span>
              <span className="landing-footer-link" style={{ cursor: 'default' }}>Autonomous AI Copilot</span>
              <span className="landing-footer-link" style={{ cursor: 'default' }}>⌘K Command Palette</span>
            </div>
          </div>

          {/* Column 4: Connect & Legal */}
          <div>
            <h4 className="landing-footer-col-title">Connect & Legal</h4>
            <div className="landing-footer-links">
              <a 
                href="https://twitter.com/Zenitsu_T7" 
                target="_blank" 
                rel="noreferrer" 
                className="landing-footer-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Creator X (@Zenitsu_T7) <ExternalLink size={12} aria-hidden="true" />
              </a>
              <button 
                type="button" 
                className="landing-footer-link" 
                onClick={() => onNavigate && onNavigate('contact', '/contact')}
              >
                Custom Licensing
              </button>
              <span className="landing-footer-link" style={{ cursor: 'default' }}>Privacy Policy</span>
              <span className="landing-footer-link" style={{ cursor: 'default' }}>Terms of Service</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="landing-footer-bottom">
          <div>
            © 2026 LifeAgent Inc. All rights reserved. Designed for high performance and deep clarity.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Keyboard Shortcut: Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>⌘K</kbd>
            </span>
            <button 
              type="button"
              className="landing-btn-ghost"
              onClick={scrollToTop}
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              aria-label="Scroll back to top"
            >
              Back to top <ArrowUp size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
