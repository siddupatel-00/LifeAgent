import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Edit2, Moon, Clock, Calendar, Activity, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { todayKey } from '../utils/date';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import CustomSelect from './CustomSelect';

export default function SleepTracker({ token, showToast, userProfile, todayStat }) {
  const [logs, setLogs] = useState(() => {
    try {
      const cached = localStorage.getItem('cache_sleep_logs');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !localStorage.getItem('cache_sleep_logs');
    } catch (e) {
      return true;
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [formData, setFormData] = useState({
    date: todayKey(userProfile?.timezone),
    hours: 7,
    minutes: 30,
    sleep_time: '23:00',
    wake_time: '06:30',
    quality: 'Good',
    notes: ''
  });
  
  // Date range filter mode: 'today' | '7d' | 'this_month' | 'past_month' | 'custom'
  const [rangeMode, setRangeMode] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Chart type: 'bar' | 'line'
  const [chartType, setChartType] = useState('bar');

  const handleOpenAddModal = () => {
    setEditingLogId(null);
    setFormData({
      date: todayKey(userProfile?.timezone),
      hours: 7,
      minutes: 30,
      sleep_time: '23:00',
      wake_time: '06:30',
      quality: 'Good',
      notes: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLogId(null);
  };

  const handleEditLog = (log) => {
    setFormData({
      date: log.date || todayKey(userProfile?.timezone),
      hours: log.hours !== undefined && log.hours !== null ? log.hours : 7,
      minutes: log.minutes !== undefined && log.minutes !== null ? log.minutes : 30,
      sleep_time: log.sleep_time || '23:00',
      wake_time: log.wake_time || '06:30',
      quality: log.quality || 'Good',
      notes: log.notes || ''
    });
    setEditingLogId(log.id);
    setShowModal(true);
  };

  const calcSleepStats = (bedTime, wakeTime) => {
    if (!bedTime || !wakeTime) return { hours: 7, minutes: 30, quality: 'Good' };
    const [sH, sM] = bedTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    
    let start = sH * 60 + sM;
    let end = wH * 60 + wM;
    if (end <= start) end += 24 * 60; // Overnight
    
    const diff = end - start;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    const totalHrs = hours + (minutes / 60);
    let quality = 'Good';
    if (totalHrs >= 8) quality = 'Excellent';
    else if (totalHrs >= 7) quality = 'Good';
    else if (totalHrs >= 5.5) quality = 'Fair';
    else quality = 'Poor';
    
    return { hours, minutes, quality };
  };

  const handleTimeChange = (field, val) => {
    const sleepTime = field === 'sleep_time' ? val : formData.sleep_time;
    const wakeTime = field === 'wake_time' ? val : formData.wake_time;
    const { hours, minutes, quality } = calcSleepStats(sleepTime, wakeTime);
    setFormData(prev => ({
      ...prev,
      [field]: val,
      hours,
      minutes,
      quality
    }));
  };

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
        try { localStorage.setItem('cache_sleep_logs', JSON.stringify(data)); } catch (e) {}
      }
    } catch (error) {
      // quiet background error handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        hours: Number(formData.hours),
        minutes: Number(formData.minutes)
      };

      if (editingLogId) {
        payload.id = editingLogId;
        const res = await fetch('/api/sleep', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          setLogs(prev => prev.map(l => l.id === editingLogId ? { ...l, ...payload } : l).sort((a, b) => new Date(b.date) - new Date(a.date)));
          setShowModal(false);
          setEditingLogId(null);
          showToast?.('Sleep Log Updated', 'success');
          setFormData({
            date: todayKey(userProfile?.timezone),
            hours: 7,
            minutes: 30,
            sleep_time: '23:00',
            wake_time: '06:30',
            quality: 'Good',
            notes: ''
          });
        } else {
          showToast?.('Failed to update log', 'error');
        }
      } else {
        const res = await fetch('/api/sleep', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const newLog = await res.json();
          setLogs(prev => [newLog, ...prev.filter(l => l.id !== newLog.id)].sort((a, b) => new Date(b.date) - new Date(a.date)));
          setShowModal(false);
          setEditingLogId(null);
          showToast?.('Sleep Log Added', 'success');
          setFormData({
            date: todayKey(userProfile?.timezone),
            hours: 7,
            minutes: 30,
            sleep_time: '23:00',
            wake_time: '06:30',
            quality: 'Good',
            notes: ''
          });
        } else {
          showToast?.('Failed to add log', 'error');
        }
      }
    } catch (error) {
      showToast?.('Network error', 'error');
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const confirmDeleteLog = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
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
        setLogs(prev => prev.filter(log => log.id !== id));
        showToast?.('Sleep log deleted', 'info');
      } else {
        showToast?.('Failed to delete log', 'error');
      }
    } catch (error) {
      showToast?.('Network error', 'error');
    }
  };

  const getQualityColor = (quality) => {
    switch(quality) {
      case 'Excellent': return '#10b981';
      case 'Good': return 'var(--accent-blue)';
      case 'Fair': return '#f59e0b';
      case 'Poor': return '#ef4444';
      default: return 'var(--accent-blue)';
    }
  };

  // Compute graph data & metrics according to selected date range filter
  const getFilteredChartData = () => {
    const today = new Date();
    let startDate, endDate;

    if (rangeMode === 'today') {
      const todayStr = todayKey(userProfile?.timezone);
      const log = logs.find(l => l.date === todayStr);
      return [{
        date: todayStr,
        hours: log ? (log.hours || 0) : 0,
        minutes: log ? (log.minutes || 0) : 0,
        quality: log ? log.quality : null,
        log: log || null
      }];
    } else if (rangeMode === '7d') {
      endDate = new Date(today);
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    } else if (rangeMode === 'this_month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (rangeMode === 'past_month') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (rangeMode === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      endDate = new Date(today);
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    }

    const data = [];
    const curr = new Date(startDate);
    
    // Safety cap max 90 days to prevent rendering overflow
    let daysCount = 0;
    while (curr <= endDate && daysCount < 90) {
      const dateStr = curr.toISOString().split('T')[0];
      const log = logs.find(l => l.date === dateStr);
      data.push({
        date: dateStr,
        hours: log ? (log.hours || 0) : 0,
        minutes: log ? (log.minutes || 0) : 0,
        quality: log ? log.quality : null,
        log: log || null
      });
      curr.setDate(curr.getDate() + 1);
      daysCount++;
    }

    return data;
  };

  const chartData = getFilteredChartData();

  // Summary Metrics calculated from active range
  const validLogsInRange = chartData.filter(d => d.hours > 0 || d.minutes > 0);
  
  const calculateAvgHours = () => {
    if (validLogsInRange.length === 0) return '0h 0m';
    const totalMins = validLogsInRange.reduce((sum, d) => sum + (d.hours * 60 + d.minutes), 0);
    const avgMins = Math.round(totalMins / validLogsInRange.length);
    return `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`;
  };

  const calculateTotalSlept = () => {
    const totalMins = validLogsInRange.reduce((sum, d) => sum + (d.hours * 60 + d.minutes), 0);
    return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
  };

  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    let streak = 0;
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date();
    today.setHours(0,0,0,0);
    const latestDate = new Date(sorted[0].date);
    const diffDays = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return 0;

    let expectedTime = latestDate.getTime();
    for (const log of sorted) {
      const logTime = new Date(log.date).getTime();
      const totalHrs = log.hours + (log.minutes / 60);
      if (logTime === expectedTime && totalHrs >= 7) {
        streak++;
        expectedTime -= (1000 * 60 * 60 * 24);
      } else if (logTime === expectedTime && totalHrs < 7) {
        break;
      } else if (logTime > expectedTime) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sleep data...</div>;

  return (
    <div className="animate-entrance" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Moon size={22} color="var(--accent-blue)" /> Sleep & Recovery Tracking
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Log sleep duration (hours & minutes) and view past trends.
          </p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="blue-btn"
          style={{ padding: '10px 20px', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Log Sleep Entry
        </button>
      </div>

      {/* RANGE FILTER & METRICS BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Filter size={14} /> Time Range:
          </span>

          <CustomSelect
            className="timeframe-dropdown"
            value={rangeMode}
            onChange={(e) => setRangeMode(e.target.value)}
            options={[
              { value: 'today', label: 'Today' },
              { value: '7d', label: 'Past 7 Days' },
              { value: 'this_month', label: 'This Month' },
              { value: 'past_month', label: 'Past Month' },
              { value: 'custom', label: 'Custom Range' }
            ]}
            style={{ 
              width: '160px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '30px', 
              padding: '6px 14px', 
              color: 'var(--text-primary)', 
              fontSize: '0.85rem' 
            }}
          />
        </div>

        {/* Custom Range Picker */}
        {rangeMode === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>From:</span>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={e => setCustomStartDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600 }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>To:</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={e => setCustomEndDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600 }}
            />
          </div>
        )}
      </div>

      {/* KPI STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>
            <Moon size={16} color="var(--accent-blue)" /> AVERAGE SLEEP DURATION
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.5px' }}>
            {calculateAvgHours()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>For selected period</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>
            <Clock size={16} color="#22c55e" /> TOTAL SLEEP TIME
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#22c55e', letterSpacing: '-0.5px' }}>
            {calculateTotalSlept()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Accumulated hours</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>
            <Activity size={16} color="#f59e0b" /> OPTIMAL SLEEP STREAK
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#f59e0b', letterSpacing: '-0.5px' }}>
            🔥 {calculateStreak()} Days
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Consecutive 7+ hrs logs</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>
            <Calendar size={16} color="#8b5cf6" /> LOGS IN RANGE
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#8b5cf6', letterSpacing: '-0.5px' }}>
            {validLogsInRange.length} / {chartData.length} Days
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Logged entries count</div>
        </div>
      </div>

      {/* DYNAMIC SLEEP GRAPH */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              Sleep Duration Graph ({rangeMode === 'today' ? 'Today' : rangeMode === '7d' ? 'Past 7 Days' : rangeMode === 'this_month' ? 'This Month' : rangeMode === 'past_month' ? 'Past Month' : 'Custom Range'})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Green (8h+ Excellent) • Blue (7-8h Good) • Orange (5-7h Fair) • Red (&lt;5h Poor)
            </p>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: chartType === 'bar' ? 'var(--bg-card)' : 'transparent',
                color: chartType === 'bar' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: chartType === 'bar' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📊 Bar
            </button>
            <button
              onClick={() => setChartType('line')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: chartType === 'line' ? 'var(--bg-card)' : 'transparent',
                color: chartType === 'line' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: chartType === 'line' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📈 Line
            </button>
          </div>
        </div>

        {chartType === 'line' ? (
          <div style={{ height: '220px', width: '100%', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.map(d => ({
                ...d,
                totalHrs: parseFloat((d.hours + d.minutes / 60).toFixed(1)),
                displayDate: chartData.length <= 14 
                  ? new Date(d.date).toLocaleDateString('en', { weekday: 'short' })
                  : new Date(d.date).toLocaleDateString('en', { month: 'numeric', day: 'numeric' })
              }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="displayDate" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  itemStyle={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}
                  formatter={(val) => [`${val} hrs`, 'Duration']}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="totalHrs" stroke="var(--accent-blue)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-blue)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: chartData.length > 20 ? '4px' : '8px', height: '180px', paddingTop: '10px' }}>
            {chartData.map(day => {
              const totalHrs = day.hours + day.minutes / 60;
              const heightPct = Math.min((totalHrs / 12) * 100, 100); 
              const color = day.quality ? getQualityColor(day.quality) : totalHrs >= 8 ? '#10b981' : totalHrs >= 7 ? 'var(--accent-blue)' : totalHrs >= 5 ? '#f59e0b' : totalHrs > 0 ? '#ef4444' : 'var(--border-color)';
              const formattedDate = new Date(day.date).toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
              const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
  
              return (
                <div 
                  key={day.date} 
                  title={`${day.date}: ${day.hours}h ${day.minutes}m (${day.quality || 'Unlogged'})`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                >
                  {totalHrs > 0 && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {totalHrs.toFixed(1)}h
                    </span>
                  )}
                  <div style={{
                    width: '100%', background: color, borderRadius: '6px 6px 0 0',
                    height: `${heightPct || 2}%`, minHeight: '4px', transition: 'height 0.4s ease',
                    opacity: totalHrs > 0 ? 1 : 0.25
                  }} />
                  <span style={{ fontSize: '0.68rem', marginTop: '6px', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {chartData.length <= 14 ? dayName : formattedDate}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SLEEP LOGS HISTORY TABLE */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Sleep History Logs</h3>
        {(() => {
          const todayDateKey = todayKey(userProfile?.timezone);
          let displayedLogs = logs;
          if (rangeMode === 'today') {
            displayedLogs = logs.filter(log => log.date === todayDateKey);
          } else {
            const today = new Date();
            let startDate, endDate;
            if (rangeMode === '7d') {
              endDate = new Date(today);
              startDate = new Date(today);
              startDate.setDate(today.getDate() - 6);
            } else if (rangeMode === 'this_month') {
              startDate = new Date(today.getFullYear(), today.getMonth(), 1);
              endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            } else if (rangeMode === 'past_month') {
              startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            } else if (rangeMode === 'custom' && customStartDate && customEndDate) {
              startDate = new Date(customStartDate);
              endDate = new Date(customEndDate);
            }
            if (startDate && endDate) {
              const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`;
              const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
              displayedLogs = logs.filter(log => log.date >= startStr && log.date <= endStr);
            }
          }

          if (displayedLogs.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Moon size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>No sleep logs added yet</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "Log Sleep Entry" above to enter your slept hours & minutes.</div>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayedLogs.map(log => (
                <div key={log.id} style={{
                  background: 'var(--bg-main)', padding: '16px 20px', borderRadius: '14px',
                  border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {new Date(log.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{
                        fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, color: '#fff',
                        background: getQualityColor(log.quality)
                      }}>
                        {log.quality}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Moon size={14} color="var(--accent-blue)" />
                        <span style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>{log.hours || 0} hrs {log.minutes || 0} mins slept</span>
                      </div>
                      {log.sleep_time && log.wake_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} />
                          <span>({log.sleep_time} to {log.wake_time})</span>
                        </div>
                      )}
                    </div>
                    {log.notes && (
                      <div style={{ marginTop: '6px', fontSize: '0.83rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        &quot;{log.notes}&quot;
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {log.date === todayDateKey && (
                      <button 
                        onClick={() => handleEditLog(log)}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                          padding: '6px', borderRadius: '8px', transition: 'all 0.2s'
                        }}
                        title="Edit log"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => setDeleteConfirmId(log.id)}
                      style={{
                        background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                        padding: '6px', borderRadius: '8px', transition: 'all 0.2s'
                      }}
                      title="Delete log"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingLogId ? 'Edit Sleep Entry' : 'Log Sleep Entry'}
        icon={Moon}
        maxWidth="440px"
      >
        <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Date</label>
            <input 
              type="date" 
              required 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>

          {/* BED TIME & WAKE TIME */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--accent-blue)' }}>Bed Time</label>
              <input 
                type="time" 
                required
                value={formData.sleep_time}
                onChange={(e) => handleTimeChange('sleep_time', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--accent-blue)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--accent-blue)' }}>Wake Time</label>
              <input 
                type="time" 
                required
                value={formData.wake_time}
                onChange={(e) => handleTimeChange('wake_time', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--accent-blue)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, outline: 'none' }}
              />
            </div>
          </div>

          {/* LIVE AUTO-CALCULATED DURATION & QUALITY CARD */}
          <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Duration (Hrs & Mins)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: Math.max(0, parseInt(e.target.value) || 0) }))}
                  style={{ width: '56px', padding: '4px 6px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>hrs</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, minutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  style={{ width: '56px', padding: '4px 6px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>mins</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Sleep Score</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {Math.round(((formData.hours * 60 + formData.minutes) / 480) * 100)}%
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Sleep Quality</label>
            <CustomSelect 
              value={formData.quality} 
              onChange={(e) => setFormData({...formData, quality: e.target.value})} 
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.92rem' }}
              options={[
                { value: "Excellent", label: "🌟 Excellent" },
                { value: "Good", label: "😊 Good" },
                { value: "Fair", label: "😐 Fair" },
                { value: "Poor", label: "🥱 Poor" }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Notes / Reflections</label>
            <input 
              type="text" 
              placeholder="e.g. Felt well rested, woke up once" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={handleCloseModal}
              style={{ flex: 1, padding: '12px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="blue-btn"
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              {editingLogId ? 'Update Entry' : 'Save Sleep Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CUSTOM IN-APP DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Sleep Log?"
        message="Are you sure you want to delete this sleep entry?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteLog}
        onCancel={() => setDeleteConfirmId(null)}
        type="danger"
      />

    </div>
  );
}
