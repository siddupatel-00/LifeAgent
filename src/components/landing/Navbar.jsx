import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ onNavigate, isAuthenticated, onGetStarted, onSignIn, themeMode = 'dark', setThemeMode, currentPage = 'landing', onSection }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const go = (id) => {
    close();
    if (currentPage !== 'landing' && onNavigate) {
      onNavigate('landing', '/');
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
      return;
    }
    onSection?.(id);
  };

  const isLight = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light') || themeMode === 'light';

  const toggleTheme = () => {
    if (!setThemeMode) return;
    const next = isLight ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('themeMode', next);
  };

  return (
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <button className="wordmark" type="button" onClick={() => go('top')} aria-label="LifeAgent home">
          <span className="wordmark-mark" aria-hidden="true">L</span>
          <span>lifeagent</span>
        </button>
        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
          <button type="button" onClick={() => go('systems')}>Systems</button>
          <button type="button" onClick={() => go('stories')}>Field notes</button>
          {setThemeMode && <button className="nav-icon" type="button" onClick={toggleTheme} aria-label="Toggle theme" title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>{isLight ? <Moon size={17} /> : <Sun size={17} />}</button>}
          <button className="nav-cta" type="button" onClick={() => { close(); (isAuthenticated ? onNavigate?.('dashboard', '/dashboard') : onGetStarted?.()); }}>Start building <ArrowUpRight size={15} /></button>
        </nav>
        <button className="nav-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </header>
  );
}
