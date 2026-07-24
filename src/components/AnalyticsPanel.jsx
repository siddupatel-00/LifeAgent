import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, DollarSign, Activity, Check, Moon as SleepIcon 
} from 'lucide-react';

export default function AnalyticsPanel({ token, showToast, currency = '$' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    let mounted = true;
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics?range=${range}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const result = await res.json();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          showToast?.(err.message, 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchAnalytics();
    
    return () => {
      mounted = false;
    };
  }, [token, range, showToast]);

  const renderFilterButtons = () => {
    const ranges = [
      { label: '7 Days', value: '7d' },
      { label: '14 Days', value: '14d' },
      { label: '30 Days', value: '30d' },
      { label: '90 Days', value: '90d' },
    ];
    
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {ranges.map(r => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: range === r.value ? 'var(--accent-blue)' : 'var(--border-color)',
              background: range === r.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
              color: range === r.value ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Unable to load analytics</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Could not fetch analytics data from server.</p>
        <button 
          onClick={() => setRange(r => r)}
          style={{ padding: '8px 20px', borderRadius: '12px', background: 'var(--accent-blue)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const habits = data.habits || {};
  const finance = data.finance || {};
  const sleep = data.sleep || {};
  const today = data.today || {};
  const notes = data.notes || {};

  return (
    <div>
      {renderFilterButtons()}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <CheckCircle2 size={16} /> OVERALL CONSISTENCY
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>
            {habits.consistency || 0}%
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            {habits.total > 0 ? `${habits.completedToday || 0} of ${habits.total} habits completed today` : 'No habits tracked yet'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '2px solid var(--accent-blue)', boxShadow: '0 0 25px rgba(59, 130, 246, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <DollarSign size={16} /> NET MONEY SAVINGS
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: '-1px', marginBottom: '8px' }}>
            {currency}{finance.netBalance || 0}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            Based on recent transactions
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <SleepIcon size={16} /> SLEEP & RECOVERY
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>
            {sleep.avgHours || 0} <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>h</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            Average sleep
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Performance Overview</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Analysis of your habits and finances over {range === '7d' ? '7 days' : range === '14d' ? '14 days' : range === '30d' ? '30 days' : '90 days'}</p>
        </div>
      </div>

      {/* Habit Completion Bar Chart */}
      <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border-color)', marginBottom: '28px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="var(--accent-blue)" /> Habit Completion
        </h4>
        {data.habits.breakdown && data.habits.breakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.habits.breakdown.map((h, i) => {
              const pct = h.checkedToday ? 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '140px', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.label}</div>
                  <div style={{ flex: 1, height: '28px', background: 'var(--bg-main)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: h.checkedToday ? 'linear-gradient(90deg, #3b82f6, #22c55e)' : 'transparent', borderRadius: '8px', transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                      {h.checkedToday && <Check size={14} color="#fff" />}
                    </div>
                  </div>
                  <div style={{ width: '80px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: h.checkedToday ? '#22c55e' : 'var(--text-muted)' }}>{h.checkedToday ? 'Done' : 'Pending'}</span>
                  </div>
                  <div style={{ width: '70px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-blue)' }}>🔥 {h.streak}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: '12px', padding: '14px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>{data.habits.completedToday}/{data.habits.total}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Completed Today</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{data.habits.consistency}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Consistency</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>{data.habits.bestStreak}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Best Streak</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No habits tracked yet. Add habits in Daily Works to see analytics.</div>
        )}
      </div>

      {/* Financial Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#22c55e" /> Income vs Spending
          </h4>
          {(data.finance.totalEarned > 0 || data.finance.totalSpent > 0) ? (
            <div>
              {(() => {
                const totalEarn = data.finance.totalEarned;
                const totalSpend = data.finance.totalSpent;
                const maxVal = Math.max(totalEarn, totalSpend, 1);
                return (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', height: '180px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#22c55e' }}>{currency}{totalEarn.toFixed(0)}</span>
                      <div style={{ width: '100%', background: 'linear-gradient(180deg, #22c55e, #16a34a)', borderRadius: '10px 10px 4px 4px', height: `${Math.max((totalEarn / maxVal) * 140, 8)}px`, transition: 'height 0.5s ease' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Earned</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ef4444' }}>{currency}{totalSpend.toFixed(0)}</span>
                      <div style={{ width: '100%', background: 'linear-gradient(180deg, #ef4444, #dc2626)', borderRadius: '10px 10px 4px 4px', height: `${Math.max((totalSpend / maxVal) * 140, 8)}px`, transition: 'height 0.5s ease' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Spent</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions yet</div>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-blue)" /> Category Breakdown
          </h4>
          {Object.keys(data.habits.categories || {}).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(data.habits.categories).map(([cat, catData]) => {
                const pct = Math.round((catData.done / catData.total) * 100) || 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cat}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{catData.done}/{catData.total} ({pct}%)</span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--bg-main)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No habits to analyze</div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-blue)' }}>{today.done || 0}/{today.total || 0}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Today Tasks Done</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e' }}>{currency}{(finance.netBalance || 0).toFixed(0)}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Net Balance</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{habits.totalStreaks || 0}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Total Streaks</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6' }}>{notes.count || 0}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Notes & Diary</div>
        </div>
      </div>
    </div>
  );
}
