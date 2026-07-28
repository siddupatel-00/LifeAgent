import React, { useState, useEffect } from 'react';
import { Droplet, Bell, BellOff, Plus, RotateCcw, Clock, X, Edit2, Check } from 'lucide-react';

const DEFAULT_PRESETS = [50, 150, 200];

export default function WaterReminder({ todayStat, onLogStat, showToast }) {
  const statObj = Array.isArray(todayStat) ? todayStat[0] : todayStat;
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

  useEffect(() => {
    const currentStat = Array.isArray(todayStat) ? todayStat[0] : todayStat;
    setHydrationLiters(Number(currentStat?.hydration || 0));
  }, [todayStat]);

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
    if (!isReminderEnabled) {
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
  };

  const handleIntervalChange = (mins) => {
    setReminderIntervalMinutes(mins);
    localStorage.setItem('water_reminder_interval', mins.toString());
    if (isReminderEnabled) {
      showToast?.(`Reminder interval updated to ${mins} minutes.`, 'success');
    }
  };

  const handleSaveTargetGoal = (e) => {
    e.preventDefault();
    const val = parseFloat(targetGoalInput.trim());
    if (!val || val <= 0) {
      showToast?.('Please enter a valid target goal in Liters (e.g. 2.5)', 'error');
      return;
    }
    setTargetGoal(val);
    localStorage.setItem('water_target_goal', val.toString());
    setIsEditingTarget(false);
    showToast?.(`Daily target goal set to ${val} L!`, 'success');
  };

  const handleAddWater = (mlToAdd) => {
    const litersToAdd = mlToAdd / 1000;
    const newTotal = parseFloat((hydrationLiters + litersToAdd).toFixed(2));
    setHydrationLiters(newTotal);
    const currentStat = Array.isArray(todayStat) ? (todayStat[0] || {}) : (todayStat || {});
    onLogStat?.({ ...currentStat, hydration: newTotal });
    showToast?.(`Added +${mlToAdd} ml water! Total: ${newTotal} L`, 'success');
  };

  const handleReset = () => {
    setHydrationLiters(0);
    const currentStat = Array.isArray(todayStat) ? (todayStat[0] || {}) : (todayStat || {});
    onLogStat?.({ ...currentStat, hydration: 0 });
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
    <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', marginTop: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: '14px', color: 'var(--text-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplet size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              💧 Drink Water & Hydration Coach
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Track daily water intake, customize quick buttons, set target goals, and receive reminders.
            </p>
          </div>
        </div>

        {/* Reminder Toggle Button */}
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
      </div>

      {/* Progress Card */}
      <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>{hydrationLiters} L</span>
            
            {isEditingTarget ? (
              <form onSubmit={handleSaveTargetGoal} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="3.0"
                  value={targetGoalInput}
                  onChange={e => setTargetGoalInput(e.target.value)}
                  style={{
                    width: '70px', padding: '4px 8px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                    color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700, outline: 'none'
                  }}
                  autoFocus
                />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>L</span>
                <button
                  type="submit"
                  style={{
                    padding: '4px 10px', borderRadius: '8px', border: 'none',
                    background: 'var(--bg-card-hover)', color: 'var(--text-main)',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Check size={12} /> Save
                </button>
              </form>
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                / {targetGoal} L target ({Math.round(hydrationLiters * 1000)} ml)
                <button
                  onClick={() => {
                    setTargetGoalInput(targetGoal.toString());
                    setIsEditingTarget(true);
                  }}
                  title="Edit daily water target goal"
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'
                  }}
                >
                  <Edit2 size={13} />
                </button>
              </span>
            )}
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

      {/* Reminder Frequency Selector */}
      {isReminderEnabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <Clock size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reminder Interval:</span>
          {[30, 45, 60, 90, 120].map(mins => (
            <button
              key={mins}
              onClick={() => handleIntervalChange(mins)}
              style={{
                padding: '4px 10px', borderRadius: '12px', border: '1px solid',
                borderColor: reminderIntervalMinutes === mins ? 'rgba(255, 255, 255, 0.3)' : 'var(--border-color)',
                background: reminderIntervalMinutes === mins ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-card-hover)',
                color: 'var(--text-main)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {mins < 60 ? `${mins}m` : `${mins / 60}h`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
