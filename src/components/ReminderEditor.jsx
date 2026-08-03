// src/components/ReminderEditor.jsx
// Reusable reminder editor used by Events, Habits, Water, Sleep, Workout, MorningSummary.
// Props:
//   reminders        – array of reminder objects (current value)
//   onChange         – (newReminders) => void
//   mode             – 'offset' | 'time'
//     'offset' : used for events. Each reminder has offset_minutes + optional repeat_rule
//     'time'   : used for habits/other. Each reminder has reminder_time + repeat_rule + enabled
//   maxReminders     – max allowed (default unlimited)
//   label            – section heading text

import React, { useState } from 'react';
import { Plus, Trash2, Bell } from 'lucide-react';
import { testNotificationNow } from '../utils/reminderScheduler';
import TimePicker from './TimePicker';

const OFFSET_OPTIONS = [
  { label: 'At event time', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '10 minutes before', value: 10 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: '2 days before', value: 2880 },
  { label: '1 week before', value: 10080 },
];

const REPEAT_OPTIONS = [
  { label: 'Never', value: 'never' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays', value: 'weekdays' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
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
  let [h, m] = timeStr.split(':');
  let hNum = Number(h) || 0;
  const isAm = hNum < 12;
  if (hNum === 0) hNum = 12;
  else if (hNum > 12) hNum -= 12;
  return `${hNum}:${m} ${isAm ? 'AM' : 'PM'}`;
}

export default function ReminderEditor({ reminders = [], onChange, mode = 'offset', maxReminders, label = 'Reminders' }) {
  const list = Array.isArray(reminders) ? reminders : [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null means "new reminder", else reminder ID
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
              if (ok) alert("⚡ Test alarm scheduled! Notification will fire in 4 seconds.");
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

          return (
            <div key={rem.id} className="reminder-item">
              <div className="reminder-item-row">
                {/* Toggle */}
                <button
                  type="button"
                  className={`reminder-toggle ${rem.enabled ? 'on' : 'off'}`}
                  onClick={() => updateReminder(rem.id, { enabled: !rem.enabled })}
                  aria-label={rem.enabled ? 'Disable reminder' : 'Enable reminder'}
                />

                {/* Offset or Time */}
                {mode === 'offset' ? (
                  <select
                    className="reminder-select"
                    value={rem.offset_minutes}
                    onChange={e => updateReminder(rem.id, { offset_minutes: Number(e.target.value) })}
                  >
                    {OFFSET_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    className="reminder-time-input"
                    style={{ 
                      cursor: 'pointer', 
                      background: 'var(--glass-bg, rgba(255,255,255,0.05))',
                      color: 'var(--text-main, #ffffff)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      minWidth: '90px'
                    }}
                    onClick={() => editReminderTime(rem.id, rem.reminder_time)}
                  >
                    {formatTimeDisplay(rem.reminder_time)}
                  </button>
                )}

                {/* Repeat */}
                <select
                  className="reminder-select"
                  value={repeatType}
                  onChange={e => handleRepeatChange(rem.id, e.target.value)}
                >
                  {REPEAT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

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
