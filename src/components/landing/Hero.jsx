import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  DollarSign, 
  Dumbbell, 
  Moon, 
  CheckCircle2, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Star 
} from 'lucide-react';

/**
 * Staff-Level Hero Section for LifeAgent
 * High-conversion typography, trust badges, avatar clusters, and interactive live preview.
 */
export default function Hero({ 
  onGetStarted, 
  onJoinWaitlist,
  onExploreFeatures
}) {
  const [activePreviewTab, setActivePreviewTab] = useState('sleep');
  const [isHovered, setIsHovered] = useState(false);
  const [autoPauseUntil, setAutoPauseUntil] = useState(0);

  const previewTabs = [
    { id: 'sleep', label: 'Polyphasic Sleep', icon: Moon },
    { id: 'gym', label: 'Gym & Volume', icon: Dumbbell },
    { id: 'finance', label: 'Cashflow', icon: DollarSign },
    { id: 'copilot', label: 'AI Copilot', icon: Bot },
    { id: 'habits', label: 'Habits', icon: CheckCircle2 }
  ];

  // Auto-cycle through preview tabs smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHovered || Date.now() < autoPauseUntil) return;
      setActivePreviewTab(current => {
        const idx = previewTabs.findIndex(t => t.id === current);
        const nextIdx = (idx + 1) % previewTabs.length;
        return previewTabs[nextIdx].id;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, autoPauseUntil]);

  const handleTabClick = (tabId) => {
    setActivePreviewTab(tabId);
    setAutoPauseUntil(Date.now() + 8000); // pause cycle for 8s on interaction
  };

  return (
    <section className="landing-hero" id="hero" aria-label="Introduction">
      <div className="landing-container">
        <div className="landing-hero-content">
          {/* Eyebrow Status Badge */}
          <div className="landing-hero-badge-row">
            <div className="landing-badge">
              <span className="landing-pulse-dot" aria-hidden="true"></span>
              <span>LIFE AGENT OS v2.0 • AUTONOMOUS PERSONAL INTELLIGENCE</span>
            </div>
            <div className="landing-badge landing-badge-green">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>100% Local-First Encryption</span>
            </div>
          </div>

          {/* Primary High-Impact Headline */}
          <h1 className="landing-hero-title">
            The Personal AI Agent <br />
            for Your <span className="highlight-blue">Entire Life</span>.
          </h1>

          {/* Subtitle */}
          <p className="landing-hero-subtitle">
            Track polyphasic sleep, gym volume, cashflow telemetry, notes, and daily habits with zero friction — unified by an autonomous local-first AI copilot.
          </p>

          {/* Action CTAs */}
          <div className="landing-hero-cta-group">
            <button 
              type="button" 
              className="landing-btn-primary"
              onClick={onGetStarted}
              aria-label="Get started with LifeAgent for free"
            >
              Get Started Free <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button 
              type="button" 
              className="landing-btn-secondary"
              onClick={onJoinWaitlist}
              aria-label="Join VIP Early Access Waitlist"
            >
              Join VIP Waitlist
            </button>
          </div>

          {/* Social Proof & Rating Cluster */}
          <div className="landing-social-proof">
            <div className="landing-avatar-stack" aria-hidden="true">
              <img 
                className="landing-avatar-img" 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" 
                alt="User avatar 1" 
              />
              <img 
                className="landing-avatar-img" 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                alt="User avatar 2" 
              />
              <img 
                className="landing-avatar-img" 
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face" 
                alt="User avatar 3" 
              />
              <img 
                className="landing-avatar-img" 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" 
                alt="User avatar 4" 
              />
              <img 
                className="landing-avatar-img" 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" 
                alt="User avatar 5" 
              />
            </div>
            <div className="landing-proof-text">
              <div className="landing-stars" aria-label="5 out of 5 stars">
                ★★★★★ <strong style={{ color: 'var(--text-main)', marginLeft: '4px' }}>4.9/5</strong>
              </div>
              <span>Trusted by <strong>2,500+</strong> high performers, indie founders & biohackers</span>
            </div>
          </div>
        </div>

        {/* Interactive 80% Product Preview Frame */}
        <div 
          className="landing-mockup-frame"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Interactive Product Preview"
        >
          {/* Mockup Titlebar */}
          <div className="landing-mockup-header">
            <div className="landing-mockup-dots" aria-hidden="true">
              <span className="landing-mockup-dot red"></span>
              <span className="landing-mockup-dot yellow"></span>
              <span className="landing-mockup-dot green"></span>
              <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                lifeagent.os // active-telemetry
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="landing-mockup-tabs" role="tablist">
              {previewTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activePreviewTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`landing-mockup-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mockup Dynamic Content Body */}
          <div className="landing-mockup-body">
            {/* 1. Polyphasic Sleep Preview */}
            {activePreviewTab === 'sleep' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Circadian Recovery Score</span>
                    <span className="landing-badge landing-badge-green" style={{ margin: 0, padding: '3px 10px', fontSize: '0.72rem' }}>Optimal</span>
                  </div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent-blue)', marginTop: '8px', lineHeight: 1 }}>
                    7h 48m
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    11:15 PM Bedtime • 07:03 AM Wakeup • 0 Sleep Debt
                  </p>
                  
                  {/* Sleep Stage Segmented Bar */}
                  <div className="sleep-stage-bar" aria-label="Sleep stages distribution">
                    <div className="sleep-stage-segment sleep-stage-deep" style={{ width: '22%' }} title="Deep Sleep 22%" />
                    <div className="sleep-stage-segment sleep-stage-rem" style={{ width: '28%' }} title="REM Sleep 28%" />
                    <div className="sleep-stage-segment sleep-stage-core" style={{ width: '42%' }} title="Core Sleep 42%" />
                    <div className="sleep-stage-segment sleep-stage-light" style={{ width: '8%' }} title="Awake 8%" />
                  </div>
                  <div className="sleep-legend">
                    <span className="sleep-legend-item"><span className="sleep-dot" style={{ background: '#6366f1' }} /> Deep (1h 43m)</span>
                    <span className="sleep-legend-item"><span className="sleep-dot" style={{ background: '#8b5cf6' }} /> REM (2h 11m)</span>
                    <span className="sleep-legend-item"><span className="sleep-dot" style={{ background: '#3b82f6' }} /> Core (3h 18m)</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '12px' }}>Polyphasic Nap & Biometric Telemetry</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.82rem' }}>
                        <span>⚡ Midday Power Nap (20m)</span>
                        <strong style={{ color: '#10b981' }}>+18% Alertness</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.82rem' }}>
                        <span>❤️ Resting Heart Rate</span>
                        <strong style={{ color: 'var(--text-main)' }}>52 bpm (Dip 14%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.82rem' }}>
                        <span>📈 Heart Rate Variability (HRV)</span>
                        <strong style={{ color: 'var(--accent-blue)' }}>78 ms (Peak)</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Synced via local telemetry. Next recommended wind-down: 10:45 PM.
                  </div>
                </div>
              </div>
            )}

            {/* 2. Gym & Volume Preview */}
            {activePreviewTab === 'gym' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Weekly Volume Lifted</div>
                  <div style={{ fontSize: '2.6rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '8px', lineHeight: 1 }}>
                    28,450 <span style={{ fontSize: '1.2rem', color: 'var(--accent-blue)' }}>kg</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '6px' }}>↑ 14% vs previous 7-day microcycle</div>

                  {/* PRs Grid */}
                  <div className="gym-pr-grid">
                    <div className="gym-pr-item">
                      <div className="gym-pr-name">Bench Press</div>
                      <div className="gym-pr-weight">110 kg</div>
                      <div className="gym-pr-badge">🏆 New PR</div>
                    </div>
                    <div className="gym-pr-item">
                      <div className="gym-pr-name">Deadlift</div>
                      <div className="gym-pr-weight">185 kg</div>
                      <div className="gym-pr-badge">🔥 3 Sets</div>
                    </div>
                    <div className="gym-pr-item">
                      <div className="gym-pr-name">Overhead</div>
                      <div className="gym-pr-weight">72.5 kg</div>
                      <div className="gym-pr-badge">⚡ Clean</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px' }}>Daily Protein & Nutrition Target</div>
                    <div className="macro-progress-wrapper" style={{ marginTop: 0 }}>
                      <div className="macro-header">
                        <span>Protein Intake</span>
                        <strong style={{ color: '#10b981' }}>172g / 180g (95%)</strong>
                      </div>
                      <div className="macro-bar-track">
                        <div className="macro-bar-fill" style={{ width: '95%' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.82rem' }}>
                        <span>Active Session: Push Hypertrophy A</span>
                        <strong style={{ color: 'var(--text-main)' }}>58 mins</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.82rem' }}>
                        <span>Estimated Energy Output</span>
                        <strong style={{ color: '#f59e0b' }}>540 kcal</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Finance & Cashflow Preview */}
            {activePreviewTab === 'finance' && (
              <div>
                <div className="finance-stats-row">
                  <div className="finance-stat-box">
                    <div className="finance-stat-label">Monthly Inflow</div>
                    <div className="finance-stat-value" style={{ color: '#10b981' }}>+$7,850.00</div>
                  </div>
                  <div className="finance-stat-box">
                    <div className="finance-stat-label">Total Outflow</div>
                    <div className="finance-stat-value" style={{ color: '#ef4444' }}>-$2,140.00</div>
                  </div>
                  <div className="finance-stat-box">
                    <div className="finance-stat-label">Net Savings Rate</div>
                    <div className="finance-stat-value" style={{ color: 'var(--accent-blue)' }}>72.7% (+$5.7k)</div>
                  </div>
                </div>

                <div className="expense-category-list">
                  <div className="expense-category-item">
                    <div className="expense-cat-header">
                      <span>Tech Infrastructure & SaaS</span>
                      <span>$420.00 (20%)</span>
                    </div>
                    <div className="expense-cat-bar">
                      <div className="expense-cat-fill" style={{ width: '20%', background: 'var(--accent-blue)' }} />
                    </div>
                  </div>
                  <div className="expense-category-item">
                    <div className="expense-cat-header">
                      <span>Organic Nutrition & Whole Foods</span>
                      <span>$980.00 (45%)</span>
                    </div>
                    <div className="expense-cat-bar">
                      <div className="expense-cat-fill" style={{ width: '45%', background: '#10b981' }} />
                    </div>
                  </div>
                  <div className="expense-category-item">
                    <div className="expense-cat-header">
                      <span>Fitness, Gym & Biohacking Gear</span>
                      <span>$350.00 (16%)</span>
                    </div>
                    <div className="expense-cat-bar">
                      <div className="expense-cat-fill" style={{ width: '16%', background: '#f59e0b' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. AI Copilot Preview */}
            {activePreviewTab === 'copilot' && (
              <div className="ai-copilot-card">
                <div className="ai-message-bubble">
                  <div className="ai-message-avatar" aria-hidden="true">
                    <Bot size={16} />
                  </div>
                  <div className="ai-message-content">
                    <strong>Autonomous Copilot Audit:</strong><br />
                    "I synthesized your telemetry for today. Sleep recovery reached <strong>94%</strong> with 0 sleep debt. You hit a new PR on Bench Press (110 kg) and logged <strong>172g protein</strong>. Your monthly cashflow stands at <strong>72.7% savings rate</strong>. Ready for tomorrow's scheduled 9:00 AM deep work session?"
                  </div>
                </div>

                <div className="ai-quick-actions">
                  <span className="ai-action-chip">⚡ Reschedule Leg Day</span>
                  <span className="ai-action-chip">📊 Run Weekly Financial Audit</span>
                  <span className="ai-action-chip">💤 Plan 20m Midday Nap</span>
                  <span className="ai-action-chip">🥩 Log +25g Whey Isolate</span>
                </div>
              </div>
            )}

            {/* 5. Habits Preview */}
            {activePreviewTab === 'habits' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {[
                  { name: '100% Morning Sunlight & Hydration', streak: '32 days', status: 'Completed', tag: 'Health' },
                  { name: '90-min Deep Work Pomodoro Block', streak: '18 days', status: 'Completed', tag: 'Productivity' },
                  { name: '180g Daily Protein Intake Goal', streak: '24 days', status: '95% Done', tag: 'Fitness' },
                  { name: 'No Blue Light 60m Before Sleep', streak: '14 days', status: 'Pending 10pm', tag: 'Circadian' }
                ].map((habit, idx) => (
                  <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{habit.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        🔥 {habit.streak} streak • {habit.tag}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: habit.status.includes('Completed') ? '#10b981' : 'var(--accent-blue)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                      {habit.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
