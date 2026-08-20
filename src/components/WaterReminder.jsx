import { safeStorage } from '../utils/safeStorage';
import React, { useState, useEffect, useMemo } from 'react';
import TimeButton from './TimeButton';
import { Droplet, Bell, BellOff, Plus, RotateCcw, Clock, X, Edit2, Check, MoreVertical, Calendar } from 'lucide-react';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { todayKey } from '../utils/date';
import { getApiUrl } from '../utils/apiConfig';
import { scheduleWaterReminders, cancelAllOfType } from '../utils/reminderScheduler';

const DEFAULT_PRESETS = [50, 150, 200, 250, 500];

export default function WaterReminder({ todayStat, onLogStat, showToast, userProfile }) {
  const todayDateStr = todayKey(userProfile?.timezone);
  const statObj = Array.isArray(todayStat)
    ? todayStat.find(s => s?.date === todayDateStr)
    : (todayStat?.date ? (todayStat.date === todayDateStr ? todayStat : null) : todayStat);
  const [hydrationLiters, setHydrationLiters] = useState(Number(statObj?.hydration || 0));
  const [targetGoal, setTargetGoal] = useState(() => {
    const saved = safeStorage.getItem('water_target_goal');
    return saved && Number(saved) > 0 ? Number(saved) : 2.5;
  });

  const [waterTimeframe, setWaterTimeframe] = useState('7d');

  const statsList = useMemo(() => {
    return Array.isArray(todayStat) ? todayStat : (todayStat ? [todayStat] : []);
  }, [todayStat]);

  const filteredHistory = useMemo(() => {
    if (!statsList.length) return [];
    
    const sorted = [...statsList].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (waterTimeframe === 'today') {
      return sorted.filter(s => s.date === todayDateStr);
    }

    const now = new Date();
    if (waterTimeframe === '7d') {
      const limitDate = new Date();
      limitDate.setDate(now.getDate() - 7);
      const limitStr = limitDate.toISOString().split('T')[0];
      return sorted.filter(s => (s.date || '') >= limitStr);
    }

    if (waterTimeframe === '30d') {
      const limitDate = new Date();
      limitDate.setDate(now.getDate() - 30);
      const limitStr = limitDate.toISOString().split('T')[0];
      return sorted.filter(s => (s.date || '') >= limitStr);
    }

    return sorted;
  }, [statsList, waterTimeframe, todayDateStr]);

  // Empty-state goal setup
  const [goalInput, setGoalInput] = useState('');
  const [goalInputError, setGoalInputError] = useState('');

  // Custom Quick Presets & Direct Custom Log (Persisted in safeStorage)
  const [presets, setPresets] = useState(() => {
    try {
      const saved = safeStorage.getItem('water_quick_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(Number).filter(n => !isNaN(n) && n > 0);
        }
      }
    } catch (e) {}
    return DEFAULT_PRESETS;
  });
  const [customMlInput, setCustomMlInput] = useState('');
  const [directLogMl, setDirectLogMl] = useState('');
  const [isAddPresetOpen, setIsAddPresetOpen] = useState(false);

  // Reminder settings
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(60);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalTargetGoal, setModalTargetGoal] = useState(targetGoal != null ? targetGoal.toString() : '2.5');
  const [modalReminderInterval, setModalReminderInterval] = useState(reminderIntervalMinutes.toString());
  const [modalCustomInterval, setModalCustomInterval] = useState('');
  const [reminderStartTime, setReminderStartTime] = useState(userProfile?.water_reminder_start || '08:00');
  const [reminderEndTime, setReminderEndTime] = useState(userProfile?.water_reminder_end || '22:00');

  const handleSetGoal = () => {
    const val = parseFloat(goalInput);
    if (!val || val <= 0) {
      setGoalInputError('Please enter a valid target greater than 0 litres.');
      return;
    }
    setGoalInputError('');
    setTargetGoal(val);
    safeStorage.setItem('water_target_goal', val.toString());
    setModalTargetGoal(val.toString());
    showToast?.(`🎯 Daily water goal set to ${val} L!`, 'success');

    // Save to API in background
    try {
      const token = safeStorage.getItem('token');
      if (token) {
        fetch(getApiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ water_target_goal: val })
        }).catch(() => {});
      }
    } catch (e) {}
  };

  const handleSaveAllSettings = () => {
    const newTarget = parseFloat(modalTargetGoal) || 2.5;
    const newInterval = parseInt(modalReminderInterval, 10) || 60;
    
    setTargetGoal(newTarget);
    safeStorage.setItem('water_target_goal', newTarget.toString());
    setReminderIntervalMinutes(newInterval);
    
    // Close modal & show toast INSTANTLY (0ms response to user)
    setIsSettingsOpen(false);
    showToast?.('Water settings saved successfully!', 'success');

    // Sync to API and schedule alarms in background
    (async () => {
      // Reschedule Capacitor notifications FIRST before network request
      const globalEnabled = userProfile?.remindersGlobalEnabled !== false && userProfile?.reminders_global_enabled !== 0;
      scheduleWaterReminders({
        enabled: isReminderEnabled,
        startTime: reminderStartTime,
        endTime: reminderEndTime,
        intervalMinutes: newInterval,
      }, globalEnabled).catch(console.error);

      try {
        const token = safeStorage.getItem('token');
        if (token) {
          await fetch(getApiUrl('/api/settings'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
              water_target_goal: newTarget,
              water_reminder_interval: newInterval,
              water_reminder_enabled: isReminderEnabled,
              water_reminder_start: reminderStartTime,
              water_reminder_end: reminderEndTime,
            })
          });
        }
      } catch (e) {
        console.error('Failed to save water settings', e);
      }
    })();
  };

  useEffect(() => {
    const todayStr = todayKey(userProfile?.timezone);
    const currentStat = Array.isArray(todayStat)
      ? todayStat.find(s => s?.date === todayStr)
      : (todayStat?.date ? (todayStat.date === todayStr ? todayStat : null) : todayStat);
    setHydrationLiters(Number(currentStat?.hydration || 0));

    if (userProfile?.water_target_goal) {
      setTargetGoal(userProfile.water_target_goal);
      setModalTargetGoal(userProfile.water_target_goal.toString());
    } else {
      const saved = safeStorage.getItem('water_target_goal');
      if (saved && Number(saved) > 0) {
        setTargetGoal(Number(saved));
        setModalTargetGoal(saved);
      } else {
        setTargetGoal(prev => (prev && prev > 0) ? prev : 2.5);
      }
    }

    if (userProfile?.water_reminder_interval) {
      setReminderIntervalMinutes(userProfile.water_reminder_interval);
      setModalReminderInterval(userProfile.water_reminder_interval.toString());
    }
    
    if (userProfile?.water_reminder_enabled !== undefined) {
      setIsReminderEnabled(!!userProfile.water_reminder_enabled);
    }
  }, [todayStat, userProfile]);

  // Sync start/end times from userProfile
  useEffect(() => {
    if (userProfile?.water_reminder_start) setReminderStartTime(userProfile.water_reminder_start);
    if (userProfile?.water_reminder_end) setReminderEndTime(userProfile.water_reminder_end);
  }, [userProfile?.water_reminder_start, userProfile?.water_reminder_end]);

  const toggleReminder = async () => {
    const newState = !isReminderEnabled;
    setIsReminderEnabled(newState);

    const globalEnabled = userProfile?.remindersGlobalEnabled !== false && userProfile?.reminders_global_enabled !== 0;
    if (newState) {
      await scheduleWaterReminders({
        enabled: true,
        startTime: reminderStartTime,
        endTime: reminderEndTime,
        intervalMinutes: reminderIntervalMinutes,
      }, globalEnabled).catch(console.error);
      showToast?.(`💧 Water reminders enabled! Every ${reminderIntervalMinutes} min, ${reminderStartTime}–${reminderEndTime}.`, 'success');
    } else {
      await cancelAllOfType('water').catch(console.error);
      showToast?.('Water reminders disabled', 'info');
    }

    try {
      const token = safeStorage.getItem('token');
      if (token) {
        fetch(getApiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ water_reminder_enabled: newState })
        }).catch(err => console.error('Failed to update water reminder state:', err));
      }
    } catch (e) {}
  };

  const handleAddWater = (mlToAdd) => {
    const litersToAdd = mlToAdd / 1000;
    const newTotal = parseFloat((hydrationLiters + litersToAdd).toFixed(2));
    setHydrationLiters(newTotal);
    const todayStr = todayKey(userProfile?.timezone);
    const currentStat = Array.isArray(todayStat)
      ? todayStat.find(s => s?.date === todayStr)
      : (todayStat?.date ? (todayStat.date === todayStr ? todayStat : null) : todayStat);
    onLogStat?.({ ...(currentStat || {}), hydration: newTotal, date: todayStr });
    showToast?.(`Added +${mlToAdd}ml water! Total: ${newTotal} L`, 'success');
  };

  const handleReset = () => {
    setHydrationLiters(0);
    const todayStr = todayKey(userProfile?.timezone);
    const currentStat = Array.isArray(todayStat)
      ? todayStat.find(s => s?.date === todayStr)
      : (todayStat?.date ? (todayStat.date === todayStr ? todayStat : null) : todayStat);
    onLogStat?.({ ...(currentStat || {}), hydration: 0, date: todayStr });
    showToast?.('Daily water intake reset to 0 L', 'info');
  };

  const handleCreateCustomPreset = (e) => {
    e.preventDefault();
    const ml = parseInt(customMlInput.trim(), 10);
    if (!ml || ml <= 0) {
      showToast?.('Please enter a valid ml amount (e.g. 700)', 'error');
      return;
    }
    if (presets.includes(ml)) {
      showToast?.(`${ml}ml button already exists!`, 'info');
      return;
    }
    const updatedPresets = [...presets, ml].sort((a, b) => a - b);
    setPresets(updatedPresets);
    safeStorage.setItem('water_quick_presets', JSON.stringify(updatedPresets));
    setCustomMlInput('');
    setIsAddPresetOpen(false);
    showToast?.(`Added new +${ml}ml quick button!`, 'success');
  };

  const handleDeletePreset = (mlToDelete, e) => {
    e.stopPropagation();
    const updatedPresets = presets.filter(p => p !== mlToDelete);
    setPresets(updatedPresets);
    safeStorage.setItem('water_quick_presets', JSON.stringify(updatedPresets));
    showToast?.(`Removed +${mlToDelete}ml quick button`, 'info');
  };

  const percentComplete = targetGoal > 0 ? Math.min(100, Math.round((hydrationLiters / targetGoal) * 100)) : 0;

  // ── Empty-state: no goal set yet ──────────────────────────────────────────
  if (targetGoal === null) {
    return (
      <div className="animate-entrance" style={{ marginTop: '20px', marginBottom: '20px' }}>
        {/* Page header (icon + title) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', color: '#d8f277', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplet size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d8f277', display: 'inline-block' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                TELEMETRY // HYDRATION
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              Hydration Tracking &amp; Reminders
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Log water intake, customize presets, and set automatic reminders.
            </p>
          </div>
        </div>

        {/* Empty-state goal setup card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: '8px',
          padding: '36px 28px',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
          maxWidth: '440px', margin: '0 auto'
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(216, 242, 119, 0.15)', border: '1px solid #d8f277',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Droplet size={26} style={{ color: '#d8f277' }} />
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>
              Set Daily Water Goal
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Enter how many litres of water you aim to drink each day.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '340px' }}>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[2.0, 2.5, 3.0, 3.5].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setGoalInput(val.toString()); setGoalInputError(''); }}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
                    border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)',
                    fontFamily: "'DM Mono', monospace", cursor: 'pointer'
                  }}
                >
                  {val}L
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
              <input
                id="water-goal-input"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 2.5"
                value={goalInput}
                onChange={e => { setGoalInput(e.target.value); setGoalInputError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSetGoal()}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '8px',
                  border: `1px solid ${goalInputError ? '#ef4444' : 'var(--border-color)'}`,
                  background: 'var(--bg-main)', color: 'var(--text-main)',
                  fontSize: '0.95rem', outline: 'none', fontWeight: 700, fontFamily: "'DM Mono', monospace"
                }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>L</span>
              <button
                id="water-goal-save-btn"
                className="blue-btn"
                onClick={handleSetGoal}
                style={{ padding: '10px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, fontFamily: "'DM Mono', monospace" }}
              >
                SAVE GOAL
              </button>
            </div>
          </div>

          {goalInputError && (
            <p style={{ fontSize: '0.78rem', color: '#ef4444', margin: 0, fontFamily: "'DM Mono', monospace" }}>{goalInputError}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Normal tracker UI (goal is set) ─────────────────────────────────────────
  return (
    <div className="animate-entrance" style={{ marginTop: '16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '8px', color: '#d8f277', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplet size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d8f277', display: 'inline-block' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                TELEMETRY // WATER TRACKER
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              Daily Hydration Telemetry
            </h3>
          </div>
        </div>

        {/* Reminder Toggle Button & Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="blue-btn"
            onClick={toggleReminder}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', fontSize: '0.78rem', borderRadius: '8px',
              fontFamily: "'DM Mono', monospace",
              background: isReminderEnabled ? '#d8f277' : 'var(--bg-card)',
              color: isReminderEnabled ? '#11110f' : 'var(--text-main)',
              border: `1px solid ${isReminderEnabled ? '#c2de60' : 'var(--border-color)'}`
            }}
          >
            {isReminderEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span>{isReminderEnabled ? `REMINDERS (${reminderIntervalMinutes}M)` : 'ENABLE REMINDERS'}</span>
          </button>
          
          <button
            onClick={() => {
              setModalTargetGoal(targetGoal.toString());
              setModalReminderInterval(reminderIntervalMinutes.toString());
              setIsSettingsOpen(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '7px', borderRadius: '8px', background: 'var(--bg-card)',
              border: '1px solid var(--border-color)', color: 'var(--text-main)',
              cursor: 'pointer'
            }}
            title="Hydration Settings"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Progress Card - Dark contrast, acid lime smooth meter, 8px radius */}
      <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: "'DM Mono', monospace" }}>{hydrationLiters} L</span>
            
            <button
              type="button"
              onClick={() => {
                setModalTargetGoal(targetGoal.toString());
                setModalReminderInterval(reminderIntervalMinutes.toString());
                setIsSettingsOpen(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px 6px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: "'DM Mono', monospace",
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              title="Click to edit daily goal"
            >
              / {targetGoal} L TARGET <Edit2 size={12} color="#d8f277" />
            </button>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: "'DM Mono', monospace", color: percentComplete >= 100 ? '#d8f277' : 'var(--text-main)' }}>
            {percentComplete}% {percentComplete >= 100 && '🎉 GOAL MET!'}
          </div>
        </div>

        {/* Smooth progress meter in acid lime / dark contrast */}
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div style={{ height: '100%', width: `${percentComplete}%`, background: '#d8f277', borderRadius: '4px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Quick Log Preset Buttons Section - Clean preset buttons (+50ml, +150ml, +200ml, +250ml, +500ml) with DM Mono and crisp borders */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            QUICK ADD WATER:
          </span>
          <button
            onClick={() => setIsAddPresetOpen(!isAddPresetOpen)}
            className="secondary-btn"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              fontFamily: "'DM Mono', monospace"
            }}
          >
            <Plus size={12} /> {isAddPresetOpen ? 'CLOSE' : 'CUSTOM PRESET'}
          </button>
        </div>

        {/* Custom Preset Creator Form */}
        {isAddPresetOpen && (
          <form onSubmit={handleCreateCustomPreset} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <input
              type="number"
              placeholder="e.g. 750"
              value={customMlInput}
              onChange={e => setCustomMlInput(e.target.value)}
              style={{
                width: '100px', padding: '6px 10px', borderRadius: '6px',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>ml</span>
            <button
              type="submit"
              className="blue-btn"
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', fontFamily: "'DM Mono', monospace" }}
            >
              ADD PRESET
            </button>
          </form>
        )}

        {/* Preset Buttons Grid & Custom Log Input */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {presets.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAddWater(ml)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border-color)',
                background: 'var(--bg-card)', color: 'var(--text-main)',
                fontWeight: 700, fontSize: '0.84rem', fontFamily: "'DM Mono', monospace", cursor: 'pointer', transition: 'all 0.15s',
                position: 'relative'
              }}
            >
              <Plus size={13} color="#d8f277" /> {ml}ml
              {!DEFAULT_PRESETS.includes(ml) && (
                <span
                  onClick={(e) => handleDeletePreset(ml, e)}
                  title="Remove custom button"
                  style={{
                    marginLeft: '4px', opacity: 0.6, display: 'flex', alignItems: 'center', cursor: 'pointer'
                  }}
                >
                  <X size={12} />
                </span>
              )}
            </button>
          ))}

          <button
            onClick={handleReset}
            title="Reset today's water"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
              background: 'transparent', color: '#ef6f3e',
              fontWeight: 700, fontSize: '0.78rem', fontFamily: "'DM Mono', monospace", cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} /> RESET 0L
          </button>
        </div>

        {/* Direct Custom Amount Logger */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseInt(directLogMl.trim(), 10);
              if (val && val > 0) {
                handleAddWater(val);
                setDirectLogMl('');
              } else {
                showToast?.('Please enter a valid ml amount', 'error');
              }
            }}
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            <input
              type="number"
              min="1"
              placeholder="Custom ml (e.g. 350)"
              value={directLogMl}
              onChange={e => setDirectLogMl(e.target.value)}
              style={{
                width: '160px', padding: '7px 10px', borderRadius: '6px',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", outline: 'none'
              }}
            />
            <button
              type="submit"
              className="blue-btn"
              style={{ padding: '7px 14px', fontSize: '0.78rem', borderRadius: '6px', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}
            >
              LOG WATER
            </button>
          </form>
        </div>
      </div>

      {/* Timeframe & Hydration History Section */}
      <div style={{ marginTop: '24px' }}>
        {/* Header & Timeframe Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d8f277', display: 'inline-block' }} />
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', margin: 0, letterSpacing: '-0.02em' }}>
              <Calendar size={16} color="#d8f277" /> Hydration History
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>WINDOW:</span>
            <CustomSelect
              value={waterTimeframe}
              onChange={(e) => setWaterTimeframe(e.target.value)}
              options={[
                { value: 'today', label: 'Today' },
                { value: '7d', label: 'Past 7 Days' },
                { value: '30d', label: 'Past 30 Days' },
                { value: 'all', label: 'All Time' }
              ]}
              style={{ minWidth: '140px', padding: '6px 12px', borderRadius: '8px', fontFamily: "'DM Mono', monospace", fontSize: '0.82rem' }}
            />
          </div>
        </div>

        {/* History Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredHistory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '8px', border: '1px dashed var(--border-color)', background: 'var(--bg-card)', fontSize: '0.84rem', fontFamily: "'DM Mono', monospace" }}>
              No hydration logs found for this timeframe.
            </div>
          ) : (
            filteredHistory.map(record => {
              const liters = Number(record.hydration || 0);
              const goal = targetGoal || 3.0;
              const pct = goal > 0 ? Math.min(100, Math.round((liters / goal) * 100)) : 0;
              const isGoalMet = liters >= goal;

              return (
                <div key={record.date || record.id} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(216, 242, 119, 0.12)', border: '1px solid rgba(216, 242, 119, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Droplet size={16} color="#d8f277" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: "'DM Mono', monospace", color: 'var(--text-main)' }}>{record.date === todayDateStr ? 'TODAY' : record.date}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: "'DM Mono', monospace" }}>
                        {liters.toFixed(1)}L OF {goal}L TARGET ({pct}%)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '240px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#d8f277', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ 
                      background: isGoalMet ? '#d8f277' : 'rgba(239, 111, 62, 0.15)', 
                      color: isGoalMet ? '#11110f' : '#ef6f3e', 
                      border: `1px solid ${isGoalMet ? '#c2de60' : 'rgba(239, 111, 62, 0.35)'}`, 
                      fontWeight: 700, 
                      fontSize: '0.7rem',
                      fontFamily: "'DM Mono', monospace",
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {isGoalMet ? 'MET 💧' : 'IN PROGRESS'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Hydration Settings"
        icon={Droplet}
        maxWidth="440px"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)', marginBottom: '6px' }}>
            DAILY TARGET (LITERS)
          </label>
          <input
            type="number"
            step="0.1"
            value={modalTargetGoal}
            onChange={e => setModalTargetGoal(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid var(--border-color)', background: 'var(--bg-main)',
              color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", outline: 'none'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)', marginBottom: '6px' }}>
            REMINDER INTERVAL
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {[15, 30, 45, 60, 90, 120].map(mins => (
              <button
                key={mins}
                onClick={() => setModalReminderInterval(mins.toString())}
                style={{
                  padding: '6px 10px', borderRadius: '6px', border: '1px solid',
                  borderColor: modalReminderInterval === mins.toString() ? '#d8f277' : 'var(--border-color)',
                  background: modalReminderInterval === mins.toString() ? 'rgba(216, 242, 119, 0.15)' : 'var(--bg-card)',
                  color: modalReminderInterval === mins.toString() ? '#d8f277' : 'var(--text-main)',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer'
                }}
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Custom minutes"
              value={modalCustomInterval}
              onChange={e => setModalCustomInterval(e.target.value)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '0.88rem', fontFamily: "'DM Mono', monospace", outline: 'none'
              }}
            />
            <button
              onClick={() => {
                const mins = parseInt(modalCustomInterval, 10);
                if (mins > 0) {
                  setModalReminderInterval(mins.toString());
                  setModalCustomInterval('');
                }
              }}
              className="blue-btn"
              style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', fontFamily: "'DM Mono', monospace" }}
            >
              SET
            </button>
          </div>
        </div>

        {/* Reminder Window */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)', marginBottom: '6px' }}>
            REMINDER WINDOW
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>START</div>
              <TimeButton 
                value={reminderStartTime}
                onChange={(val) => setReminderStartTime(val)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                  color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', fontFamily: "'DM Mono', monospace"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>END</div>
              <TimeButton 
                value={reminderEndTime}
                onChange={(val) => setReminderEndTime(val)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                  color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', fontFamily: "'DM Mono', monospace"
                }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: "'DM Mono', monospace" }}>
            Reminders fire only between these times each day.
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
          className="blue-btn"
          style={{ width: '100%', padding: '10px', fontSize: '0.92rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '6px', fontFamily: "'DM Mono', monospace" }}
        >
          <Check size={16} /> SAVE SETTINGS
        </button>
      </Modal>
    </div>
  );
}
