import React, { useState, useEffect } from 'react';
import { Droplet, Bell, BellOff, Plus, RotateCcw, Clock, X, Edit2, Check, MoreVertical } from 'lucide-react';
import Modal from './Modal';
import { todayKey } from '../utils/date';

const DEFAULT_PRESETS = [50, 150, 200];

export default function WaterReminder({ todayStat, onLogStat, showToast, userProfile }) {
  const todayDateStr = todayKey(userProfile?.timezone);
  const statObj = Array.isArray(todayStat)
    ? todayStat.find(s => s?.date === todayDateStr)
    : (todayStat?.date ? (todayStat.date === todayDateStr ? todayStat : null) : todayStat);
  const [hydrationLiters, setHydrationLiters] = useState(Number(statObj?.hydration || 0));
  const [targetGoal, setTargetGoal] = useState(() => {
    return Number(localStorage.getItem('water_target_goal')) || 3.0;
  });

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetGoalInput, setTargetGoalInput] = useState(targetGoal.toString());

  // Custom Quick Presets (stored in localStorage for permanent persistence across sessions)
  const [presets, setPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('water_quick_presets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PRESETS;
  });

  const [customMlInput, setCustomMlInput] = useState('');
  const [isAddPresetOpen, setIsAddPresetOpen] = useState(false);

  // Reminder settings
  const [isReminderEnabled, setIsReminderEnabled] = useState(() => {
    return localStorage.getItem('water_reminder_enabled') === 'true';
  });
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(() => {
    return Number(localStorage.getItem('water_reminder_interval')) || 60;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalTargetGoal, setModalTargetGoal] = useState(targetGoal.toString());
  const [modalReminderInterval, setModalReminderInterval] = useState(reminderIntervalMinutes.toString());
  const [modalCustomInterval, setModalCustomInterval] = useState('');

  const handleSaveAllSettings = async () => {
    const newTarget = parseFloat(modalTargetGoal) || 3.0;
    const newInterval = parseInt(modalReminderInterval, 10) || 60;
    
    setTargetGoal(newTarget);
    setReminderIntervalMinutes(newInterval);
    
    localStorage.setItem('water_target_goal', newTarget.toString());
    localStorage.setItem('water_reminder_interval', newInterval.toString());
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            water_target_goal: newTarget,
            water_reminder_interval: newInterval,
            water_reminder_enabled: isReminderEnabled 
          })
        });
      }
    } catch (e) {
      console.error('Failed to save water settings', e);
    }
    
    setIsSettingsOpen(false);
    showToast?.('Water settings saved successfully!', 'success');
  };


  useEffect(() => {
    const todayStr = todayKey(userProfile?.timezone);
    const currentStat = Array.isArray(todayStat)
      ? todayStat.find(s => s?.date === todayStr)
      : (todayStat?.date ? (todayStat.date === todayStr ? todayStat : null) : todayStat);
    setHydrationLiters(Number(currentStat?.hydration || 0));
  }, [todayStat, userProfile?.timezone]);

  // Handle Reminder Timer
  useEffect(() => {
    if (!isReminderEnabled) return;

    const intervalMs = reminderIntervalMinutes * 60 * 1000;

    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('💧 Hydration Reminder!', {
            body: 'Time to take a break and drink a glass of water to stay energized!',
            icon: '/logo.svg'
          });
        }
      }
      showToast?.('💧 Hydration Alert: Time to drink a glass of water!', 'info');
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isReminderEnabled, reminderIntervalMinutes]);

  const toggleReminder = async () => {
    const newState = !isReminderEnabled;
    if (newState) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            showToast?.('Notification permission denied. Will show in-app reminders.', 'info');
          }
        }
      }
      setIsReminderEnabled(true);
      localStorage.setItem('water_reminder_enabled', 'true');
      showToast?.(`💧 Water reminder enabled! Every ${reminderIntervalMinutes} minutes.`, 'success');
    } else {
      setIsReminderEnabled(false);
      localStorage.setItem('water_reminder_enabled', 'false');
      showToast?.('Water reminder disabled', 'info');
    }

    try {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ water_reminder_enabled: newState })
        }).catch(err => console.error('Failed to update water reminder state:', err));
      }
    } catch (e) {}
  };

  const handleIntervalChange = (mins) => {
    setReminderIntervalMinutes(mins);
    setModalReminderInterval(mins.toString());
    localStorage.setItem('water_reminder_interval', mins.toString());
    if (isReminderEnabled) {
      showToast?.(`Reminder interval updated to ${mins} minutes.`, 'success');
    }
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ water_reminder_interval: mins })
        }).catch(err => console.error('Failed to update water reminder interval:', err));
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
    showToast?.(`Added +${mlToAdd} ml water! Total: ${newTotal} L`, 'success');
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
      showToast?.(`${ml} ml button already exists!`, 'info');
      return;
    }
    const updatedPresets = [...presets, ml].sort((a, b) => a - b);
    setPresets(updatedPresets);
    localStorage.setItem('water_quick_presets', JSON.stringify(updatedPresets));
    setCustomMlInput('');
    setIsAddPresetOpen(false);
    showToast?.(`Added new +${ml} ml quick button!`, 'success');
  };

  const handleDeletePreset = (mlToDelete, e) => {
    e.stopPropagation();
    const updatedPresets = presets.filter(p => p !== mlToDelete);
    setPresets(updatedPresets);
    localStorage.setItem('water_quick_presets', JSON.stringify(updatedPresets));
    showToast?.(`Removed +${mlToDelete} ml quick button`, 'info');
  };

  const percentComplete = Math.min(100, Math.round((hydrationLiters / targetGoal) * 100));

  return (
    <div className="animate-entrance" style={{ marginTop: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: '14px', color: 'var(--text-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplet size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              💧 Water
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Track daily water intake, customize quick buttons, set target goals, and receive reminders.
            </p>
          </div>
        </div>

        {/* Reminder Toggle Button & 3-dots Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="blue-btn"
            onClick={toggleReminder}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', fontSize: '0.85rem'
            }}
          >
            {isReminderEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            <span>{isReminderEnabled ? `Reminders Active (${reminderIntervalMinutes}m)` : 'Enable Reminders'}</span>
          </button>
          
          <button
            onClick={() => {
              setModalTargetGoal(targetGoal.toString());
              setModalReminderInterval(reminderIntervalMinutes.toString());
              setIsSettingsOpen(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', borderRadius: '12px', background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)', color: 'var(--text-main)',
              cursor: 'pointer'
            }}
            title="Settings"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>{hydrationLiters} L</span>
            
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              / {targetGoal} L target
            </span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: percentComplete >= 100 ? '#10b981' : 'var(--text-main)' }}>
            {percentComplete}% {percentComplete >= 100 && '🎉 Goal Met!'}
          </div>
        </div>

        {/* Bar */}
        <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${percentComplete}%`, background: 'var(--accent-blue)', borderRadius: '6px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {hydrationLiters === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '24px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Droplet size={32} style={{ color: 'var(--accent-blue)', opacity: 0.5 }} />
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>No items logged yet</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>No items logged yet. Click + to add your first entry</p>
        </div>
      )}

      {/* Quick Log Buttons Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Quick Add Preset Buttons:
          </span>
          <button
            onClick={() => setIsAddPresetOpen(!isAddPresetOpen)}
            className="blue-btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: '10px'
            }}
          >
            <Plus size={14} /> {isAddPresetOpen ? 'Close' : 'Add your own'}
          </button>
        </div>

        {/* Custom Preset Input Form */}
        {isAddPresetOpen && (
          <form onSubmit={handleCreateCustomPreset} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <input
              type="number"
              placeholder="e.g. 700"
              value={customMlInput}
              onChange={e => setCustomMlInput(e.target.value)}
              style={{
                width: '120px', padding: '6px 12px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 600, outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>ml</span>
            <button
              type="submit"
              className="blue-btn"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              Add Button
            </button>
          </form>
        )}

        {/* Preset Buttons Grid */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {presets.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAddWater(ml)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '20px', border: '1px solid var(--border-color)',
                background: 'var(--bg-card-hover)', color: 'var(--text-main)',
                fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <Plus size={14} /> +{ml} ml
              {!DEFAULT_PRESETS.includes(ml) && (
                <span
                  onClick={(e) => handleDeletePreset(ml, e)}
                  title="Remove custom button"
                  style={{
                    marginLeft: '4px', opacity: 0.7, display: 'flex', alignItems: 'center', cursor: 'pointer'
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
              padding: '8px 14px', borderRadius: '20px', border: '1px solid var(--border-color)',
              background: 'transparent', color: 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
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
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Daily Target (Liters)
          </label>
          <input
            type="number"
            step="0.1"
            value={modalTargetGoal}
            onChange={e => setModalTargetGoal(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '12px',
              border: '1px solid var(--border-color)', background: 'var(--bg-main)',
              color: 'var(--text-main)', fontSize: '1rem', outline: 'none'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Reminder Interval
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {[15, 30, 45, 60, 90, 120].map(mins => (
              <button
                key={mins}
                onClick={() => setModalReminderInterval(mins.toString())}
                style={{
                  padding: '8px 12px', borderRadius: '12px', border: '1px solid',
                  borderColor: modalReminderInterval === mins.toString() ? 'rgba(255, 255, 255, 0.3)' : 'var(--border-color)',
                  background: modalReminderInterval === mins.toString() ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-card-hover)',
                  color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Custom minutes"
              value={modalCustomInterval}
              onChange={e => setModalCustomInterval(e.target.value)}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: '12px',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none'
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
              style={{ padding: '10px 16px', borderRadius: '12px' }}
            >
              Set
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSaveAllSettings}
          className="blue-btn"
          style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }}
        >
          <Check size={18} /> Save Settings
        </button>
      </Modal>
    </div>
  );
}
