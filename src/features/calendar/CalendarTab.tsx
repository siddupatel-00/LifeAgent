import { useState } from 'react';
import { useCalendarEvents } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useDate } from '../../hooks/useUtils';
import { Plus, Calendar, Edit2, Trash2, Clock, Bell } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export function CalendarTab({ user }: { user: any }) {
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { todayKey, formatDate, getWeekDays } = useDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [formData, setFormData] = useState({
    title: '',
    date: todayKey(),
    start_time: '09:00',
    end_time: '10:00',
    category: 'Personal',
  });

  const today = todayKey();
  const weekDays = getWeekDays(today);
  const todayEvents = events.filter(e => e.date === selectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
      } else {
        await createEvent(formData);
      }
      setShowAddModal(false);
      setEditingEvent(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', date: todayKey(), start_time: '09:00', end_time: '10:00', category: 'Personal' });
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      category: event.category,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  if (isLoading) return <div className="loading-state">Loading calendar...</div>;

  return (
    <div className="calendar-tab">
      <div className="tab-header">
        <h2 className="tab-title">Calendar</h2>
        <div className="view-toggle">
          <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Week</button>
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Month</button>
        </div>
      </div>

      <div className="calendar-week">
        {weekDays.map((day) => {
          const dayEvents = events.filter(e => e.date === day);
          const isToday = day === today;
          const isSelected = day === selectedDate;
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(day)}
              className={`day-column ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            >
              <span className="day-name">{new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="day-number">{new Date(day + 'T00:00:00').getDate()}</span>
              <div className="day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="mini-event">{event.title}</div>
                ))}
                {dayEvents.length > 3 && <span className="more-events">+{dayEvents.length - 3} more</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="day-detail">
        <h3>{formatDate(selectedDate)}</h3>
        <button onClick={() => { resetForm(); setFormData(prev => ({ ...prev, date: selectedDate })); setShowAddModal(true); }} className="blue-btn add-event-btn">
          <Plus size={18} />
          <span>Add Event</span>
        </button>
        
        {todayEvents.length === 0 ? (
          <p className="empty-hint">No events scheduled</p>
        ) : (
          <ul className="events-list">
            {todayEvents.map((event) => (
              <li key={event.id} className="event-item">
                <div className="event-time">
                  <span>{event.start_time} - {event.end_time}</span>
                </div>
                <div className="event-info">
                  <span className="event-title">{event.title}</span>
                  <span className="event-category">{event.category}</span>
                </div>
                <div className="event-actions">
                  <button onClick={() => handleEdit(event)} className="icon-btn"><Edit2 size={16} /></button>
                  <button onClick={() => setDeleteConfirmId(event.id)} className="icon-btn"><Trash2 size={16} /></button>
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
              <label htmlFor="category">Category</label>
              <select id="category" value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}>
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Health">Health</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="start_time">Start Time</label>
              <input id="start_time" type="time" value={formData.start_time} onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="end_time">End Time</label>
              <input id="end_time" type="time" value={formData.end_time} onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))} />
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