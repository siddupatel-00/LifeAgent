// src/components/ReminderEditor.jsx
// Reusable reminder editor used by Events, Habits, Water, Sleep, Workout, MorningSummary.
// Props:
//   reminders        – array of reminder objects (current value)
//   onChange         – (newReminders) => void
//   mode             – 'offset' | 'time'
//     'offset' : used for events. Each reminder has offset_minutes (no repeat)
//     'time'   : used for habits/other. Each reminder has reminder_time + repeat_rule + enabled
//   maxReminders     – max allowed (default unlimited)
//   label            – section heading text

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Bell, ChevronDown, Check } from 'lucide-react';
import { testNotificationNow } from '../utils/reminderScheduler';
import TimePicker from './TimePicker';

const OFFSET_OPTIONS = [
  { label: 'At event time',    value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '10 minutes before', value: 10 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before',    value: 60 },
  { label: '2 hours before',   value: 120 },
  { label: '1 day before',     value: 1440 },
  { label: '2 days before',    value: 2880 },
  { label: '1 week before',    value: 10080 },
  { label: '15 days before',   value: 21600 },
  { label: 'Custom time...',   value: 'custom' },
];

const REPEAT_OPTIONS = [
  { label: 'Never',       value: 'never' },
  { label: 'Daily',       value: 'daily' },
  { label: 'Weekdays',    value: 'weekdays' },
  { label: 'Weekly',      value: 'weekly' },
  { label: 'Monthly',     value: 'monthly' },
  { label: 'Yearly',      value: 'yearly' },
  { label: 'Custom days', value: 'custom' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function newReminder(mode) {
  return mode === 'offset'
    ? { id: Date.now(), offset_minutes: 30, repeat_rule: null, enabled: true }
    : { id: Date.now(), reminder_time: '08:00', repeat_rule: JSON.stringify({ type: 'daily' }), enabled: true };
}

function parseRule(rem) {
  if (!rem.repeat_rule) return { type: 'never' };
  try {
    return typeof rem.repeat_rule === 'string' ? JSON.parse(rem.repeat_rule) : rem.repeat_rule;
  } catch {
    return { type: 'daily' };
  }
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '12:00 AM';
  const [h, m] = timeStr.split(':');
  let hNum = Number(h) || 0;
  const isAm = hNum < 12;
  if (hNum === 0) hNum = 12;
  else if (hNum > 12) hNum -= 12;
  return `${hNum}:${m} ${isAm ? 'AM' : 'PM'}`;
}

// ── Fully custom themed dropdown — no native <select> ──────────────────────
function CustomDropdown({ options, value, onChange, minWidth = 130 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', minWidth }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          padding: '7px 10px',
          background: 'var(--bg-card, #12141c)',
          color: 'var(--text-main, #fff)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{selected.label}</span>
        <ChevronDown
          size={13}
          style={{
            flexShrink: 0,
            color: 'var(--text-muted, #94a3b8)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9999,
            minWidth: '100%',
            background: 'var(--bg-card, #12141c)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {options.map(o => {
            const isActive = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '9px 14px',
                  background: isActive
                    ? 'var(--accent-blue-dim, rgba(59,130,246,0.15))'
                    : 'transparent',
                  color: isActive
                    ? 'var(--accent-blue, #3b82f6)'
                    : 'var(--text-main, #fff)',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background 0.1s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ width: 14, flexShrink: 0 }}>
                  {isActive && <Check size={13} />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReminderEditor({ reminders = [], onChange, mode = 'offset', maxReminders, label = 'Reminders' }) {
  const list = Array.isArray(reminders) ? reminders : [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTime, setEditingTime] = useState('08:00');

  function addReminder() {
    if (maxReminders && list.length >= maxReminders) return;
    if (mode === 'time') {
      setEditingId(null);
      setEditingTime('08:00');
      setPickerOpen(true);
    } else {
      onChange([...list, newReminder(mode)]);
    }
  }

  function editReminderTime(id, currentTime) {
    setEditingId(id);
    setEditingTime(currentTime || '08:00');
    setPickerOpen(true);
  }

  function removeReminder(id) {
    onChange(list.filter(r => r.id !== id));
  }

  function handleTimeSave(selectedTime) {
    if (editingId === null) {
      const newRem = { id: Date.now(), reminder_time: selectedTime, repeat_rule: null, enabled: true };
      onChange([...list, newRem]);
    } else {
      updateReminder(editingId, { reminder_time: selectedTime });
    }
    setPickerOpen(false);
  }

  function updateReminder(id, patch) {
    onChange(list.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleRepeatChange(id, type) {
    const rem = list.find(r => r.id === id);
    if (!rem) return;
    const existing = parseRule(rem);
    const newRule = type === 'never' ? null : JSON.stringify({ type, customDays: existing.customDays || [] });
    updateReminder(id, { repeat_rule: newRule });
  }

  function handleCustomDayToggle(id, day) {
    const rem = list.find(r => r.id === id);
    if (!rem) return;
    const rule = parseRule(rem);
    const days = rule.customDays || [];
    const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    updateReminder(id, { repeat_rule: JSON.stringify({ type: 'custom', customDays: updated }) });
  }

  return (
    <>
      <div className="reminder-editor">
        <div className="reminder-editor-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} />
          <span className="reminder-editor-label" style={{ flex: 1 }}>{label}</span>
          <button
            type="button"
            onClick={async () => {
              const ok = await testNotificationNow();
              if (ok) alert('⚡ Test alarm scheduled! Notification will fire in 4 seconds.');
            }}
            style={{ background: 'var(--accent-blue-dim, rgba(59, 130, 246, 0.12))', color: 'var(--accent-blue, #3b82f6)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >
            ⚡ Test Alarm
          </button>
          {(!maxReminders || list.length < maxReminders) && (
            <button className="reminder-add-btn" onClick={addReminder} type="button">
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {list.length === 0 && (
          <p className="reminder-empty-hint">No reminders set. Tap "Add" to add one.</p>
        )}

        {list.map((rem) => {
          const rule = parseRule(rem);
          const repeatType = rem.repeat_rule ? rule.type : 'never';
          
          const isStandardOffset = OFFSET_OPTIONS.some(o => typeof o.value === 'number' && o.value === rem.offset_minutes);
          const isCustomOffset = rem.is_custom_offset || rem.offset_minutes === 'custom' || (!isStandardOffset && typeof rem.offset_minutes === 'number');
          
          // Helper to get custom unit and value
          const getCustomDisplay = (totalMins) => {
            if (typeof totalMins !== 'number' || isNaN(totalMins)) return { val: 10, unit: 'mins' };
            if (totalMins % 1440 === 0) return { val: totalMins / 1440, unit: 'days' };
            if (totalMins % 60 === 0) return { val: totalMins / 60, unit: 'hours' };
            return { val: totalMins, unit: 'mins' };
          };

          const customDisplay = getCustomDisplay(typeof rem.offset_minutes === 'number' ? rem.offset_minutes : 10);

          return (
            <div key={rem.id} className="reminder-item">
              <div className="reminder-item-row">
                {/* Enable / disable toggle */}
                <button
                  type="button"
                  className={`reminder-toggle ${rem.enabled ? 'on' : 'off'}`}
                  onClick={() => updateReminder(rem.id, { enabled: !rem.enabled })}
                  aria-label={rem.enabled ? 'Disable reminder' : 'Enable reminder'}
                />

                {/* Offset (events) or Time button (habits) */}
                {mode === 'offset' ? (
                  <CustomDropdown
                    options={OFFSET_OPTIONS}
                    value={isCustomOffset ? 'custom' : rem.offset_minutes}
                    onChange={val => {
                      if (val === 'custom') {
                        updateReminder(rem.id, { is_custom_offset: true, offset_minutes: 10 });
                      } else {
                        updateReminder(rem.id, { is_custom_offset: false, offset_minutes: val });
                      }
                    }}
                    minWidth={150}
                  />
                ) : (
                  <button
                    type="button"
                    className="reminder-time-input"
                    style={{
                      cursor: 'pointer',
                      background: 'var(--bg-card, rgba(255,255,255,0.05))',
                      color: 'var(--text-main, #ffffff)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      minWidth: '90px',
                      fontFamily: 'inherit',
                    }}
                    onClick={() => editReminderTime(rem.id, rem.reminder_time)}
                  >
                    {formatTimeDisplay(rem.reminder_time)}
                  </button>
                )}

                {/* Repeat — habits only, not calendar events */}
                {mode !== 'offset' && (
                  <CustomDropdown
                    options={REPEAT_OPTIONS}
                    value={repeatType}
                    onChange={val => handleRepeatChange(rem.id, val)}
                    minWidth={120}
                  />
                )}

                {/* Delete */}
                <button
                  type="button"
                  className="reminder-delete-btn"
                  onClick={() => removeReminder(rem.id)}
                  aria-label="Remove reminder"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Custom offset controls for events */}
              {mode === 'offset' && isCustomOffset && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', paddingLeft: '32px' }}>
                  <input
                    type="number"
                    min="1"
                    value={customDisplay.val}
                    onChange={e => {
                      const num = Math.max(1, parseInt(e.target.value, 10) || 1);
                      const mult = customDisplay.unit === 'days' ? 1440 : (customDisplay.unit === 'hours' ? 60 : 1);
                      updateReminder(rem.id, { offset_minutes: num * mult, is_custom_offset: true });
                    }}
                    style={{
                      width: '70px', padding: '6px 10px', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-card, #12141c)',
                      color: 'var(--text-main, #fff)', fontSize: '0.82rem', outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['mins', 'hours', 'days'].map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          const mult = unit === 'days' ? 1440 : (unit === 'hours' ? 60 : 1);
                          updateReminder(rem.id, { offset_minutes: customDisplay.val * mult, is_custom_offset: true });
                        }}
                        style={{
                          padding: '5px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                          cursor: 'pointer', border: '1px solid',
                          borderColor: customDisplay.unit === unit ? 'var(--accent-blue, #3b82f6)' : 'rgba(255,255,255,0.1)',
                          background: customDisplay.unit === unit ? 'var(--accent-blue-dim, rgba(59,130,246,0.2))' : 'transparent',
                          color: customDisplay.unit === unit ? 'var(--accent-blue, #3b82f6)' : 'var(--text-muted, #94a3b8)',
                        }}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>before event</span>
                </div>
              )}

              {/* Custom day chips */}
              {repeatType === 'custom' && (
                <div className="reminder-day-chips">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`reminder-day-chip ${(rule.customDays || []).includes(day) ? 'selected' : ''}`}
                      onClick={() => handleCustomDayToggle(rem.id, day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <TimePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSave={handleTimeSave}
        initialTime={editingTime}
      />
    </>
  );
}
