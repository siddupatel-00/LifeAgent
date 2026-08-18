import React, { useState } from 'react';
import TimeButton from './TimeButton';
import { todayKey } from '../utils/date';
import { getApiUrl } from '../utils/apiConfig';
import { Calendar as CalendarIcon, Plus, Trash2, ChevronDown, Filter, AlertCircle, CheckCircle, Clock, X, Bell } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import ReminderEditor from './ReminderEditor';
import { cancelEntityReminders, scheduleEventReminders } from '../utils/reminderScheduler';

const formatDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function CalendarPanel({
  calendarEvents = [], setCalendarEvents,
  selectedCalendarDate, setSelectedCalendarDate,
  calendarSubTab = 'today', setCalendarSubTab,
  token, showToast, userProfile
}) {
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(() => todayKey(userProfile?.timezone));
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventReminders, setNewEventReminders] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editReminderEventId, setEditReminderEventId] = useState(null);
  const [editReminderList, setEditReminderList] = useState([]);

  // Format HH:MM to 12-hour AM/PM string
  const formatTime12h = (timeStr) => {
    if (!timeStr) return '12:00 AM';
    const str = String(timeStr).trim().toUpperCase();
    if (str.includes('AM') || str.includes('PM')) return str;
    const parts = str.split(':');
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return '12:00 AM';
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Filters state
  const [showExpired, setShowExpired] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) return;
    try {
      const res = await fetch(getApiUrl('/api/calendar'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          date: newEventDate,
          time: newEventTime,
          color: 'var(--accent-blue)',
          reminders: newEventReminders
        })
      });
      if (res.ok) {
        const ev = await res.json();
        ev.reminders = newEventReminders;
        setCalendarEvents(prev => {
          const updated = [...prev.filter(e => e.id !== ev.id), ev];
          // Reschedule event reminders with full updated list
          scheduleEventReminders(updated).catch(console.error);
          return updated;
        });

        setNewEventTitle('');
        setNewEventTime('');
        setNewEventReminders([]);
        setIsAddEventFormOpen(false);
        showToast?.('Event saved successfully!', 'success');
      } else {
        const err = await res.json();
        showToast?.(err.error || 'Failed to save event', 'error');
      }
    } catch (err) {
      console.error('Failed to add event:', err);
      showToast?.('Network error saving event', 'error');
    }
  };

  const handleSaveEventReminders = (eventId) => {
    // Instantly update state, close modal, and show toast
    setCalendarEvents(prev => {
      const updated = prev.map(ev => ev.id === eventId ? { ...ev, reminders: editReminderList } : ev);
      scheduleEventReminders(updated).catch(console.error);
      return updated;
    });
    setEditReminderEventId(null);
    showToast?.('Reminders updated', 'success');

    // Run network PUT in background
    fetch(getApiUrl('/api/calendar'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: eventId, reminders: editReminderList })
    }).catch(err => {
      console.error('Failed to update reminders:', err);
    });
  };

  const performDeleteEvent = async (id) => {
    if (!id) return;
    // Optimistically cancel OS alarms and update state immediately before network call
    cancelEntityReminders('event', id).catch(console.error);
    const updated = calendarEvents.filter(ev => ev.id !== id);
    setCalendarEvents(updated);
    scheduleEventReminders(updated).catch(console.error);
    showToast?.('Event deleted successfully', 'success');

    try {
      const res = await fetch(getApiUrl('/api/calendar'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        console.error('Failed to delete event on server:', res.status);
      }
    } catch (e) {
      console.error('Failed to delete event:', e);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const safeId = Number(id); // Convert BigInt/string to number for JSON serialization
      const res = await fetch(getApiUrl('/api/calendar'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: safeId, status })
      });
      if (res.ok) {
        setCalendarEvents(prev => prev.map(ev => Number(ev.id) === safeId ? { ...ev, status } : ev));
        setOpenStatusDropdown(null);
        showToast?.('Status updated', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast?.('Failed to update status: ' + (err.error || res.status), 'error');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showToast?.('Error updating status', 'error');
    }
  };

  const getFilteredEvents = () => {
    const todayStr = todayKey(userProfile?.timezone);
    const todayParts = todayStr.split('-').map(Number);
    const now = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    let list = Array.isArray(calendarEvents) ? [...calendarEvents] : [];

    // If a specific calendar date is selected by clicking on the grid
    if (selectedCalendarDate) {
      // User explicitly clicked a date: show all events for that date (including expired)
      return list.filter(e => e.date === selectedCalendarDate);
    }

    if (calendarSubTab === 'custom') {
      // Custom Range mode: Show date range including expired events
      if (customStartDate && customEndDate) {
        list = list.filter(e => e.date >= customStartDate && e.date <= customEndDate);
      } else if (customStartDate) {
        list = list.filter(e => e.date >= customStartDate);
      } else if (customEndDate) {
        list = list.filter(e => e.date <= customEndDate);
      }
      return list; // Include expired events as requested!
    }

    if (calendarSubTab === 'today') {
      // Today mode: filter strictly for today's date
      return list.filter(e => e.date === todayStr);
    }

    if (calendarSubTab === 'this_week') {
      // Sunday-Saturday bounds for This Week
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sStr = formatDateStr(start);
      const eStr = formatDateStr(end);
      list = list.filter(e => e.date >= sStr && e.date <= eStr);
    } else if (calendarSubTab === 'next_week') {
      // Sunday-Saturday bounds for Next Week
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() + (7 - dayOfWeek));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sStr = formatDateStr(start);
      const eStr = formatDateStr(end);
      list = list.filter(e => e.date >= sStr && e.date <= eStr);
    } else if (calendarSubTab === 'this_month') {
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter(e => e.date.startsWith(yearMonth));
    } else if (calendarSubTab === 'next_month') {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const yearMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter(e => e.date.startsWith(yearMonth));
    } else if (calendarSubTab === 'this_year') {
      list = list.filter(e => e.date.startsWith(String(now.getFullYear())));
    }

    // Default real-time filtering unless showExpired toggle is on or subTab is 'all'
    if (!showExpired && calendarSubTab !== 'all') {
      list = list.filter(e => e.date >= todayStr && e.status !== 'expired');
    }

    return list;
  };

  const getStatusBadgeProps = (status) => {
    switch (status || 'upcoming') {
      case 'completed': return { icon: '✅', label: 'Completed', bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
      case 'failed': return { icon: '❌', label: 'Failed', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
      case 'expired': return { icon: '⏰', label: 'Expired', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
      default: return { icon: '⏳', label: 'Not Done Yet', bg: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' };
    }
  };

  const filteredEventsList = getFilteredEvents();

  const todayStr = todayKey(userProfile?.timezone);
  const todayParts = todayStr.split('-').map(Number);
  const todayObj = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrowObj);

  const sortedEventsList = [...filteredEventsList].sort((a, b) => a.date.localeCompare(b.date));

  const groupedSections = [
    { key: 'today', title: `📌 Today (${todayStr})`, badgeBg: 'var(--accent-blue-dim)', badgeColor: 'var(--accent-blue)', emptyMsg: 'No events scheduled for today', events: [] },
    { key: 'tomorrow', title: `🌅 Tomorrow (${tomorrowStr})`, badgeBg: 'rgba(139, 92, 246, 0.15)', badgeColor: '#8b5cf6', emptyMsg: 'No events scheduled for tomorrow', events: [] },
    { key: 'upcoming', title: '🚀 Upcoming', badgeBg: 'rgba(16, 185, 129, 0.15)', badgeColor: '#10b981', emptyMsg: 'No upcoming events found', events: [] },
    { key: 'past', title: '⏳ Earlier / Past', badgeBg: 'rgba(107, 114, 128, 0.15)', badgeColor: '#6b7280', emptyMsg: 'No past events in this range', events: [] }
  ];

  sortedEventsList.forEach(e => {
    if (e.date === todayStr) {
      groupedSections[0].events.push(e);
    } else if (e.date === tomorrowStr) {
      groupedSections[1].events.push(e);
    } else if (e.date > tomorrowStr) {
      groupedSections[2].events.push(e);
    } else {
      groupedSections[3].events.push(e);
    }
  });

  return (
    <div className="animate-entrance" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.45rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', margin: 0, letterSpacing: '-0.02em' }}>
            <CalendarIcon size={22} color="#d8f277" /> Universal Calendar
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Scheduled events, meetings, deadlines, and time audits.
          </p>
        </div>
        <button 
          className="button button-primary" 
          onClick={() => {
            setIsAddEventFormOpen(true);
            setNewEventDate(selectedCalendarDate || todayKey(userProfile?.timezone));
            setNewEventTitle('');
          }}
          style={{ padding: '10px 20px', fontSize: '0.84rem', borderRadius: '6px', font: "600 0.82rem 'DM Sans', sans-serif", background: 'var(--ink)', color: '#d8f277', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      <Modal
        isOpen={isAddEventFormOpen}
        onClose={() => setIsAddEventFormOpen(false)}
        title="New Calendar Event"
        icon={CalendarIcon}
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: "'DM Sans', sans-serif" }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Event Title</label>
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g. Strategy Review, Team Sync..."
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '6px',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif"
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddEvent();
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Date</label>
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                  color: 'var(--text-main)', font: "500 0.85rem 'DM Mono', monospace", outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Time <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>(Default 12 AM)</span>
              </label>
              <TimeButton 
                value={newEventTime}
                onChange={(val) => setNewEventTime(val)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                  color: 'var(--text-main)', font: "500 0.85rem 'DM Mono', monospace", outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <ReminderEditor
            reminders={newEventReminders}
            onChange={setNewEventReminders}
            mode="offset"
            label="Reminders"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="secondary-btn" onClick={() => setIsAddEventFormOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', font: "500 0.82rem 'DM Sans', sans-serif" }}>Cancel</button>
          <button onClick={handleAddEvent} style={{ padding: '8px 18px', borderRadius: '6px', font: "600 0.82rem 'DM Sans', sans-serif", background: '#d8f277', color: '#11110f', border: '1px solid #d8f277', cursor: 'pointer' }}>Save Event</button>
        </div>
      </Modal>

      {/* Sub-tabs & Range Selection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Timeframe:
          </span>
          <CustomSelect
            className="timeframe-dropdown"
            value={calendarSubTab}
            onChange={(e) => {
              setCalendarSubTab(e.target.value);
              setSelectedCalendarDate('');
            }}
            options={[
              { value: 'today', label: '📌 Today' },
              { value: 'this_week', label: '🗓️ This Week' },
              { value: 'next_week', label: '➡️ Next Week' },
              { value: 'this_month', label: '📅 This Month' },
              { value: 'next_month', label: '📆 Next Month' },
              { value: 'this_year', label: '📊 This Year' },
              { value: 'all', label: '📋 All Events' },
              { value: 'custom', label: '🔍 Custom Range' }
            ]}
            style={{
              width: '180px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 14px',
              color: 'var(--text-primary)',
              font: "500 0.8rem 'DM Mono', monospace"
            }}
          />
        </div>

        {/* Toggle Expired Events checkbox for non-custom tabs */}
        {calendarSubTab !== 'custom' && calendarSubTab !== 'today' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', font: "500 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={showExpired}
              onChange={e => setShowExpired(e.target.checked)}
              style={{ accentColor: '#d8f277', cursor: 'pointer' }}
            />
            Show Expired Events
          </label>
        )}
      </div>

      {/* Custom Range Picker Box */}
      {calendarSubTab === 'custom' && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '18px', flexWrap: 'wrap' }}>
          <span style={{ font: "500 0.72rem 'DM Mono', monospace", color: '#d8f277', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} /> Custom Range:
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ font: "500 0.7rem 'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start:</span>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={e => setCustomStartDate(e.target.value)}
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '5px 10px', borderRadius: '6px', font: "500 0.82rem 'DM Mono', monospace" }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ font: "500 0.7rem 'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>End:</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={e => setCustomEndDate(e.target.value)}
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '5px 10px', borderRadius: '6px', font: "500 0.82rem 'DM Mono', monospace" }}
            />
          </div>
          {(customStartDate || customEndDate) && (
            <button 
              onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
              style={{ background: 'transparent', border: 'none', color: '#ef6f3e', font: "600 0.75rem 'DM Mono', monospace", cursor: 'pointer' }}
            >
              Clear Range
            </button>
          )}
        </div>
      )}

      <div className="calendar-main-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left: Mini Calendar Grid */}
        <div className="calendar-left-col" style={{ background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '18px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>{new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', font: "600 0.8rem 'DM Mono', monospace" }}>&lt;</button>
              <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', font: "600 0.8rem 'DM Mono', monospace" }}>&gt;</button>
            </div>
          </div>
          <div className="calendar-day-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ font: "500 0.68rem 'DM Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>
          <div className="calendar-day-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
            {(() => {
              const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();
              const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="calendar-empty-cell" />);
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${calendarMonth.year}-${(calendarMonth.month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                const dayEvents = calendarEvents.filter(e => e.date === dateStr);
                const isSelected = selectedCalendarDate === dateStr;
                const isToday = dateStr === todayKey();
                cells.push(
                  <div 
                    key={d} 
                    className="calendar-date-cell"
                    onClick={() => setSelectedCalendarDate(isSelected ? '' : dateStr)}
                    style={{ 
                      borderRadius: '6px',
                      padding: '8px 0',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? '#d8f277' : isToday ? 'rgba(216, 242, 119, 0.12)' : 'var(--bg-main)', 
                      color: isSelected ? '#11110f' : 'var(--text-main)',
                      font: "500 0.8rem 'DM Mono', monospace",
                      fontWeight: isSelected || isToday ? 700 : 500,
                      border: isSelected ? '1px solid #d8f277' : isToday ? '1px solid #d8f277' : '1px solid var(--border-color)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{d}</span>
                    {dayEvents.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', position: 'absolute', bottom: '3px', left: 0, right: 0 }}>
                        {dayEvents.slice(0, 3).map((e, idx) => (
                          <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#11110f' : e.color || '#d8f277' }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
        
        {/* Right: Event List */}
        <div className="calendar-right-col" style={{ background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '20px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
              {selectedCalendarDate ? `Events for ${selectedCalendarDate}` : calendarSubTab === 'today' ? "Today's Events" : calendarSubTab === 'custom' ? 'Custom Range Events' : 'Filtered Events'}
            </h4>
            {selectedCalendarDate && (
              <button 
                onClick={() => setSelectedCalendarDate('')}
                style={{ background: 'transparent', border: 'none', color: '#d8f277', font: "600 0.78rem 'DM Mono', monospace", cursor: 'pointer' }}
              >
                Clear Date Filter
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {groupedSections.filter(g => g.key === 'today' || g.events.length > 0).map(group => (
              <div key={group.key}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  font: "600 0.72rem 'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: group.badgeColor,
                  marginBottom: '10px',
                  paddingBottom: '4px',
                  borderBottom: `1px solid ${group.badgeColor}33`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{group.title}</span>
                  </div>
                  <span style={{
                    background: group.badgeBg,
                    color: group.badgeColor,
                    borderRadius: '4px',
                    padding: '2px 7px',
                    font: "500 0.7rem 'DM Mono', monospace"
                  }}>
                    {group.events.length}
                  </span>
                </div>

                {group.events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {group.events.map(e => {
                      const badge = getStatusBadgeProps(e.status);
                      const isDropdownOpen = openStatusDropdown === e.id;
                      
                      return (
                        <div
                          key={e.id}
                          className="calendar-event-card"
                          style={{
                            padding: '12px 16px',
                            background: 'var(--bg-main)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            borderLeft: `4px solid ${e.color || '#d8f277'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CalendarIcon size={13} /> {e.date} <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>• ⏰ {formatTime12h(e.time)}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {/* Status Badge with Dropdown */}
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={() => setOpenStatusDropdown(isDropdownOpen ? null : e.id)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: badge.bg, color: badge.color,
                                    border: `1px solid ${badge.color}44`, borderRadius: '4px',
                                    padding: '3px 8px', font: "500 0.72rem 'DM Mono', monospace", cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {badge.icon} {badge.label} <ChevronDown size={11} />
                                </button>
                                
                                {isDropdownOpen && (
                                  <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: '6px', zIndex: 20, minWidth: '130px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                    overflow: 'hidden'
                                  }}>
                                    {['upcoming', 'completed', 'failed', 'expired'].map(status => {
                                      const sBadge = getStatusBadgeProps(status);
                                      return (
                                        <div
                                          key={status}
                                          onClick={() => handleUpdateStatus(e.id, status)}
                                          style={{
                                            padding: '8px 12px', font: "500 0.75rem 'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: '6px',
                                            cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                                            color: sBadge.color, background: 'var(--bg-card)',
                                            transition: 'background 0.15s'
                                          }}
                                        >
                                          {sBadge.icon} {sBadge.label}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Reminder Button */}
                              <button
                                onClick={() => {
                                  setEditReminderEventId(e.id);
                                  setEditReminderList(Array.isArray(e.reminders) ? e.reminders : []);
                                }}
                                style={{
                                  background: 'rgba(216, 242, 119, 0.1)',
                                  border: '1px solid rgba(216, 242, 119, 0.25)',
                                  color: '#a7c878',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  font: "500 0.72rem 'DM Mono', monospace",
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s'
                                }}
                                title="Edit Reminders"
                              >
                                <Bell size={12} /> {(e.reminders?.length || 0) > 0 ? `${e.reminders.length}` : 'Remind'}
                              </button>

                              {/* Delete Button */}
                              <button 
                                onClick={() => setDeleteConfirmId(e.id)}
                                style={{
                                  background: 'rgba(239, 111, 62, 0.08)',
                                  border: '1px solid rgba(239, 111, 62, 0.25)',
                                  color: '#ef6f3e',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  font: "500 0.72rem 'DM Mono', monospace",
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s'
                                }}
                                title="Delete Event"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-word', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
                            {e.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '6px', border: '1px dashed var(--border-color)', font: "400 0.78rem 'DM Mono', monospace", color: 'var(--text-muted)', textAlign: 'center' }}>
                    {group.emptyMsg}
                  </div>
                )}
              </div>
            ))}

            {filteredEventsList.length === 0 && (
              <div
                className="glass-card"
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-main)',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: '6px',
                  background: 'rgba(216, 242, 119, 0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
                  border: '1px solid rgba(216, 242, 119, 0.25)'
                }}>
                  <CalendarIcon size={22} style={{ color: '#d8f277' }} />
                </div>
                <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>No events scheduled</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, maxWidth: '300px', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
                  No events found for this view. Click below to add an event.
                </p>
                <button
                  onClick={() => { setIsAddEventFormOpen(true); setNewEventDate(selectedCalendarDate || todayKey(userProfile?.timezone)); setNewEventTitle(''); }}
                  style={{ marginTop: '6px', padding: '8px 16px', fontSize: '0.82rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d8f277', color: '#11110f', border: '1px solid #d8f277', cursor: 'pointer', fontWeight: 600 }}
                >
                  <Plus size={15} /> Add Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        confirmText="Delete"
        onConfirm={() => {
          const id = deleteConfirmId;
          setDeleteConfirmId(null);
          performDeleteEvent(id);
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Reminder Edit Modal */}
      <Modal
        isOpen={editReminderEventId !== null}
        onClose={() => setEditReminderEventId(null)}
        title="Event Reminders"
        icon={Bell}
        maxWidth="420px"
      >
        <ReminderEditor
          reminders={editReminderList}
          onChange={setEditReminderList}
          mode="offset"
          label="Reminders"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="secondary-btn" onClick={() => setEditReminderEventId(null)} style={{ padding: '8px 16px', borderRadius: '6px', font: "500 0.82rem 'DM Sans', sans-serif" }}>Cancel</button>
          <button onClick={() => handleSaveEventReminders(editReminderEventId)} style={{ padding: '8px 18px', borderRadius: '6px', font: "600 0.82rem 'DM Sans', sans-serif", background: '#d8f277', color: '#11110f', border: '1px solid #d8f277', cursor: 'pointer' }}>Save Reminders</button>
        </div>
      </Modal>
    </div>
  );
}
