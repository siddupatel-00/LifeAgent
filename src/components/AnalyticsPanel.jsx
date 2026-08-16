import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, DollarSign, Activity, Check, Moon as SleepIcon, RefreshCw, Filter 
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import { todayKey } from '../utils/date';
import { getApiUrl } from '../utils/apiUrl';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
          <h3>Analytics Panel Crashed</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Module-level in-memory cache for instant SWR tab loading
const analyticsCache = new Map();
let metricsLogsCache = null;

export default function AnalyticsPanel(props) {
  return (
    <ErrorBoundary>
      <AnalyticsPanelInner {...props} />
    </ErrorBoundary>
  );
}

function AnalyticsPanelInner({ token, showToast, currency = '$', timeRange = '7d', userProfile }) {
  const [range, setRange] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const currentKey = `${range}_${customStart}_${customEnd}`;
  const [data, setData] = useState(() => analyticsCache.get('7d__') || analyticsCache.get(currentKey) || null);
  const [loading, setLoading] = useState(!analyticsCache.get('7d__') && !analyticsCache.get(currentKey));
  const [retryCount, setRetryCount] = useState(0);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'logs'
  const [metrics, setMetrics] = useState(() => metricsLogsCache || []);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

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
    const controller = new AbortController();
    
    // If custom range selected without both dates populated, wait until set
    if (range === 'custom' && (!customStart || !customEnd)) {
      return;
    }

    const key = `${range}_${customStart}_${customEnd}`;
    const cachedData = analyticsCache.get(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchAnalytics = async () => {
      try {
        let query = getApiUrl(`/api/analytics?range=${range}&client_date=${todayKey(userProfile?.timezone)}`);
        if (range === 'custom' && customStart && customEnd) {
          query += `&start_date=${customStart}&end_date=${customEnd}`;
        }
        const res = await fetch(query, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        if (res.ok) {
          const result = await res.json();
          if (mounted) {
            analyticsCache.set(key, result);
            setData(result);
          }
        } else {
          if (mounted && !cachedData) {
            setData({
              range,
              habits: { total: 0, completedToday: 0, consistency: 0, totalStreaks: 0, bestStreak: 0, breakdown: [], categories: {} },
              finance: { totalEarned: 0, totalSpent: 0, netBalance: 0 },
              today: { total: 0, done: 0 },
              notes: { count: 0 },
              sleep: { avgHours: 0 },
              workouts: { thisWeek: 0, totalMinutes: 0, totalCalories: 0 }
            });
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Analytics fetch error:', err);
        if (mounted && !cachedData) {
          setData({
            range,
            habits: { total: 0, completedToday: 0, consistency: 0, totalStreaks: 0, bestStreak: 0, breakdown: [], categories: {} },
            finance: { totalEarned: 0, totalSpent: 0, netBalance: 0 },
            today: { total: 0, done: 0 },
            notes: { count: 0 },
            sleep: { avgHours: 0 },
            workouts: { thisWeek: 0, totalMinutes: 0, totalCalories: 0 }
          });
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
      controller.abort();
    };
  }, [token, range, customStart, customEnd, retryCount, userProfile?.timezone]);

  useEffect(() => {
    if (activeTab === 'logs' && token) {
      if (metricsLogsCache) {
        setMetrics(metricsLogsCache);
      } else {
        setLoadingMetrics(true);
      }
      const controller = new AbortController();
      fetch(getApiUrl('/api/analytics?type=logs'), {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          metricsLogsCache = data;
          setMetrics(data);
        }
        setLoadingMetrics(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
        setLoadingMetrics(false);
      });

      return () => controller.abort();
    }
  }, [activeTab, token]);


  const renderFilterButtons = () => {
    const ranges = [
      { label: '7 Days', value: '7d' },
      { label: '14 Days', value: '14d' },
      { label: '30 Days', value: '30d' },
      { label: '90 Days', value: '90d' },
      { label: 'Custom Range', value: 'custom' }
    ];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={14} /> Timeframe:
          </span>
          <CustomSelect
            className="timeframe-dropdown"
            value={range}
            onChange={(e) => handleRangeChange(e.target.value)}
            options={ranges}
            style={{
              width: '170px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 14px',
              color: 'var(--text-primary)',
              font: "500 0.8rem 'DM Mono', monospace"
            }}
          />
        </div>

        {range === 'custom' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', width: 'fit-content', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ font: "500 0.7rem 'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>From:</span>
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', font: "500 0.82rem 'DM Mono', monospace" }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ font: "500 0.7rem 'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>To:</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', font: "500 0.82rem 'DM Mono', monospace" }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: 'var(--text-muted)', font: "500 0.95rem 'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={18} className="spin" /> Loading Analytics Hub...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: "'DM Sans', sans-serif" }}>
        <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Unable to load analytics</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>Could not fetch performance data from server.</p>
        <button 
          onClick={() => setRetryCount(c => c + 1)}
          className="button button-primary"
          style={{ padding: '8px 20px', borderRadius: '6px', font: "600 0.82rem 'DM Sans', sans-serif", background: 'var(--ink)', color: '#d8f277', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} /> Retry Connection
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
    <div className="animate-entrance" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sub-navigation tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ 
            background: 'none', border: 'none', padding: '6px 14px', cursor: 'pointer',
            fontSize: '0.92rem', fontWeight: activeTab === 'overview' ? 700 : 500,
            color: activeTab === 'overview' ? '#d8f277' : 'var(--text-muted)',
            borderBottom: activeTab === 'overview' ? '2px solid #d8f277' : '2px solid transparent',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s'
          }}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ 
            background: 'none', border: 'none', padding: '6px 14px', cursor: 'pointer',
            fontSize: '0.92rem', fontWeight: activeTab === 'logs' ? 700 : 500,
            color: activeTab === 'logs' ? '#d8f277' : 'var(--text-muted)',
            borderBottom: activeTab === 'logs' ? '2px solid #d8f277' : '2px solid transparent',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s'
          }}
        >
          History & Logs
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {renderFilterButtons()}
      
      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#d8f277' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', font: "500 0.68rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            <CheckCircle2 size={15} color="#d8f277" /> OVERALL CONSISTENCY
          </div>
          <div style={{ font: "700 2.2rem 'DM Mono', monospace", letterSpacing: '-0.03em', marginBottom: '6px', color: 'var(--text-main)' }}>
            {habits.consistency || 0}%
          </div>
          <div style={{ font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
            {habits.total > 0 ? <>{habits.completedToday || 0} of {habits.total || 0} done today &middot; {rangeLabel}</> : 'No habits tracked yet'}
          </div>
        </div>

        <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid rgba(216, 242, 119, 0.3)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#d8f277' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', font: "500 0.68rem 'DM Mono', monospace", color: '#d8f277', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            <DollarSign size={15} /> NET MONEY SAVINGS
          </div>
          <div style={{ font: "700 2.2rem 'DM Mono', monospace", color: '#d8f277', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {currency}{(finance.netBalance || 0).toFixed(0)}
          </div>
          <div style={{ font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
            Transactions in {rangeLabel}
          </div>
        </div>

        <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#8b5cf6' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', font: "500 0.68rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            <SleepIcon size={15} color="#8b5cf6" /> SLEEP & RECOVERY
          </div>
          <div style={{ font: "700 2.2rem 'DM Mono', monospace", letterSpacing: '-0.03em', marginBottom: '6px', color: 'var(--text-main)' }}>
            {sleep.avgHours || 0} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <div style={{ font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
            Average sleep in {rangeLabel}
          </div>
        </div>
      </div>

      {/* Performance Overview Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.35rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Performance Breakdown</h3>
          <p style={{ font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)', marginTop: '4px' }}>
            Detailed breakdown ({rangeLabel})
          </p>
        </div>
      </div>

      {/* Habit Completion Bar Chart */}
      <div style={{ background: 'var(--bg-card)', padding: '22px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#d8f277" /> Habit Completion Breakdown
        </h4>
        {habits.breakdown && habits.breakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {habits.breakdown.map((h, i) => {
              const pct = h.completionRate ?? (h.checkedToday ? 100 : 0);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '130px', fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{h.label}</div>
                  <div style={{ flex: 1, height: '24px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct > 0 ? `linear-gradient(90deg, #d8f277, ${pct >= 80 ? '#a7c878' : pct >= 50 ? '#ef6f3e' : '#dc2626'})` : 'transparent', borderRadius: '3px', transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px' }}>
                      {pct >= 80 && <Check size={12} color="#11110f" />}
                    </div>
                  </div>
                  <div style={{ width: '65px', textAlign: 'right' }}>
                    <span style={{ font: "700 0.8rem 'DM Mono', monospace", color: pct >= 80 ? '#d8f277' : pct >= 50 ? '#ef6f3e' : 'var(--text-muted)' }}>{pct}%</span>
                  </div>
                  <div style={{ width: '65px', textAlign: 'right' }}>
                    <span style={{ font: "600 0.75rem 'DM Mono', monospace", color: '#ef6f3e' }}>🔥 {h.streak}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ font: "700 1.5rem 'DM Mono', monospace", color: '#d8f277' }}>{habits.completedToday || 0}/{habits.total || 0}</div>
                <div style={{ font: "500 0.66rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>Completed Today</div>
              </div>
              <div>
                <div style={{ font: "700 1.5rem 'DM Mono', monospace", color: 'var(--text-main)' }}>{habits.consistency || 0}%</div>
                <div style={{ font: "500 0.66rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>Consistency</div>
              </div>
              <div>
                <div style={{ font: "700 1.5rem 'DM Mono', monospace", color: '#ef6f3e' }}>{habits.bestStreak || 0}</div>
                <div style={{ font: "500 0.66rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>Best Streak</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No habits tracked yet. Add habits in Daily Works to see analytics.</div>
        )}
      </div>

      {/* Financial Overview & Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '22px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color="#d8f277" /> Income vs Spending
          </h4>
          {(finance.totalEarned > 0 || finance.totalSpent > 0) ? (
            <div>
              {(() => {
                const totalEarn = finance.totalEarned || 0;
                const totalSpend = finance.totalSpent || 0;
                const maxVal = Math.max(totalEarn, totalSpend, 1);
                return (
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', height: '160px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ font: "700 1.15rem 'DM Mono', monospace", color: '#d8f277' }}>{currency}{totalEarn.toFixed(0)}</span>
                      <div style={{ width: '100%', background: '#d8f277', borderRadius: '4px 4px 0 0', height: `${Math.max((totalEarn / maxVal) * 120, 8)}px`, transition: 'height 0.5s ease' }} />
                      <span style={{ font: "500 0.7rem 'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>Earned</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ font: "700 1.15rem 'DM Mono', monospace", color: '#ef6f3e' }}>{currency}{totalSpend.toFixed(0)}</span>
                      <div style={{ width: '100%', background: '#ef6f3e', borderRadius: '4px 4px 0 0', height: `${Math.max((totalSpend / maxVal) * 120, 8)}px`, transition: 'height 0.5s ease' }} />
                      <span style={{ font: "500 0.7rem 'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spent</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No transactions recorded yet</div>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '22px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#d8f277" /> Category Breakdown
          </h4>
          {Object.keys(habits.categories || {}).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(habits.categories).map(([cat, catData]) => {
                const pct = catData.totalDays > 0 ? Math.round((catData.checkedDays / catData.totalDays) * 100) : (catData.total > 0 ? Math.round((catData.done / catData.total) * 100) : 0);
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cat}</span>
                      <span style={{ font: "600 0.75rem 'DM Mono', monospace", color: '#d8f277' }}>{catData.checkedDays ?? catData.done}/{catData.totalDays ?? catData.total} ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#d8f277', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No habits to analyze</div>
          )}
        </div>
      </div>

      {/* Summary KPI Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ font: "700 1.55rem 'DM Mono', monospace", color: '#d8f277' }}>{today.done || 0}/{today.total || 0}</div>
          <div style={{ font: "500 0.66rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>Today Tasks Done</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ font: "700 1.55rem 'DM Mono', monospace", color: (finance.netBalance || 0) >= 0 ? '#d8f277' : '#ef6f3e' }}>{currency}{(finance.netBalance || 0).toFixed(0)}</div>
          <div style={{ font: "500 0.66rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>Net Balance</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ font: "700 1.55rem 'DM Mono', monospace", color: '#ef6f3e' }}>{habits.totalStreaks || 0}</div>
          <div style={{ font: "500 0.66rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>Total Streaks</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ font: "700 1.55rem 'DM Mono', monospace", color: '#8b5cf6' }}>{notes.count || 0}</div>
          <div style={{ font: "500 0.66rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>Notes & Diary</div>
        </div>
      </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loadingMetrics ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', font: "500 0.85rem 'DM Mono', monospace" }}>Loading logs...</div>
          ) : metrics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No logs recorded yet.</div>
          ) : (
            metrics.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{m.metric_name}</span>
                    <span style={{ font: "500 0.66rem 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em', padding: '2px 7px', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#d8f277' }}>{m.metric_type}</span>
                  </div>
                  <div style={{ font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
                    {m.date}
                  </div>
                </div>
                <div style={{ font: "700 1.15rem 'DM Mono', monospace", color: '#d8f277' }}>
                  {m.metric_value}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
