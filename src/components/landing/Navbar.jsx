import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Monitor, 
  Zap, 
  ExternalLink 
} from 'lucide-react';

/**
 * Staff-Level Modular Navigation Bar for LifeAgent
 * Features responsive navigation, theme controls, and high-conversion CTAs.
 */
export default function Navbar({ 
  onNavigate, 
  isAuthenticated = false, 
  onGetStarted, 
  onSignIn, 
  themeMode = 'dark', 
  setThemeMode,
  currentPage = 'landing'
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId, e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);

    if (currentPage !== 'landing' && onNavigate) {
      onNavigate('landing', '/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleThemeCycle = () => {
    if (!setThemeMode) return;
    const themes = ['dark', 'light', 'night', 'pc'];
    const nextIdx = (themes.indexOf(themeMode) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    setThemeMode(nextTheme);
    try {
      localStorage.setItem('themeMode', nextTheme);
    } catch (e) {
      console.warn(e);
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return <Sun size={18} aria-hidden="true" />;
      case 'night': return <Zap size={18} aria-hidden="true" />;
      case 'pc': return <Monitor size={18} aria-hidden="true" />;
      default: return <Moon size={18} aria-hidden="true" />;
    }
  };

  return (
    <header className="landing-navbar-wrapper" role="banner">
      <div className="landing-container">
        <nav className="landing-navbar-inner" aria-label="Main Navigation">
          {/* Brand Logo & Title */}
          <div 
            className="landing-brand"
            onClick={() => onNavigate && onNavigate('landing', '/')}
            role="button"
            tabIndex={0}
            aria-label="LifeAgent Home"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate && onNavigate('landing', '/');
              }
            }}
          >
            <div className="landing-brand-logo" aria-hidden="true">
              <Sparkles size={20} />
            </div>
            <div className="landing-brand-text">
              <span className="landing-brand-title">LIFE AGENT</span>
              <span className="landing-brand-tagline">Personal AI Operating System</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="landing-nav-links" role="menubar">
            <button 
              type="button" 
              className="landing-nav-link"
              onClick={(e) => handleNavClick('features', e)}
              role="menuitem"
            >
              Features
            </button>
            <button 
              type="button" 
              className="landing-nav-link"
              onClick={(e) => handleNavClick('architecture', e)}
              role="menuitem"
            >
              Capabilities
            </button>
            <button 
              type="button" 
              className="landing-nav-link"
              onClick={(e) => handleNavClick('testimonials', e)}
              role="menuitem"
            >
              Wall of Love
            </button>
            <button 
              type="button" 
              className="landing-nav-link"
              onClick={() => onNavigate && onNavigate('about', '/about')}
              role="menuitem"
            >
              About
            </button>
            <button 
              type="button" 
              className="landing-nav-link"
              onClick={() => onNavigate && onNavigate('blog', '/blog')}
              role="menuitem"
            >
              Blog
            </button>
            <button 
              type="button" 
              className="landing-nav-link"
              onClick={() => onNavigate && onNavigate('contact', '/contact')}
              role="menuitem"
            >
              Contact
            </button>
          </div>

          {/* Nav Right CTAs & Theme Controls */}
          <div className="landing-nav-actions">
            {/* Theme Toggle Button */}
            {setThemeMode && (
              <button 
                type="button"
                className="landing-btn-ghost"
                onClick={handleThemeCycle}
                title={`Current Theme: ${themeMode}. Click to switch.`}
                aria-label={`Toggle theme, current is ${themeMode}`}
              >
                {getThemeIcon()}
              </button>
            )}

            {isAuthenticated ? (
              <button 
                type="button"
                className="landing-btn-primary"
                onClick={() => onNavigate && onNavigate('dashboard', '/dashboard')}
              >
                Open Dashboard <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  className="landing-btn-ghost"
                  onClick={onSignIn}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  className="landing-btn-primary"
                  onClick={onGetStarted}
                >
                  Get Started <ArrowRight size={16} aria-hidden="true" />
                </button>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button 
              type="button"
              className="landing-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="landing-mobile-drawer" role="menu">
          <button 
            type="button" 
            className="landing-nav-link"
            onClick={(e) => handleNavClick('features', e)}
          >
            Features & Telemetry
          </button>
          <button 
            type="button" 
            className="landing-nav-link"
            onClick={(e) => handleNavClick('architecture', e)}
          >
            Capabilities
          </button>
          <button 
            type="button" 
            className="landing-nav-link"
            onClick={(e) => handleNavClick('testimonials', e)}
          >
            Wall of Love (Reviews)
          </button>
          <button 
            type="button" 
            className="landing-nav-link"
            onClick={() => { setMobileMenuOpen(false); onNavigate && onNavigate('about', '/about'); }}
          >
            About LifeAgent
          </button>
          <button 
            type="button" 
            className="landing-nav-link"
            onClick={() => { setMobileMenuOpen(false); onNavigate && onNavigate('blog', '/blog'); }}
          >
            Blog
          </button>
          <button 
            type="button" 
            className="landing-nav-link"
            onClick={() => { setMobileMenuOpen(false); onNavigate && onNavigate('waitlist', '/waitlist'); }}
          >
            VIP Waitlist
          </button>
          <button 
            type="button" 
            className="landing-nav-link"
            onClick={() => { setMobileMenuOpen(false); onNavigate && onNavigate('contact', '/contact'); }}
          >
            Contact & Support
          </button>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            {!isAuthenticated ? (
              <>
                <button 
                  type="button" 
                  className="landing-btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => { setMobileMenuOpen(false); onSignIn && onSignIn(); }}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  className="landing-btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => { setMobileMenuOpen(false); onGetStarted && onGetStarted(); }}
                >
                  Get Started
                </button>
              </>
            ) : (
              <button 
                type="button" 
                className="landing-btn-primary" 
                style={{ width: '100%' }}
                onClick={() => { setMobileMenuOpen(false); onNavigate && onNavigate('dashboard', '/dashboard'); }}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
