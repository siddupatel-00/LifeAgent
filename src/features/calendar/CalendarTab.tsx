import { useState } from 'react';
import { useCalendarEvents } from '../../hooks/useQueries';
import { useDate, formatTime } from '../../hooks/useUtils';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CATEGORIES = ['Personal', 'Work', 'Health', 'Social', 'Other'];
const EVENT_COLORS = ['#3b82f6', '#ef6f3e', '#22c55e', '#8b5cf6', '#ec4899'];

export function CalendarTab() {
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { todayKey, formatDate, getWeekDays } = useDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [actionError, setActionError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: todayKey(),
    time: '',
    category: 'Personal',
    color: EVENT_COLORS[0],
  });

  const today = todayKey();
  const weekDays = getWeekDays(today);
  const dayEvents = events
    .filter(e => e.date === selectedDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setActionError('');
    const payload: any = {
      title: formData.title,
      date: formData.date,
      time: formData.time,
      color: formData.color,
    };
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
      } else {
        await createEvent(payload);
      }
      setShowAddModal(false);
      setEditingEvent(null);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save event');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', date: selectedDate, time: '', category: 'Personal', color: EVENT_COLORS[0] });
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time || '',
      category: event.category || 'Personal',
      color: event.color || EVENT_COLORS[0],
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEvent(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete event');
    }
  };

  if (isLoading) return <div className="loading-state">Loading calendar...</div>;

  return (
    <div className="calendar-tab">
      <div className="tab-header">
        <h2 className="tab-title">Calendar</h2>
        <p className="tab-subtitle">{events.filter(e => e.date >= today).length} upcoming events</p>
      </div>

      <div className="calendar-week">
        {weekDays.map((day) => {
          const dayEvents = events.filter(e => e.date === day);
          const isToday = day === today;
          const isSelected = day === selectedDate;
          const [y, m, d] = day.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(day)}
              className={`day-column ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            >
              <span className="day-name">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="day-number">{d}</span>
              <div className="day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="mini-event" style={{ borderLeftColor: event.color }}>{event.title}</div>
                ))}
                {dayEvents.length > 3 && <span className="more-events">+{dayEvents.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="day-detail">
        <div className="day-detail-header">
          <h3>{formatDate(selectedDate)}</h3>
          <button onClick={() => { resetForm(); setEditingEvent(null); setFormData(prev => ({ ...prev, date: selectedDate })); setShowAddModal(true); }} className="blue-btn add-event-btn">
            <Plus size={18} />
            <span>Add Event</span>
          </button>
        </div>

        {actionError && <div className="form-error">{actionError}</div>}

        {dayEvents.length === 0 ? (
          <p className="empty-hint">No events scheduled</p>
        ) : (
          <ul className="events-list">
            {dayEvents.map((event) => (
              <li key={event.id} className={`event-item ${event.status === 'expired' ? 'expired' : ''}`}>
                <span className="event-color-dot" style={{ background: event.color }} />
                <div className="event-time">
                  <span>{formatTime(event.time)}</span>
                  {event.status && <span className="event-status">{event.status}</span>}
                </div>
                <div className="event-info">
                  <span className="event-title">{event.title}</span>
                </div>
                <div className="event-actions">
                  <button onClick={() => handleEdit(event)} className="icon-btn" aria-label="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => setDeleteConfirmId(event.id)} className="icon-btn" aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingEvent ? 'Edit Event' : 'New Event'} size="lg">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input id="title" type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Event title" required autoFocus />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="time">Time</label>
              <input id="time" type="time" value={formData.time} onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker-row">
              {EVENT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${formData.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  aria-label={`Choose ${color}`}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">Cancel</button>
            <button type="submit" className="blue-btn">{editingEvent ? 'Save Changes' : 'Create Event'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}

export default CalendarTab;
