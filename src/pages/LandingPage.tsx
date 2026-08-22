import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { safeStorage } from '../utils/safeStorage';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import BentoGrid from '../components/landing/BentoGrid';
import WallOfLove from '../components/landing/WallOfLove';
import BottomCTA from '../components/landing/BottomCTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  const { isLoading } = useAuthStore();
  const location = useLocation();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const token = safeStorage.getItem('token');
    if (token) {
      setShowLanding(false);
    }
  }, []);

  if (isLoading || !showLanding) {
    return null;
  }

  return (
    <div className="landing-page">
      <Navbar />
      <main className="landing-main">
        <Hero />
        <BentoGrid />
        <WallOfLove />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}