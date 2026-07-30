import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, Bot, DollarSign, CheckCircle2, Dumbbell, 
  Moon, Calendar, FileText, BarChart3, Droplet, Shield, Zap, Lock, 
  ChevronRight, Activity, Clock, Flame, Award, Heart, RefreshCw, Check
} from 'lucide-react';

export default function LandingPage({ onNavigate, setAuthMode }) {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('ai');
  const [aiDemoInput, setAiDemoInput] = useState('');
  const [aiDemoMessage, setAiDemoMessage] = useState(null);
  const [isSimulatingAi, setIsSimulatingAi] = useState(false);

  const showcaseTabs = [
    { id: 'ai', label: 'AI Core', icon: Bot, badge: 'Unified Intelligence' },
    { id: 'habits', label: 'Habits & Routine', icon: CheckCircle2, badge: '7-Day Matrix' },
    { id: 'money', label: 'Finances', icon: DollarSign, badge: 'Smart Tracking' },
    { id: 'gym', label: 'Fitness & Protein', icon: Dumbbell, badge: 'Workout Splits' },
    { id: 'sleep', label: 'Sleep & Energy', icon: Moon, badge: 'Recovery' },
    { id: 'notes', label: 'Notes & Diary', icon: FileText, badge: 'AI Notes' },
    { id: 'calendar', label: 'Schedule', icon: Calendar, badge: 'Universal' },
  ];

  const handleRunAiDemo = (promptText) => {
    setAiDemoInput(promptText);
    setIsSimulatingAi(true);
    setAiDemoMessage(null);
    setTimeout(() => {
      if (promptText.includes('sleep') || promptText.includes('workout')) {
        setAiDemoMessage("Based on your logs: On days you hit 120g protein and sleep > 7.5 hrs, your workout performance increases by 24%. Your average bedtime on gym days is 11:15 PM.");
      } else if (promptText.includes('spending') || promptText.includes('budget')) {
        setAiDemoMessage("This month you've spent $420 ($180 Food, $140 Subscriptions, $100 Gym). You are $80 below your monthly budget target. Great job!");
      } else {
        setAiDemoMessage("You have completed 18/20 daily habits this week (90% streak)! Today's focus: Upper Body Push & 3.0L Water.");
      }
      setIsSimulatingAi(false);
    }, 800);
  };

  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Segoe UI, Roboto, sans-serif' }}>
      
      {/* TOP NAVIGATION BAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(9, 13, 22, 0.85)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo & Version Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onNavigate('landing', '/')}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px', color: '#ffffff' }}>LifeAgent</span>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)', fontWeight: 600 }}>
              v2.0 OS
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '28px', alignItems: 'center' }} className="desktop-only">
            <a href="#showcase" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Modules</a>
            <a href="#ai-engine" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>AI Architecture</a>
            <a href="#security" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Privacy</a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => { setAuthMode('login'); onNavigate('auth', '/auth'); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600, padding: '8px 16px', cursor: 'pointer' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); onNavigate('auth', '/auth'); }}
              className="blue-btn"
              style={{ padding: '9px 20px', fontSize: '0.9rem', borderRadius: '10px' }}
            >
              Get Started <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Linear / Raycast Minimal Aesthetic) */}
      <section style={{ padding: '80px 20px 40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Release Pill Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '28px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>The Personal AI Operating System</span>
        </div>

        {/* Hero Main Headline */}
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.4rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '24px', color: '#ffffff' }}>
          One AI. <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Whole Life Connected.</span>
        </h1>

        {/* Hero Subtitle */}
        <p style={{ maxWidth: '760px', margin: '0 auto 36px', fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 400 }}>
          Stop juggling 7 different apps. Track habits, finances, workouts, sleep, notes, and schedules in one unified workspace — powered by a personal AI that understands how everything connects.
        </p>

        {/* Main CTA Buttons */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <button 
            className="blue-btn" 
            onClick={() => { setAuthMode('signup'); onNavigate('auth', '/auth'); }}
            style={{ fontSize: '1.05rem', padding: '15px 38px', borderRadius: '14px', boxShadow: '0 12px 30px rgba(59, 130, 246, 0.4)' }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>
          <a 
            href="#showcase" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 28px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Explore Modules ↓
          </a>
        </div>
      </section>

      {/* REAL PRODUCT SHOWCASE SECTION (Raycast App Command Workspace) */}
      <section id="showcase" style={{ maxWidth: '1150px', margin: '0 auto 100px', padding: '0 20px' }}>
        <div className="glass-card" style={{ borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.12)', background: 'var(--bg-card)' }}>
          
          {/* Top Command Bar Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.3)', overflowX: 'auto', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {showcaseTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeShowcaseTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveShowcaseTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      background: isActive ? 'var(--accent-blue)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              ● REAL LIVE MODULES
            </span>
          </div>

          {/* Interactive Showcase View Box */}
          <div style={{ padding: '32px', minHeight: '440px', background: 'var(--bg-main)' }}>
            
            {/* 1. AI CORE TAB */}
            {activeShowcaseTab === 'ai' && (
              <div className="animate-entrance">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
                      <Bot size={14} /> Personal Intelligence
                    </div>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>Your AI Agent knows your entire context.</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '20px' }}>
                      Ask anything. LifeAgent analyzes your cross-domain data to give customized insights about habits, spending, workout progress, and sleep.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {['"How did I sleep after workout days?"', '"Summarize my spending this month"', '"What habit should I focus on today?"'].map((prompt, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleRunAiDemo(prompt)}
                          style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <span>{prompt}</span>
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mock AI Box */}
                  <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={16} color="#fff" />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>LifeAgent AI Assistant</span>
                    </div>

                    <div style={{ fontSize: '0.88rem', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <strong>User:</strong> {aiDemoInput || 'How did I sleep after workout days?'}
                    </div>

                    <div style={{ fontSize: '0.88rem', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#dbeafe', lineHeight: 1.5 }}>
                      {isSimulatingAi ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><RefreshCw size={14} className="animate-spin" /> Analyzing cross-module metrics...</span>
                      ) : (
                        aiDemoMessage || "Based on your logs: On days you hit 120g protein and sleep > 7.5 hrs, your workout performance increases by 24%. Your average bedtime on gym days is 11:15 PM."
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. HABITS & 7-DAY MATRIX TAB */}
            {activeShowcaseTab === 'habits' && (
              <div className="animate-entrance" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>7-Day Single Line Habit Matrix</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Track habits with non-wrapping horizontal weekly progress boxes</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>
                    🔥 14-Day Streak
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { name: 'Morning Workout & Cardio', category: 'Fitness', streak: 12, days: [true, true, true, true, true, true, true] },
                    { name: 'Read 20 Pages', category: 'Mindset', streak: 8, days: [true, true, false, true, true, true, true] },
                    { name: 'Code 2 Hours', category: 'Work', streak: 15, days: [true, true, true, true, true, false, true] },
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.category} • 🔥 {item.streak} days</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dIdx) => (
                          <div key={dIdx} style={{ width: '28px', height: '28px', borderRadius: '8px', background: item.days[dIdx] ? '#22c55e' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: item.days[dIdx] ? '#fff' : 'var(--text-muted)' }}>
                            {item.days[dIdx] ? <Check size={14} /> : day}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. FINANCES TAB */}
            {activeShowcaseTab === 'money' && (
              <div className="animate-entrance" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Spent (This Month)</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', margin: '6px 0 12px' }}>$1,240.50</div>
                  <div style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>↓ 14% vs last month</div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recent Transactions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>☕ Coffee & Snacks</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>-$8.50</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>🏋️ Gym Membership</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>-$45.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>💼 Freelance Payment</span>
                      <span style={{ fontWeight: 700, color: '#22c55e' }}>+$650.00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FITNESS & PROTEIN TAB */}
            {activeShowcaseTab === 'gym' && (
              <div className="animate-entrance" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Workout Split</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '6px', color: '#ffffff' }}>Push / Pull / Legs</div>
                  <div style={{ fontSize: '0.82rem', color: '#60a5fa', marginTop: '8px' }}>Today: Upper Body Push (Bench & Incline Press)</div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Daily Protein Counter</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', margin: '4px 0 10px' }}>115g <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 140g target</span></div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'none', fontWeight: 700, fontSize: '0.8rem' }}>+25g Whey</button>
                    <button style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'none', fontWeight: 700, fontSize: '0.8rem' }}>+30g Chicken</button>
                  </div>
                </div>
              </div>
            )}

            {/* OTHER TABS FALLBACK */}
            {['sleep', 'notes', 'calendar'].includes(activeShowcaseTab) && (
              <div className="animate-entrance" style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Real-Time Data Workspace</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                  All modules sync automatically with your AI agent context in real-time.
                </p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* CONNECTED ARCHITECTURE DIAGRAM SECTION */}
      <section id="ai-engine" style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', fontSize: '0.82rem', fontWeight: 700, marginBottom: '16px' }}>
          <Zap size={14} /> The Connected Engine
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>
          Why silod apps fail — and why LifeAgent wins.
        </h2>
        <p style={{ maxWidth: '700px', margin: '0 auto 50px', color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Standard habit trackers don't know you slept poorly. Budget apps don't know you missed your gym sessions. LifeAgent connects every metric through one AI brain.
        </p>

        {/* Dynamic Connected Node Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[
            { title: 'Habits + Sleep Sync', desc: 'If you sleep < 6 hrs, LifeAgent adjusts your daily habit targets automatically.', icon: Moon, color: '#8b5cf6' },
            { title: 'Fitness + Money Balance', desc: 'Correlate gym membership & nutrition spending with actual workout gains.', icon: DollarSign, color: '#10b981' },
            { title: 'Notes + AI Memory', desc: 'Write daily notes — your AI reads them to guide your weekly goals.', icon: FileText, color: '#3b82f6' }
          ].map((feature, idx) => (
            <div key={idx} style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${feature.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <feature.icon size={22} color={feature.color} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECURITY & PRIVACY SECTION */}
      <section id="security" style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(9, 13, 22, 0.9) 100%)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '40px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Shield size={22} color="#22c55e" />
              <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>Your Data Belongs to You.</span>
            </div>
            <p style={{ color: 'var(--text-muted)', maxWidth: '560px', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Local-first state architecture with encrypted cloud sync. We never sell your personal metrics or train public models on your data.
            </p>
          </div>
          <button 
            onClick={() => { setAuthMode('signup'); onNavigate('auth', '/auth'); }}
            className="blue-btn"
            style={{ padding: '12px 28px', fontSize: '0.95rem' }}
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>© {new Date().getFullYear()} LifeAgent OS. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#showcase" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Modules</a>
            <a href="#security" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
            <a href="#ai-engine" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>AI Engine</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
