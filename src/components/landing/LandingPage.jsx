import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import BentoGrid from './BentoGrid';
import WallOfLove from './WallOfLove';
import BottomCTA from './BottomCTA';
import Footer from './Footer';
import './landing.css';

export default function LandingPage({
  navigate,
  onNavigate,
  onGetStarted,
  onSignIn,
  onJoinWaitlist,
  token,
  isAuthenticated,
  themeMode,
  setThemeMode,
  themeColor,
}) {
  const navHandler = onNavigate || navigate;
  const [activeSection, setActiveSection] = useState('top');

  const handleGetStarted = onGetStarted || (() => navHandler?.('auth', '/auth'));
  const handleSignIn = onSignIn || (() => navHandler?.('auth', '/auth'));
  const handleJoinWaitlist = onJoinWaitlist || (() => navHandler?.('waitlist', '/waitlist'));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActiveSection(entry.target.id)),
      { rootMargin: '-35% 0px -55% 0px' },
    );
    ['top', 'systems', 'stories'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing-wrapper">
      <Navbar
        onNavigate={navHandler}
        isAuthenticated={Boolean(isAuthenticated || token)}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        themeColor={themeColor}
        currentPage="landing"
        activeSection={activeSection}
        onSection={scrollTo}
      />
      <main id="main-content">
        <section id="top"><Hero onGetStarted={handleGetStarted} onJoinWaitlist={handleJoinWaitlist} onSeeHowItWorks={() => scrollTo('systems')} /></section>
        <section id="systems"><BentoGrid onGetStarted={handleGetStarted} /></section>
        <section id="stories"><WallOfLove /></section>
        <BottomCTA onGetStarted={handleGetStarted} onJoinWaitlist={handleJoinWaitlist} />
      </main>
      <Footer onNavigate={navHandler} onSignIn={handleSignIn} onGetStarted={handleGetStarted} onBackToTop={() => scrollTo('top')} />
    </div>
  );
}

export { LandingPage };
