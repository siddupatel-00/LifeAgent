import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, DollarSign, Activity, Check, Moon as SleepIcon, RefreshCw 
} from 'lucide-react';
import { todayKey } from '../utils/date';

export default function AnalyticsPanel({ token, showToast, currency = '$', timeRange = '7d', userProfile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    if (newRange === 'custom' && (!customStart || !customEnd)) {
      const today = todayKey(userProfile?.timezone);
      const [y, m, d] = today.split('-').map(Number);
      const startDateObj = new Date(y, m - 1, d);
      startDateObj.setDate(startDateObj.getDate() - 6);
      const sYear = startDateObj.getFullYear();
      const sMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
      const sDay = String(startDateObj.getDate()).padStart(2, '0');
      setCustomEnd(today);
      setCustomStart(`${sYear}-${sMonth}-${sDay}`);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        let query = `/api/analytics?range=${range}&client_date=${todayKey(userProfile?.timezone)}`;
        if (range === 'custom' && customStart && customEnd) {
          query += `&start_date=${customStart}&end_date=${customEnd}`;
        }
        const res = await fetch(query, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const result = await res.json();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          showToast?.(err.message || 'Analytics fetch error', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    if (token) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
    
    return () => {
      mounted = false;
    };
  }, [token, range, customStart, customEnd, retryCount, userProfile?.timezone]);

  const renderFilterButtons = () => {
    const ranges = [
      { label: '7 Days', value: '7d' },
      { label: '14 Days', value: '14d' },
      { label: '30 Days', value: '30d' },
      { label: '90 Days', value: '90d' },
      { label: 'Custom Range', value: 'custom' }
    ];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => handleRangeChange(r.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: range === r.value ? 'var(--accent-blue)' : 'var(--border-color)',
                background: range === r.value ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
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

        {range === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--border-color)', width: 'fit-content', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>From:</span>
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>To:</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={20} className="spin" /> Loading Analytics Hub...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Unable to load analytics</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Could not fetch performance data from server.</p>
        <button 
          onClick={() => setRetryCount(c => c + 1)}
          className="blue-btn"
          style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  const habits = data.habits || {};
  const finance = data.finance || {};
  const sleep = data.sleep || {};
  const today = data.today || {};
  const notes = data.notes || {};

  const rangeLabel = data.startDate && data.endDate
    ? `${data.startDate} to ${data.endDate}`
    : range === '7d' ? 'past 7 days'
    : range === '14d' ? 'past 14 days'
    : range === '30d' ? 'past 30 days'
    : range === '90d' ? 'past 90 days'
    : 'selected range';

  return (
    <div className="animate-entrance">
      {renderFilterButtons()}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <CheckCircle2 size={16} color="var(--accent-blue)" /> OVERALL CONSISTENCY
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
            {currency}{(finance.netBalance || 0).toFixed(0)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            Based on transactions in {rangeLabel}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <SleepIcon size={16} color="#8b5cf6" /> SLEEP & RECOVERY
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>
            {sleep.avgHours || 0} <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>hrs</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            Average sleep duration in {rangeLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Performance Overview</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Detailed breakdown ({rangeLabel})
          </p>
        </div>
      </div>

      {/* Habit Completion Bar Chart */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="var(--accent-blue)" /> Habit Completion Breakdown
        </h4>
        {habits.breakdown && habits.breakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {habits.breakdown.map((h, i) => {
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
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>{habits.completedToday || 0}/{habits.total || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Completed Today</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{habits.consistency || 0}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Consistency</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>{habits.bestStreak || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Best Streak</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No habits tracked yet. Add habits in Daily Works to see analytics.</div>
        )}
      </div>

      {/* Financial Overview & Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#22c55e" /> Income vs Spending
          </h4>
          {(finance.totalEarned > 0 || finance.totalSpent > 0) ? (
            <div>
              {(() => {
                const totalEarn = finance.totalEarned || 0;
                const totalSpend = finance.totalSpent || 0;
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
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions recorded yet</div>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-blue)" /> Category Breakdown
          </h4>
          {Object.keys(habits.categories || {}).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(habits.categories).map(([cat, catData]) => {
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

      {/* Summary KPI Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>{today.done || 0}/{today.total || 0}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Today Tasks Done</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22c55e' }}>{currency}{(finance.netBalance || 0).toFixed(0)}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Net Balance</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>{habits.totalStreaks || 0}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Total Streaks</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8b5cf6' }}>{notes.count || 0}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>Notes & Diary</div>
        </div>
      </div>
    </div>
  );
}
