import { useState } from 'react';
import { useHabits } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useDate } from '../../hooks/useUtils';
import { Plus, CheckCircle2, Edit2, Trash2, Zap } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CATEGORIES = ['Health', 'Productivity', 'Learning', 'Fitness', 'Mindfulness', 'Creative', 'Social', 'Other'];
const FREQUENCIES = ['daily', 'weekdays', 'weekly', 'custom'] as const;

export function HabitsTab({ user }: { user: any }) {
  const { habits, isLoading, createHabit, updateHabit, deleteHabit } = useHabits();
  const { todayKey, isHabitScheduledOnDay } = useDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Health',
    frequency: 'daily' as const,
    custom_days: '',
    reminder_time: '08:00',
  });

  const today = todayKey();
  const activeHabits = habits.filter(h => !h.archived);
  const todayHabits = activeHabits.filter(h => isHabitScheduledOnDay(h, today));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const data = {
        ...formData,
        reminders: [{ id: 1, reminder_time: formData.reminder_time, enabled: true }],
        archived: false,
      };
      
      if (editingHabit) {
        await updateHabit(editingHabit.id, data);
      } else {
        await createHabit(data);
      }
      setShowAddModal(false);
      setEditingHabit(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save habit:', err);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', category: 'Health', frequency: 'daily', custom_days: '', reminder_time: '08:00' });
  };

  const handleEdit = (habit: any) => {
    setEditingHabit(habit);
    setFormData({
      title: habit.title,
      category: habit.category,
      frequency: habit.frequency,
      custom_days: habit.custom_days || '',
      reminder_time: habit.reminder_time || '08:00',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekdays: 'Weekdays',
      weekly: 'Weekly',
      custom: 'Custom Days',
    };
    return labels[freq] || freq;
  };

  if (isLoading) return <div className="loading-state">Loading habits...</div>;

  return (
    <div className="habits-tab">
      <div className="tab-header">
        <h2 className="tab-title">Habits</h2>
        <p className="tab-subtitle">{todayHabits.length} habits scheduled for today</p>
      </div>

      <button onClick={() => { resetForm(); setShowAddModal(true); }} className="blue-btn add-habit-btn">
        <Plus size={18} />
        <span>New Habit</span>
      </button>

      {activeHabits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Zap size={48} /></div>
          <h3>No habits yet</h3>
          <p>Start building routines that stick. Add your first habit!</p>
        </div>
      ) : (
        <div className="habits-list">
          <div className="habits-section">
            <h3 className="section-title">Today's Habits</h3>
            {todayHabits.length === 0 ? (
              <p className="empty-hint">No habits scheduled for today</p>
            ) : (
              <ul>
                {todayHabits.map((habit) => (
                  <li key={habit.id} className="habit-item">
                    <div className="habit-main">
                      <span className="habit-title">{habit.title}</span>
                      <span className="habit-frequency">{getFrequencyLabel(habit.frequency)}</span>
                    </div>
                    <div className="habit-actions">
                      <button onClick={() => handleEdit(habit)} className="icon-btn" aria-label="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirmId(habit.id)} className="icon-btn" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="habits-section">
            <h3 className="section-title">All Habits</h3>
            <ul>
              {activeHabits.filter(h => !todayHabits.some(th => th.id === h.id)).map((habit) => (
                <li key={habit.id} className="habit-item">
                  <div className="habit-main">
                    <span className="habit-title">{habit.title}</span>
                    <span className="habit-frequency">{getFrequencyLabel(habit.frequency)}</span>
                  </div>
                  <div className="habit-actions">
                    <button onClick={() => handleEdit(habit)} className="icon-btn" aria-label="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(habit.id)} className="icon-btn" aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingHabit ? 'Edit Habit' : 'New Habit'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="title">Habit Name</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Morning meditation"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="frequency">Frequency</label>
            <select
              id="frequency"
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
            >
              {FREQUENCIES.map(freq => <option key={freq} value={freq}>{getFrequencyLabel(freq)}</option>)}
            </select>
          </div>
          {formData.frequency === 'custom' && (
            <div className="form-field">
              <label htmlFor="custom_days">Days (comma-separated, e.g., Mon,Wed,Fri)</label>
              <input
                id="custom_days"
                type="text"
                value={formData.custom_days}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_days: e.target.value }))}
                placeholder="Mon,Wed,Fri"
              />
            </div>
          )}
          <div className="form-field">
            <label htmlFor="reminder_time">Reminder Time</label>
            <input
              id="reminder_time"
              type="time"
              value={formData.reminder_time}
              onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: e.target.value }))}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" className="blue-btn">
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Habit"
        message="Are you sure you want to delete this habit? All progress will be lost."
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}