import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Moon, Clock, Calendar, Activity } from 'lucide-react';

export default function SleepTracker({ token, showToast }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sleep_time: '23:00',
    wake_time: '07:00',
    quality: 'Good',
    notes: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/sleep', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        showToast('Failed to load sleep logs', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const newLog = await res.json();
        setLogs([newLog, ...logs].sort((a, b) => new Date(b.date) - new Date(a.date)));
        setShowModal(false);
        showToast('Sleep Log Added', 'success');
        setFormData({
          ...formData,
          notes: ''
        });
      } else {
        showToast('Failed to add log', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteLog = async (id) => {
    if (!confirm('Delete this sleep log?')) return;
    try {
      const res = await fetch('/api/sleep', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        setLogs(logs.filter(log => log.id !== id));
        showToast('Sleep Log Deleted', 'success');
      } else {
        showToast('Failed to delete log', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  // Stats calculation
  const last7Logs = [...logs].slice(0, 7);
  
  const calculateAverage = () => {
    if (last7Logs.length === 0) return '0h 0m';
    const totalMins = last7Logs.reduce((acc, log) => acc + (log.hours * 60 + log.minutes), 0);
    const avgMins = Math.round(totalMins / last7Logs.length);
    return `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`;
  };

  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    let streak = 0;
    const sortedDates = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Check if streak is active (latest entry must be today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latestDate = new Date(sortedDates[0].date);
    const diffDays = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return 0;

    let expectedTime = latestDate.getTime();

    for (const log of sortedDates) {
      const logTime = new Date(log.date).getTime();
      const durationHours = log.hours + (log.minutes / 60);
      
      if (logTime === expectedTime && durationHours >= 7) {
        streak++;
        expectedTime -= (1000 * 60 * 60 * 24); // move to previous day
      } else if (logTime === expectedTime && durationHours < 7) {
        break; // streak broken by poor sleep
      } else if (logTime > expectedTime) {
        continue; // Multiple entries same day? skip. Should be unique by date typically.
      } else {
        break; // streak broken by missing day
      }
    }
    return streak;
  };

  const getQualityColor = (quality) => {
    switch(quality) {
      case 'Excellent': return '#10b981';
      case 'Good': return '#3b82f6';
      case 'Fair': return '#f59e0b';
      case 'Poor': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  // Last 7 days chart data (filling missing days)
  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find(l => l.date === dateStr);
      data.push({
        date: dateStr,
        hours: log ? log.hours : 0,
        minutes: log ? log.minutes : 0
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading sleep data...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Sleep Tracker</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--accent-blue)', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '12px', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          <Plus size={18} /> Add Log
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Moon size={16} /> <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Avg Sleep (7d)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{calculateAverage()}</div>
        </div>
        
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Activity size={16} /> <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Last Night</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {logs.length > 0 ? `${logs[0].hours}h ${logs[0].minutes}m` : '-'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Activity size={16} /> <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Best Streak</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{calculateStreak()} days</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Calendar size={16} /> <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Total Logs</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{logs.length}</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Last 7 Days</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px' }}>
          {chartData.map(day => {
            const totalHrs = day.hours + day.minutes / 60;
            const heightPct = Math.min((totalHrs / 12) * 100, 100); 
            const color = totalHrs >= 7 ? '#10b981' : totalHrs >= 5 ? '#f59e0b' : totalHrs > 0 ? '#ef4444' : 'var(--border-color)';
            
            return (
              <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                {totalHrs > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {totalHrs.toFixed(1)}h
                  </span>
                )}
                <div style={{
                  width: '100%', background: color, borderRadius: '6px 6px 0 0',
                  height: `${heightPct || 2}%`, minHeight: '4px', transition: 'height 0.3s ease'
                }} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Sleep History</h3>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No sleep logs yet. Add your first log!
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} style={{
              background: 'var(--bg-card)', padding: '20px', borderRadius: '18px',
              border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{new Date(log.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span style={{
                    fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: '500', color: '#fff',
                    background: getQualityColor(log.quality)
                  }}>
                    {log.quality}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} />
                    <span>{log.sleep_time} - {log.wake_time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Moon size={14} />
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{log.hours}h {log.minutes}m</span>
                  </div>
                </div>
                {log.notes && (
                  <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {log.notes}
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleDeleteLog(log.id)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  padding: '8px', borderRadius: '8px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-card)', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px',
            border: '1px solid var(--border-color)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Log Sleep</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', color: 'var(--text-muted)' }}>Date</label>
                <input 
                  type="date" required value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', color: 'var(--text-muted)' }}>Sleep Time</label>
                  <input 
                    type="time" required value={formData.sleep_time}
                    onChange={(e) => setFormData({...formData, sleep_time: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', color: 'var(--text-muted)' }}>Wake Time</label>
                  <input 
                    type="time" required value={formData.wake_time}
                    onChange={(e) => setFormData({...formData, wake_time: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', color: 'var(--text-muted)' }}>Quality</label>
                <select 
                  value={formData.quality} onChange={(e) => setFormData({...formData, quality: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', appearance: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', color: 'var(--text-muted)' }}>Notes (Optional)</label>
                <textarea 
                  value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Any dreams, disruptions?" rows="3"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button type="submit" style={{
                background: 'var(--accent-blue)', color: 'white', border: 'none',
                padding: '16px', borderRadius: '12px', fontWeight: '600',
                fontSize: '1rem', cursor: 'pointer', marginTop: '8px', width: '100%'
              }}>
                Save Sleep Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
