import React from 'react';
import { 
  Moon, 
  Dumbbell, 
  DollarSign, 
  Bot, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Flame, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  BarChart3, 
  Keyboard, 
  Database 
} from 'lucide-react';

/**
 * Staff-Level Bento Grid for LifeAgent
 * Highlights the 4 core pillars: Polyphasic Sleep, Gym Volume, Cashflow Telemetry, and AI Copilot.
 */
export default function BentoGrid({ onGetStarted }) {
  return (
    <section className="landing-section" id="features" aria-label="System Capabilities">
      <div className="landing-container">
        {/* Section Header */}
        <div className="landing-section-header">
          <div className="landing-badge">
            <Sparkles size={14} aria-hidden="true" />
            <span>UNIFIED INTELLIGENCE ENGINES</span>
          </div>
          <h2 className="landing-section-title">
            Engineered for Precision, Volume & High Agency
          </h2>
          <p className="landing-section-subtitle">
            Replace disparate apps with four synchronized telemetry engines operating locally with zero cloud bloat.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="bento-grid-container">
          
          {/* 1. Polyphasic Sleep Telemetry (7 Columns) */}
          <div className="landing-card bento-col-7">
            <div className="bento-card-top">
              <div>
                <span className="landing-badge landing-badge-purple" style={{ marginBottom: '8px' }}>
                  Biometric Engine
                </span>
                <h3 className="bento-title">Polyphasic Sleep Telemetry</h3>
                <p className="bento-desc">
                  Track circadian rhythm alignment, sleep stage hypnograms, resting HR dips, and optimal power nap windows.
                </p>
              </div>
              <div className="bento-icon-box" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                <Moon size={22} aria-hidden="true" />
              </div>
            </div>

            {/* Metric Displays */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sleep Duration</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>7h 48m</div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '2px' }}>+35m restorative</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recovery Score</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>94/100</div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '2px' }}>Optimal readiness</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Deep + REM Phase</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>3h 54m</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>50% total sleep</div>
              </div>
            </div>

            {/* Visual Sleep Stage Bar */}
            <div className="sleep-stage-bar" style={{ marginTop: '20px' }}>
              <div className="sleep-stage-segment sleep-stage-deep" style={{ width: '22%' }} title="Deep Sleep (1h 43m)" />
              <div className="sleep-stage-segment sleep-stage-rem" style={{ width: '28%' }} title="REM Sleep (2h 11m)" />
              <div className="sleep-stage-segment sleep-stage-core" style={{ width: '42%' }} title="Core Sleep (3h 18m)" />
              <div className="sleep-stage-segment sleep-stage-light" style={{ width: '8%' }} title="Awake (36m)" />
            </div>
            <div className="sleep-legend">
              <span className="sleep-legend-item"><span className="sleep-dot" style={{ background: '#6366f1' }} /> Deep (22%)</span>
              <span className="sleep-legend-item"><span className="sleep-dot" style={{ background: '#8b5cf6' }} /> REM (28%)</span>
              <span className="sleep-legend-item"><span className="sleep-dot" style={{ background: '#3b82f6' }} /> Core (42%)</span>
              <span className="sleep-legend-item"><span className="sleep-dot" style={{ background: '#93c5fd' }} /> Awake (8%)</span>
            </div>
          </div>

          {/* 2. Gym Volume & PR Engine (5 Columns) */}
          <div className="landing-card bento-col-5">
            <div className="bento-card-top">
              <div>
                <span className="landing-badge landing-badge-amber" style={{ marginBottom: '8px' }}>
                  Strength & Hypertrophy
                </span>
                <h3 className="bento-title">Gym Volume & PRs</h3>
                <p className="bento-desc">
                  Set-by-set telemetry, aggregate tonnage, PR notifications, and automatic macro/protein pacing.
                </p>
              </div>
              <div className="bento-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Dumbbell size={22} aria-hidden="true" />
              </div>
            </div>

            {/* Total Lifted Stat */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weekly Lifted Volume</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                  28,450 <span style={{ fontSize: '0.9rem', color: 'var(--accent-blue)' }}>kg</span>
                </div>
              </div>
              <div className="landing-badge landing-badge-green" style={{ margin: 0 }}>
                ↑ 14% vs last cycle
              </div>
            </div>

            {/* PRs */}
            <div className="gym-pr-grid">
              <div className="gym-pr-item">
                <div className="gym-pr-name">Bench Press</div>
                <div className="gym-pr-weight">110 kg</div>
                <div className="gym-pr-badge">🏆 New PR</div>
              </div>
              <div className="gym-pr-item">
                <div className="gym-pr-name">Deadlift</div>
                <div className="gym-pr-weight">185 kg</div>
                <div className="gym-pr-badge">🔥 3x5</div>
              </div>
              <div className="gym-pr-item">
                <div className="gym-pr-name">Squat</div>
                <div className="gym-pr-weight">150 kg</div>
                <div className="gym-pr-badge">⚡ Clean</div>
              </div>
            </div>

            {/* Protein Tracker */}
            <div className="macro-progress-wrapper">
              <div className="macro-header">
                <span>Daily Protein Goal</span>
                <strong style={{ color: '#10b981' }}>172g / 180g (95%)</strong>
              </div>
              <div className="macro-bar-track">
                <div className="macro-bar-fill" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>

          {/* 3. Finance & Cashflow Command (5 Columns) */}
          <div className="landing-card bento-col-5">
            <div className="bento-card-top">
              <div>
                <span className="landing-badge landing-badge-green" style={{ marginBottom: '8px' }}>
                  Financial Velocity
                </span>
                <h3 className="bento-title">Finance & Cashflow</h3>
                <p className="bento-desc">
                  Instant net savings rate telemetry, categorized outflow analysis, and zero cloud banking scraping.
                </p>
              </div>
              <div className="bento-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <DollarSign size={22} aria-hidden="true" />
              </div>
            </div>

            {/* Stat Row */}
            <div className="finance-stats-row" style={{ marginBottom: '14px' }}>
              <div className="finance-stat-box">
                <div className="finance-stat-label">Inflow</div>
                <div className="finance-stat-value" style={{ color: '#10b981', fontSize: '1.15rem' }}>+$7.8k</div>
              </div>
              <div className="finance-stat-box">
                <div className="finance-stat-label">Outflow</div>
                <div className="finance-stat-value" style={{ color: '#ef4444', fontSize: '1.15rem' }}>-$2.1k</div>
              </div>
              <div className="finance-stat-box">
                <div className="finance-stat-label">Savings Rate</div>
                <div className="finance-stat-value" style={{ color: 'var(--accent-blue)', fontSize: '1.15rem' }}>72.7%</div>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="expense-category-list">
              <div className="expense-category-item">
                <div className="expense-cat-header">
                  <span>Tech & Cloud Infra</span>
                  <span>$420 (20%)</span>
                </div>
                <div className="expense-cat-bar">
                  <div className="expense-cat-fill" style={{ width: '20%', background: 'var(--accent-blue)' }} />
                </div>
              </div>
              <div className="expense-category-item">
                <div className="expense-cat-header">
                  <span>Organic Nutrition</span>
                  <span>$980 (45%)</span>
                </div>
                <div className="expense-cat-bar">
                  <div className="expense-cat-fill" style={{ width: '45%', background: '#10b981' }} />
                </div>
              </div>
              <div className="expense-category-item">
                <div className="expense-cat-header">
                  <span>Fitness & Recovery</span>
                  <span>$350 (16%)</span>
                </div>
                <div className="expense-cat-bar">
                  <div className="expense-cat-fill" style={{ width: '16%', background: '#f59e0b' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Proactive AI Copilot (7 Columns) */}
          <div className="landing-card bento-col-7">
            <div className="bento-card-top">
              <div>
                <span className="landing-badge" style={{ marginBottom: '8px' }}>
                  Contextual Agent
                </span>
                <h3 className="bento-title">Autonomous AI Copilot</h3>
                <p className="bento-desc">
                  Synthesizes daily telemetry across sleep, finances, workouts, and calendar with natural language execution.
                </p>
              </div>
              <div className="bento-icon-box">
                <Bot size={22} aria-hidden="true" />
              </div>
            </div>

            {/* AI Copilot Terminal Simulation */}
            <div className="ai-copilot-card">
              <div className="ai-message-bubble">
                <div className="ai-message-avatar" aria-hidden="true">
                  <Bot size={16} />
                </div>
                <div className="ai-message-content">
                  <strong style={{ color: 'var(--accent-blue)' }}>Proactive Audit & Schedule Optimization:</strong><br />
                  "Analyzing today's biometrics: 7h 48m sleep (94% recovery). Bench Press PR reached at 110 kg. 172g protein logged. Your monthly savings rate is 72.7%. Recommended: Move 60m pomodoro focus block to 09:30 AM."
                </div>
              </div>

              <div className="ai-quick-actions">
                <span className="ai-action-chip">⚡ Reschedule Leg Day</span>
                <span className="ai-action-chip">📊 Run Weekly Cashflow Audit</span>
                <span className="ai-action-chip">🥩 Record +25g Protein Shake</span>
                <span className="ai-action-chip">💤 Add 20m Midday Nap</span>
              </div>
            </div>
          </div>

          {/* 5. Micro Feature 1: Local SQLite (<10ms) */}
          <div className="landing-card bento-col-4" id="architecture">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className="bento-icon-box" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Database size={18} aria-hidden="true" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Local-First SQLite</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Zero latency (<strong style={{ color: 'var(--text-main)' }}>&lt;10ms</strong>). 100% offline capable with optional encrypted cloud backup.
            </p>
          </div>

          {/* 6. Micro Feature 2: ⌘K Command Palette */}
          <div className="landing-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className="bento-icon-box" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <Keyboard size={18} aria-hidden="true" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>⌘K Command Palette</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Keyboard-first navigation. Log workouts, expenses, or notes in under <strong style={{ color: 'var(--text-main)' }}>2 seconds</strong>.
            </p>
          </div>

          {/* 7. Micro Feature 3: Native & PWA */}
          <div className="landing-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className="bento-icon-box" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Zap size={18} aria-hidden="true" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Android & Multi-Device</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Instant mobile APK & PWA with local notifications and pull-to-refresh sync.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
