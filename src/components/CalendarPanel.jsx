import React, { useState } from 'react';
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
  const [newEventReminders, setNewEventReminders] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editReminderEventId, setEditReminderEventId] = useState(null);
  const [editReminderList, setEditReminderList] = useState([]);

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

  const handleSaveEventReminders = async (eventId) => {
    try {
      await fetch(getApiUrl('/api/calendar'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: eventId, reminders: editReminderList })
      });
      setCalendarEvents(prev => {
        const updated = prev.map(ev => ev.id === eventId ? { ...ev, reminders: editReminderList } : ev);
        scheduleEventReminders(updated).catch(console.error);
        return updated;
      });
      setEditReminderEventId(null);
      showToast?.('Reminders updated', 'success');
    } catch (err) {
      console.error('Failed to update reminders:', err);
      showToast?.('Error updating reminders', 'error');
    }
  };

  const performDeleteEvent = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(getApiUrl('/api/calendar'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setCalendarEvents(prev => {
          const updated = prev.filter(ev => ev.id !== id);
          cancelEntityReminders('event', id).catch(console.error);
          scheduleEventReminders(updated).catch(console.error);
          return updated;
        });
        showToast?.('Event deleted successfully', 'success');
      } else {
        showToast?.('Failed to delete event', 'error');
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
      showToast?.('Network error deleting event', 'error');
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
    <div className="animate-entrance">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon size={24} color="var(--accent-blue)" /> Universal Calendar
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Manage your events, meetings, and deadlines.
          </p>
        </div>
        <button 
          className="blue-btn" 
          onClick={() => {
            setIsAddEventFormOpen(true);
            setNewEventDate(selectedCalendarDate || todayKey());
            setNewEventTitle('');
          }}
          style={{ padding: '12px 22px', fontSize: '0.92rem' }}
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      <Modal
        isOpen={isAddEventFormOpen}
        onClose={() => setIsAddEventFormOpen(false)}
        title="New Calendar Event"
        icon={CalendarIcon}
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Event Title</label>
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Enter event title..."
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '12px',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddEvent();
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date</label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '12px',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none'
              }}
            />
          </div>
          <ReminderEditor
            reminders={newEventReminders}
            onChange={setNewEventReminders}
            mode="offset"
            label="Reminders"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button className="secondary-btn" onClick={() => setIsAddEventFormOpen(false)}>Cancel</button>
          <button className="blue-btn" onClick={handleAddEvent}>Save Event</button>
        </div>
      </Modal>

      {/* Sub-tabs & Range Selection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={15} /> Timeframe:
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
              width: '190px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '30px',
              padding: '8px 16px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Toggle Expired Events checkbox for non-custom tabs */}
        {calendarSubTab !== 'custom' && calendarSubTab !== 'today' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={showExpired}
              onChange={e => setShowExpired(e.target.checked)}
              style={{ accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
            Show Expired Events
          </label>
        )}
      </div>

      {/* Custom Range Picker Box */}
      {calendarSubTab === 'custom' && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 18px', borderRadius: '14px', border: '1px solid var(--accent-blue)', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} /> Custom Date Range (Includes Expired Events):
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Start:</span>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={e => setCustomStartDate(e.target.value)}
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>End:</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={e => setCustomEndDate(e.target.value)}
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>
          {(customStartDate || customEndDate) && (
            <button 
              onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Clear Range
            </button>
          )}
        </div>
      )}

      <div className="calendar-main-grid">
        {/* Left: Mini Calendar Grid */}
        <div className="calendar-left-col" style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>&lt;</button>
              <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>&gt;</button>
            </div>
          </div>
          <div className="calendar-day-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          <div className="calendar-day-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
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
                      background: isSelected ? 'var(--accent-blue)' : isToday ? 'var(--accent-blue-dim)' : 'var(--bg-main)', 
                      color: isSelected ? 'var(--accent-text, #ffffff)' : 'var(--text-main)',
                      fontWeight: isSelected || isToday ? 800 : 500,
                      border: isToday && !isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)'
                    }}
                  >
                    <span>{d}</span>
                    {dayEvents.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', position: 'absolute', bottom: '3px', left: 0, right: 0 }}>
                        {dayEvents.slice(0, 3).map((e, idx) => (
                          <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#fff' : e.color || 'var(--accent-blue)' }} />
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
        <div className="calendar-right-col" style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              {selectedCalendarDate ? `Events for ${selectedCalendarDate}` : calendarSubTab === 'today' ? "Today's Events" : calendarSubTab === 'custom' ? 'Custom Range Events' : 'Filtered Events'}
            </h4>
            {selectedCalendarDate && (
              <button 
                onClick={() => setSelectedCalendarDate('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Date Filter
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {groupedSections.filter(g => g.key === 'today' || g.events.length > 0).map(group => (
              <div key={group.key}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: group.badgeColor,
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: `2px solid ${group.badgeColor}33`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{group.title}</span>
                  </div>
                  <span style={{
                    background: group.badgeBg,
                    color: group.badgeColor,
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {group.events.length}
                  </span>
                </div>

                {group.events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {group.events.map(e => {
                      const badge = getStatusBadgeProps(e.status);
                      const isDropdownOpen = openStatusDropdown === e.id;
                      
                      return (
                        <div
                          key={e.id}
                          className="calendar-event-card"
                          style={{
                            padding: '14px 16px',
                            background: 'var(--bg-main)',
                            borderRadius: '14px',
                            border: '1px solid var(--border-color)',
                            borderLeft: `4px solid ${e.color || 'var(--accent-blue)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CalendarIcon size={14} /> {e.date}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {/* Status Badge with Dropdown */}
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={() => setOpenStatusDropdown(isDropdownOpen ? null : e.id)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    background: badge.bg, color: badge.color,
                                    border: `1px solid ${badge.color}44`, borderRadius: '20px',
                                    padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {badge.icon} {badge.label} <ChevronDown size={12} />
                                </button>
                                
                                {isDropdownOpen && (
                                  <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: '12px', zIndex: 20, minWidth: '140px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                                    overflow: 'hidden'
                                  }}>
                                    {['upcoming', 'completed', 'failed', 'expired'].map(status => {
                                      const sBadge = getStatusBadgeProps(status);
                                      return (
                                        <div
                                          key={status}
                                          onClick={() => handleUpdateStatus(e.id, status)}
                                          style={{
                                            padding: '9px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px',
                                            cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                                            color: sBadge.color, fontWeight: 600, background: 'var(--bg-card)',
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
                                  background: 'rgba(59,130,246,0.08)',
                                  border: '1px solid rgba(59,130,246,0.2)',
                                  color: 'var(--accent-blue)',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                                title="Edit Reminders"
                              >
                                <Bell size={13} /> {(e.reminders?.length || 0) > 0 ? `${e.reminders.length} reminder${e.reminders.length > 1 ? 's' : ''}` : 'Remind'}
                              </button>

                              {/* Delete Button */}
                              <button 
                                onClick={() => setDeleteConfirmId(e.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: '#ef4444',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                                title="Delete Event"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-word', lineHeight: 1.4 }}>
                            {e.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
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
                  borderRadius: '16px',
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--accent-blue-dim)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '4px'
                }}>
                  <CalendarIcon size={26} style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No events found</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, maxWidth: '300px', lineHeight: 1.4 }}>
                  No events scheduled for this view. Click below to add your first entry.
                </p>
                <button
                  onClick={() => { setIsAddEventFormOpen(true); setNewEventDate(selectedCalendarDate || todayKey(userProfile?.timezone)); setNewEventTitle(''); }}
                  className="blue-btn"
                  style={{ marginTop: '6px', padding: '8px 18px', fontSize: '0.85rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Event
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button className="secondary-btn" onClick={() => setEditReminderEventId(null)}>Cancel</button>
          <button className="blue-btn" onClick={() => handleSaveEventReminders(editReminderEventId)}>Save Reminders</button>
        </div>
      </Modal>
    </div>
  );
}
