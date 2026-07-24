import React, { useState } from 'react';
import { Calendar, Plus, Trash2, ChevronDown } from 'lucide-react';

export default function CalendarPanel({
  calendarEvents, setCalendarEvents,
  selectedCalendarDate, setSelectedCalendarDate,
  calendarSubTab, setCalendarSubTab,
  token, showToast
}) {
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarMonth, setCalendarMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) return;
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newEventTitle.trim(), date: newEventDate, color: '#3b82f6' })
      });
      if (res.ok) {
        const ev = await res.json();
        setCalendarEvents([...calendarEvents, ev]);
        setNewEventTitle('');
        setIsAddEventFormOpen(false);
        showToast('Event Created', 'success');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Delete this event?')) {
      try {
        const res = await fetch('/api/calendar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id })
        });
        if (res.ok) {
          setCalendarEvents(calendarEvents.filter(ev => ev.id !== id));
          showToast('Event Deleted', 'success');
        }
      } catch(err) { console.error(err); }
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setCalendarEvents(calendarEvents.map(ev => ev.id === id ? { ...ev, status } : ev));
        setOpenStatusDropdown(null);
        showToast('Event Status Updated', 'success');
      }
    } catch(err) { console.error(err); }
  };

  const getFilteredEvents = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (calendarSubTab) {
      case 'all':
        return calendarEvents;
      case 'this_week': {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay()); // Sunday
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // Saturday
        return calendarEvents.filter(e => e.date >= start.toISOString().split('T')[0] && e.date <= end.toISOString().split('T')[0]);
      }
      case 'next_week': {
        const start = new Date(now);
        start.setDate(start.getDate() + (7 - start.getDay())); // Next Sunday
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return calendarEvents.filter(e => e.date >= start.toISOString().split('T')[0] && e.date <= end.toISOString().split('T')[0]);
      }
      case 'this_month': {
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return calendarEvents.filter(e => e.date.startsWith(yearMonth));
      }
      case 'next_month': {
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const yearMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
        return calendarEvents.filter(e => e.date.startsWith(yearMonth));
      }
      case 'this_year':
        return calendarEvents.filter(e => e.date.startsWith(String(now.getFullYear())));
      default:
        return calendarEvents;
    }
  };

  const getStatusBadgeProps = (status) => {
    switch (status || 'upcoming') {
      case 'completed': return { icon: '✅', label: 'Completed', bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' };
      case 'failed': return { icon: '❌', label: 'Failed', bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      case 'expired': return { icon: '⏰', label: 'Expired', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      default: return { icon: '📅', label: 'Upcoming', bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
    }
  };

  return (
    <div className="animate-entrance">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={24} color="var(--accent-blue)" /> Universal Calendar
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Manage your events, meetings, and deadlines. Let your AI know what's coming up.
          </p>
        </div>
        <button 
          className="blue-btn" 
          onClick={() => {
            setIsAddEventFormOpen(true);
            setNewEventDate(selectedCalendarDate || new Date().toISOString().split('T')[0]);
            setNewEventTitle('');
          }}
          style={{ padding: '12px 22px', fontSize: '0.92rem' }}
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      {/* Modal Add Event Form */}
      {isAddEventFormOpen && (
        <div
          className="blur-overlay"
          onClick={() => setIsAddEventFormOpen(false)}
        >
          <div
            className="glass-card animate-entrance"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--accent-blue)',
              borderRadius: '16px',
              padding: '24px',
              minWidth: '300px',
              maxWidth: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="var(--accent-blue)" /> New Event
            </h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '2', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Enter event title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Team meeting, Dentist appointment..."
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                    color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEvent();
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                    color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none'
                  }}
                />
              </div>
              <button
                className="blue-btn"
                disabled={!newEventTitle.trim()}
                onClick={handleAddEvent}
                style={{ padding: '12px 24px', fontSize: '0.92rem', whiteSpace: 'nowrap' }}
              >
                Save Event
              </button>
            </div>
            <button className="secondary-btn" onClick={() => setIsAddEventFormOpen(false)} style={{ marginTop: '12px', width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {['All', 'This Week', 'Next Week', 'This Month', 'Next Month', 'This Year'].map(tab => {
          const tabKey = tab.toLowerCase().replace(' ', '_');
          const isActive = calendarSubTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => {
                setCalendarSubTab(tabKey);
                setSelectedCalendarDate('');
              }}
              style={{
                padding: '8px 16px', borderRadius: '50px', border: 'none',
                background: isActive ? 'var(--accent-blue)' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                fontSize: '0.85rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', minHeight: '460px' }}>
        {/* Left: Mini Calendar Grid */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>&lt;</button>
              <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev.year, prev.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>&gt;</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
            {(() => {
              const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();
              const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} />);
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${calendarMonth.year}-${(calendarMonth.month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                const dayEvents = calendarEvents.filter(e => e.date === dateStr);
                const isSelected = selectedCalendarDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                cells.push(
                  <div 
                    key={d} 
                    onClick={() => setSelectedCalendarDate(isSelected ? '' : dateStr)}
                    style={{ 
                      padding: '10px 0', borderRadius: '10px', 
                      background: isSelected ? 'var(--accent-blue)' : isToday ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-main)', 
                      color: isSelected ? '#fff' : 'var(--text-main)',
                      cursor: 'pointer', position: 'relative',
                      fontWeight: isSelected || isToday ? 800 : 500,
                      fontSize: '0.9rem',
                      border: isToday && !isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)'
                    }}
                  >
                    {d}
                    {dayEvents.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', position: 'absolute', bottom: '4px', left: 0, right: 0 }}>
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
        <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>
            {selectedCalendarDate ? `Events for ${selectedCalendarDate}` : 'Filtered Events'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getFilteredEvents()
              .filter(e => !selectedCalendarDate || e.date === selectedCalendarDate)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(e => {
                const badge = getStatusBadgeProps(e.status);
                const isDropdownOpen = openStatusDropdown === e.id;
                
                return (
                  <div key={e.id} style={{ padding: '12px 16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: `4px solid ${e.color || 'var(--accent-blue)'}`, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{e.date}</div>
                      
                      {/* Status Badge with Dropdown */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setOpenStatusDropdown(isDropdownOpen ? null : e.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: badge.bg, color: badge.color,
                            border: `1px solid ${badge.color}`, borderRadius: '12px',
                            padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {badge.icon} {badge.label} <ChevronDown size={12} />
                        </button>
                        
                        {isDropdownOpen && (
                          <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            borderRadius: '8px', zIndex: 10, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}>
                            {['upcoming', 'completed', 'failed', 'expired'].map(status => {
                              const sBadge = getStatusBadgeProps(status);
                              return (
                                <div
                                  key={status}
                                  onClick={() => handleUpdateStatus(e.id, status)}
                                  style={{
                                    padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px',
                                    cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                                    color: sBadge.color, fontWeight: 600
                                  }}
                                >
                                  {sBadge.icon} {sBadge.label}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', paddingRight: '24px' }}>{e.title}</div>
                    <button 
                      onClick={() => handleDeleteEvent(e.id)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer', padding: '4px' }}
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            {getFilteredEvents().filter(e => !selectedCalendarDate || e.date === selectedCalendarDate).length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                No events found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
