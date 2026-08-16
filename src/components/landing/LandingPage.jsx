import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import BentoGrid from './BentoGrid';
import WallOfLove from './WallOfLove';
import BottomCTA from './BottomCTA';
import Footer from './Footer';
import './landing.css';

/**
 * Staff-Level Master Landing Page Component for LifeAgent
 * Orchestrates Navbar, Hero, BentoGrid, WallOfLove, BottomCTA, and Footer.
 */
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
  themeColor
}) {
  const navHandler = onNavigate || navigate;
  const isUserAuthenticated = Boolean(isAuthenticated || token);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else if (navHandler) {
      navHandler('auth', '/auth');
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else if (navHandler) {
      navHandler('auth', '/auth');
    }
  };

  const handleJoinWaitlist = () => {
    if (onJoinWaitlist) {
      onJoinWaitlist();
    } else if (navHandler) {
      navHandler('waitlist', '/waitlist');
    }
  };

  return (
    <div className="landing-wrapper">
      {/* Sticky High-Contrast Navigation */}
      <Navbar
        onNavigate={navHandler}
        isAuthenticated={isUserAuthenticated}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        themeColor={themeColor}
        currentPage="landing"
      />

      {/* Main Content Flow */}
      <main id="main-content">
        {/* Hero Section with Interactive Preview */}
        <Hero
          onGetStarted={handleGetStarted}
          onJoinWaitlist={handleJoinWaitlist}
        />

        {/* 4 Core Pillars Bento Grid (Sleep, Gym Volume, Finance, AI Copilot) */}
        <BentoGrid
          onGetStarted={handleGetStarted}
        />

        {/* Wall of Love (High-Contrast Testimonial Grid & Social Proof) */}
        <WallOfLove />

        {/* Bottom CTA Card */}
        <BottomCTA
          onGetStarted={handleGetStarted}
          onJoinWaitlist={handleJoinWaitlist}
        />
      </main>

      {/* Semantic Footer */}
      <Footer
        onNavigate={navHandler}
        onSignIn={handleSignIn}
        onGetStarted={handleGetStarted}
      />
    </div>
  );
}
