import React, { useState, useEffect } from 'react';
import TimeButton from './TimeButton';
import { Plus, X, Trash2, Edit2, Moon, Clock, Calendar, Activity, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { todayKey } from '../utils/date';
import { getApiUrl } from '../utils/apiConfig';

import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import CustomSelect from './CustomSelect';

export default function SleepTracker({ token, showToast, userProfile, todayStat, sleepLogs = [], setSleepLogs }) {
  const [logs, setLogs] = useState(() => Array.isArray(sleepLogs) ? sleepLogs : []);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (Array.isArray(sleepLogs)) {
      setLogs(sleepLogs);
      setIsLoading(false);
    }
  }, [sleepLogs]);

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
    if ((!sleepLogs || sleepLogs.length === 0) && token) {
      fetchLogs();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(getApiUrl('/api/fitness?type=sleep'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setSleepLogs?.(data);
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
        const res = await fetch(getApiUrl('/api/fitness?type=sleep'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          setLogs(prev => {
            const next = prev.map(l => l.id === editingLogId ? { ...l, ...payload } : l).sort((a, b) => new Date(b.date) - new Date(a.date));
            setSleepLogs?.(next);
            return next;
          });
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
        const res = await fetch(getApiUrl('/api/fitness?type=sleep'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const newLog = await res.json();
          setLogs(prev => {
            const next = [newLog, ...prev.filter(l => l.id !== newLog.id)].sort((a, b) => new Date(b.date) - new Date(a.date));
            setSleepLogs?.(next);
            return next;
          });
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
      const res = await fetch(getApiUrl('/api/fitness?type=sleep'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        setLogs(prev => {
          const next = prev.filter(log => log.id !== id);
          setSleepLogs?.(next);
          return next;
        });
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
      case 'Excellent': return '#d8f277'; // acid lime
      case 'Good': return 'var(--accent-blue, #3b82f6)';
      case 'Fair': return '#ef6f3e'; // terracotta orange
      case 'Poor': return '#ef4444';
      default: return 'var(--accent-blue, #3b82f6)';
    }
  };

  const getQualityBadgeStyle = (quality) => {
    switch(quality) {
      case 'Excellent':
        return { background: '#d8f277', color: '#11110f', border: '1px solid #c2de60' };
      case 'Good':
        return { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue-light, #60a5fa)', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'Fair':
        return { background: 'rgba(239, 111, 62, 0.18)', color: '#ef6f3e', border: '1px solid rgba(239, 111, 62, 0.35)' };
      case 'Poor':
        return { background: 'rgba(239, 68, 68, 0.18)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.35)' };
      default:
        return { background: 'var(--accent-blue-dim, rgba(59, 130, 246, 0.15))', color: 'var(--accent-blue, #3b82f6)', border: '1px solid var(--border-color)' };
    }
  };

  // Compute graph data & metrics according to selected date range filter (aggregates multiple sessions per day)
  const getFilteredChartData = () => {
    const today = new Date();
    let startDate, endDate;

    if (rangeMode === 'today') {
      const todayStr = todayKey(userProfile?.timezone);
      const dayLogs = logs.filter(l => l.date === todayStr);
      const totalMins = dayLogs.reduce((sum, l) => sum + ((l.hours || 0) * 60 + (l.minutes || 0)), 0);
      const hours = Math.floor(totalMins / 60);
      const minutes = totalMins % 60;
      let quality = null;
      if (dayLogs.length > 0) {
        const totalHrs = hours + (minutes / 60);
        if (totalHrs >= 8) quality = 'Excellent';
        else if (totalHrs >= 7) quality = 'Good';
        else if (totalHrs >= 5.5) quality = 'Fair';
        else quality = 'Poor';
      }
      return [{
        date: todayStr,
        hours,
        minutes,
        quality,
        sessionCount: dayLogs.length,
        logs: dayLogs
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
      const dateStr = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2,'0')}-${String(curr.getDate()).padStart(2,'0')}`;
      const dayLogs = logs.filter(l => l.date === dateStr);
      const totalMins = dayLogs.reduce((sum, l) => sum + ((l.hours || 0) * 60 + (l.minutes || 0)), 0);
      const hours = Math.floor(totalMins / 60);
      const minutes = totalMins % 60;
      let quality = null;
      if (dayLogs.length > 0) {
        const totalHrs = hours + (minutes / 60);
        if (totalHrs >= 8) quality = 'Excellent';
        else if (totalHrs >= 7) quality = 'Good';
        else if (totalHrs >= 5.5) quality = 'Fair';
        else quality = 'Poor';
      }
      data.push({
        date: dateStr,
        hours,
        minutes,
        quality,
        sessionCount: dayLogs.length,
        logs: dayLogs
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

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>Loading sleep telemetry...</div>;

  return (
    <div className="animate-entrance" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d8f277', display: 'inline-block', boxShadow: '0 0 0 3px rgba(216, 242, 119, 0.2)' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Telemetry // Sleep &amp; Recovery
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.03em' }}>
            <Moon size={20} color="#d8f277" /> Sleep &amp; Recovery Tracker
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px' }}>
            Log sleep duration (hours &amp; minutes) and analyze recovery cycles.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
            🔔 Reminders → <strong>Settings</strong>
          </span>
          <button 
            onClick={handleOpenAddModal}
            className="blue-btn"
            style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Log Sleep Entry
          </button>
        </div>
      </div>

      {/* RANGE FILTER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={13} /> RANGE:
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
              width: '150px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '6px 12px', 
              color: 'var(--text-primary)', 
              fontSize: '0.82rem',
              fontFamily: "'DM Mono', monospace"
            }}
          />
        </div>

        {/* Custom Range Picker */}
        {rangeMode === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>FROM:</span>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={e => setCustomStartDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>TO:</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={e => setCustomEndDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}
            />
          </div>
        )}
      </div>

      {/* KPI STATS CARDS - 8px radius, tactile 1px border, DM Mono telemetry numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <Moon size={14} color="#d8f277" /> AVG DURATION
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', fontFamily: "'DM Mono', monospace", color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {calculateAvgHours()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'DM Mono', monospace" }}>Selected window</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <Clock size={14} color="#d8f277" /> TOTAL SLEPT
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', fontFamily: "'DM Mono', monospace", color: '#d8f277', letterSpacing: '-0.02em' }}>
            {calculateTotalSlept()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'DM Mono', monospace" }}>Accumulated time</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <Activity size={14} color="#ef6f3e" /> OPTIMAL STREAK
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', fontFamily: "'DM Mono', monospace", color: '#ef6f3e', letterSpacing: '-0.02em' }}>
            {calculateStreak()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>DAYS</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'DM Mono', monospace" }}>Consecutive 7+ hrs</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <Calendar size={14} color="var(--accent-blue-light, #60a5fa)" /> LOGGED DAYS
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', fontFamily: "'DM Mono', monospace", color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {validLogsInRange.length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {chartData.length}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'DM Mono', monospace" }}>Tracked entries</div>
        </div>
      </div>

      {/* DYNAMIC SLEEP GRAPH - Acid Lime, Terracotta Orange, Dark Charcoal, Tactile 1px border */}
      <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef6f3e', display: 'inline-block' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Sleep Duration Telemetry ({rangeMode === 'today' ? 'Today' : rangeMode === '7d' ? 'Past 7 Days' : rangeMode === 'this_month' ? 'This Month' : rangeMode === 'past_month' ? 'Past Month' : 'Custom Range'})
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.72rem', fontFamily: "'DM Mono', monospace" }}>
              <span style={{ color: '#d8f277', display: 'flex', alignItems: 'center', gap: '4px' }}>■ 8h+ Excellent</span>
              <span style={{ color: 'var(--accent-blue-light, #60a5fa)', display: 'flex', alignItems: 'center', gap: '4px' }}>■ 7-8h Good</span>
              <span style={{ color: '#ef6f3e', display: 'flex', alignItems: 'center', gap: '4px' }}>■ 5.5-7h Fair</span>
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>■ &lt;5.5h Poor</span>
            </div>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: chartType === 'bar' ? 'var(--bg-card)' : 'transparent',
                color: chartType === 'bar' ? '#d8f277' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                fontFamily: "'DM Mono', monospace",
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              BAR
            </button>
            <button
              onClick={() => setChartType('line')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: chartType === 'line' ? 'var(--bg-card)' : 'transparent',
                color: chartType === 'line' ? '#d8f277' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                fontFamily: "'DM Mono', monospace",
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              LINE
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
                <XAxis dataKey="displayDate" stroke="var(--text-muted)" fontSize={11} fontFamily="'DM Mono', monospace" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} fontFamily="'DM Mono', monospace" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121624', borderColor: 'var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.82rem', fontFamily: "'DM Mono', monospace" }}
                  itemStyle={{ color: '#d8f277', fontWeight: 'bold' }}
                  formatter={(val) => [`${val} hrs`, 'Duration']}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}
                />
                <Line type="monotone" dataKey="totalHrs" stroke="#d8f277" strokeWidth={2.5} dot={{ r: 4, fill: '#d8f277', stroke: '#121624', strokeWidth: 1.5 }} activeDot={{ r: 6, fill: '#ef6f3e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: chartData.length > 20 ? '3px' : '8px', height: '190px', paddingTop: '10px', borderBottom: '1px solid var(--border-color)' }}>
            {chartData.map(day => {
              const totalHrs = day.hours + day.minutes / 60;
              const heightPct = Math.min((totalHrs / 12) * 100, 100); 
              const color = day.quality ? getQualityColor(day.quality) : totalHrs >= 8 ? '#d8f277' : totalHrs >= 7 ? 'var(--accent-blue, #3b82f6)' : totalHrs >= 5.5 ? '#ef6f3e' : totalHrs > 0 ? '#ef4444' : 'var(--border-color)';
              const formattedDate = new Date(day.date).toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
              const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
  
              return (
                <div 
                  key={day.date} 
                  title={`${day.date}: ${day.hours}h ${day.minutes}m (${day.quality || 'Unlogged'})`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                >
                  {totalHrs > 0 && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: color === '#d8f277' ? '#d8f277' : 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {totalHrs.toFixed(1)}h
                    </span>
                  )}
                  <div style={{
                    width: '100%', 
                    background: color, 
                    borderRadius: '4px 4px 0 0',
                    height: `${heightPct || 2}%`, 
                    minHeight: '4px', 
                    transition: 'height 0.3s ease',
                    opacity: totalHrs > 0 ? 1 : 0.2
                  }} />
                  <span style={{ fontSize: '0.65rem', marginTop: '6px', color: 'var(--text-muted)', fontWeight: 600, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
                    {chartData.length <= 14 ? dayName : formattedDate}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SLEEP LOGS HISTORY TABLE - 8px radius cards, DM Mono timestamps and durations */}
      <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d8f277', display: 'inline-block' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Sleep History &amp; Session Logs
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Log multiple sleep sessions (night sleep, afternoon naps, or polyphasic cycles) per day.
            </p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="blue-btn"
            style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', fontFamily: "'DM Mono', monospace" }}
          >
            <Plus size={14} /> + Add Sleep Entry
          </button>
        </div>

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
              <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Moon size={36} style={{ color: '#d8f277', opacity: 0.6 }} />
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>No sleep entries logged for this period</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>Log your night sleep or nap to record recovery telemetry.</p>
                <button
                  onClick={handleOpenAddModal}
                  className="blue-btn"
                  style={{ marginTop: '6px', padding: '8px 16px', fontSize: '0.82rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Mono', monospace" }}
                >
                  <Plus size={14} /> Log Sleep Entry
                </button>
              </div>
            );
          }

          // Count logs per date to badge multiple sessions
          const dateLogCounts = {};
          displayedLogs.forEach(l => {
            dateLogCounts[l.date] = (dateLogCounts[l.date] || 0) + 1;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...displayedLogs].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id).map(log => {
                const isMultiSession = dateLogCounts[log.date] > 1;
                const badgeStyle = getQualityBadgeStyle(log.quality);
                return (
                  <div key={log.id} style={{
                    background: 'var(--bg-main)', padding: '14px 16px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: "'DM Mono', monospace", color: 'var(--text-main)' }}>
                          {new Date(log.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {isMultiSession && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: 'rgba(239, 111, 62, 0.15)', color: '#ef6f3e', border: '1px solid rgba(239, 111, 62, 0.3)', fontFamily: "'DM Mono', monospace" }}>
                            SPLIT / NAP
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontFamily: "'DM Mono', monospace",
                          ...badgeStyle
                        }}>
                          {log.quality}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Moon size={13} color="#d8f277" />
                          <span style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#d8f277' }}>
                            {log.hours || 0}h {log.minutes || 0}m
                          </span>
                        </div>
                        {log.sleep_time && log.wake_time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.78rem' }}>
                            <Clock size={13} />
                            <span>({log.sleep_time} → {log.wake_time})</span>
                          </div>
                        )}
                      </div>
                      {log.notes && (
                        <div style={{ marginTop: '5px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          &quot;{log.notes}&quot;
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button 
                        onClick={() => handleEditLog(log)}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                          padding: '6px', borderRadius: '6px', transition: 'all 0.15s'
                        }}
                        title="Edit log"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(log.id)}
                        style={{
                          background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer',
                          padding: '6px', borderRadius: '6px', transition: 'all 0.15s'
                        }}
                        title="Delete log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
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
        <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: '6px', color: 'var(--text-muted)' }}>DATE</label>
            <input 
              type="date" 
              required 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.88rem', fontFamily: "'DM Mono', monospace", outline: 'none' }}
            />
          </div>

          {/* BED TIME & WAKE TIME */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: '6px', color: '#d8f277' }}>BED TIME</label>
              <TimeButton  
                required
                value={formData.sleep_time}
                onChange={(val) => handleTimeChange('sleep_time', val)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: '6px', color: '#ef6f3e' }}>WAKE TIME</label>
              <TimeButton  
                required
                value={formData.wake_time}
                onChange={(val) => handleTimeChange('wake_time', val)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", outline: 'none' }}
              />
            </div>
          </div>

          {/* LIVE AUTO-CALCULATED DURATION & QUALITY CARD */}
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: '4px', textTransform: 'uppercase' }}>DURATION</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: Math.max(0, parseInt(e.target.value) || 0) }))}
                  style={{ width: '64px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", textAlign: 'center', outline: 'none' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>HRS</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, minutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  style={{ width: '64px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", textAlign: 'center', outline: 'none' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>MINS</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: '4px', textTransform: 'uppercase' }}>SCORE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#d8f277' }}>
                {Math.round(((formData.hours * 60 + formData.minutes) / 480) * 100)}%
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: '6px', color: 'var(--text-muted)' }}>QUALITY</label>
            <CustomSelect 
              value={formData.quality} 
              onChange={(e) => setFormData({...formData, quality: e.target.value})} 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.88rem', fontFamily: "'DM Mono', monospace" }}
              options={[
                { value: "Excellent", label: "🌟 Excellent (8h+)" },
                { value: "Good", label: "😊 Good (7-8h)" },
                { value: "Fair", label: "😐 Fair (5.5-7h)" },
                { value: "Poor", label: "🥱 Poor (<5.5h)" }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: '6px', color: 'var(--text-muted)' }}>NOTES // REFLECTIONS</label>
            <input 
              type="text" 
              placeholder="e.g. Felt well rested, woke up once" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={handleCloseModal}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.88rem' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="blue-btn"
              style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.88rem', justifyContent: 'center' }}
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
