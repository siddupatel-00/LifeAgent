import { useState } from 'react';
import { useHabits } from '../../hooks/useQueries';
import { useDate } from '../../hooks/useUtils';
import { Plus, Edit2, Trash2, Zap, Flame } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CATEGORIES = ['Health', 'Productivity', 'Learning', 'Fitness', 'Mindfulness', 'Creative', 'Social', 'Other'];
const FREQUENCIES = ['daily', 'weekdays', 'weekly', 'custom'] as const;

export function HabitsTab() {
  const { habits, isLoading, createHabit, updateHabit, deleteHabit } = useHabits();
  const { todayKey, isHabitScheduledOnDay } = useDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const [formData, setFormData] = useState({
    label: '',
    category: 'Health',
    frequency: 'daily' as (typeof FREQUENCIES)[number],
    custom_days: '',
  });

  const today = todayKey();
  const activeHabits = habits.filter(h => !h.archived);
  const todayHabits = activeHabits.filter(h => isHabitScheduledOnDay(h, today));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) return;
    setActionError('');

    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, formData);
      } else {
        await createHabit({ ...formData, client_date: todayKey() });
      }
      setShowAddModal(false);
      setEditingHabit(null);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save habit');
    }
  };

  const resetForm = () => {
    setFormData({ label: '', category: 'Health', frequency: 'daily', custom_days: '' });
  };

  const handleEdit = (habit: any) => {
    setEditingHabit(habit);
    setFormData({
      label: habit.label,
      category: habit.category || 'Health',
      frequency: habit.frequency || 'daily',
      custom_days: habit.custom_days || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHabit(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete habit');
    }
  };

  const getFrequencyLabel = (freq: string) => ({
    daily: 'Daily',
    weekdays: 'Weekdays',
    weekly: 'Weekly',
    custom: 'Custom Days',
  }[freq] || freq);

  if (isLoading) return <div className="loading-state">Loading habits...</div>;

  return (
    <div className="habits-tab">
      <div className="tab-header">
        <h2 className="tab-title">Habits</h2>
        <p className="tab-subtitle">{todayHabits.length} scheduled for today</p>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      <button onClick={() => { resetForm(); setEditingHabit(null); setShowAddModal(true); }} className="blue-btn add-habit-btn">
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
                      <span className="habit-title">{habit.label}</span>
                      <span className="habit-frequency">{getFrequencyLabel(habit.frequency)}</span>
                    </div>
                    {(habit.streak || 0) > 0 && (
                      <span className="habit-streak"><Flame size={14} /> {habit.streak}</span>
                    )}
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

          {activeHabits.length > todayHabits.length && (
            <div className="habits-section">
              <h3 className="section-title">All Habits</h3>
              <ul>
                {activeHabits.filter(h => !todayHabits.some(th => th.id === h.id)).map((habit) => (
                  <li key={habit.id} className="habit-item">
                    <div className="habit-main">
                      <span className="habit-title">{habit.label}</span>
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
          )}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingHabit ? 'Edit Habit' : 'New Habit'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="label">Habit Name</label>
            <input
              id="label"
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Morning meditation"
              required
              autoFocus
            />
          </div>
          <div className="form-row">
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
          </div>
          {formData.frequency === 'custom' && (
            <div className="form-field">
              <label htmlFor="custom_days">Days (comma-separated)</label>
              <input
                id="custom_days"
                type="text"
                value={formData.custom_days}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_days: e.target.value }))}
                placeholder="Mon,Wed,Fri"
              />
            </div>
          )}
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

export default HabitsTab;
