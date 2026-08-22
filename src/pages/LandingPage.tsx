import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import BentoGrid from '../components/landing/BentoGrid';
import WallOfLove from '../components/landing/WallOfLove';
import BottomCTA from '../components/landing/BottomCTA';
import Footer from '../components/landing/Footer';
import '../components/landing/landing.css';
import { useAuthStore } from '../stores/authStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const themeMode = useAuthStore((s) => s.themeMode);
  const setThemeMode = useAuthStore((s) => s.setThemeMode);
  const [activeSection, setActiveSection] = useState('top');

  const handleGetStarted = () => navigate('/auth');
  const handleSignIn = () => navigate('/login');

  useEffect(() => {
    window.hideSplash?.();

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

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing-wrapper">
      <Navbar
        onNavigate={(_, path) => navigate(path)}
        isAuthenticated={false}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        themeMode={themeMode}
        setThemeMode={setThemeMode as any}
        currentPage="landing"
        activeSection={activeSection}
        onSection={scrollTo}
      />
      <main id="main-content">
        <section id="top"><Hero onGetStarted={handleGetStarted} onSeeHowItWorks={() => scrollTo('systems')} /></section>
        <section id="systems"><BentoGrid onGetStarted={handleGetStarted} /></section>
        <section id="stories"><WallOfLove /></section>
        <BottomCTA onGetStarted={handleGetStarted} />
      </main>
      <Footer onNavigate={(_, path: string) => navigate(path)} onSignIn={handleSignIn} onGetStarted={handleGetStarted} onBackToTop={() => scrollTo('top')} />
    </div>
  );
}
