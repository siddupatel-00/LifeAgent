import { useState } from 'react';
import { useTodayItems } from '../../hooks/useQueries';
import { useDate } from '../../hooks/useUtils';
import { Plus, CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CATEGORIES = ['Health', 'Work', 'Personal', 'Learning', 'Fitness', 'Finance', 'Social', 'Other'];

export function TodayTab() {
  const { todayKey, formatDate } = useDate();
  const { items, isLoading, createItem, updateItem, toggleItem, deleteItem } = useTodayItems();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const [formData, setFormData] = useState({
    label: '',
    category: 'Personal',
    date: todayKey(),
    time: '',
  });

  const today = todayKey();
  const todayItems = items.filter(item => item.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || '') || a.id - b.id);
  const completedCount = todayItems.filter(i => i.checked).length;
  const totalCount = todayItems.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) return;
    setActionError('');

    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
      } else {
        await createItem(formData);
      }
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save item');
    }
  };

  const resetForm = () => {
    setFormData({ label: '', category: 'Personal', date: todayKey(), time: '' });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ label: item.label, category: item.category || 'Personal', date: item.date, time: item.time || '' });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteItem(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete item');
    }
  };

  const handleToggleComplete = async (item: any) => {
    try {
      await toggleItem({ id: item.id, checked: !item.checked });
    } catch (err) {
      // optimistic update already rolled back on error
    }
  };

  if (isLoading) {
    return <div className="loading-state">Loading your day...</div>;
  }

  return (
    <div className="today-tab">
      <div className="today-header">
        <div className="today-title-section">
          <h2 className="today-title">Today</h2>
          <p className="today-date">{formatDate(today)}</p>
        </div>
        <div className="today-progress">
          <div className="progress-ring" style={{ '--progress': percent } as React.CSSProperties}>
            <span className="progress-text">{percent}%</span>
          </div>
          <span className="progress-label">{completedCount} of {totalCount} done</span>
        </div>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      <button onClick={() => { resetForm(); setEditingItem(null); setShowAddModal(true); }} className="blue-btn add-item-btn">
        <Plus size={18} />
        <span>Add Task</span>
      </button>

      {todayItems.length === 0 ? (
        <div className="empty-state">
          <p>Nothing scheduled yet. Add your first task!</p>
        </div>
      ) : (
        <ul className="today-list">
          {todayItems.map((item) => (
            <li key={item.id} className={`today-item ${item.checked ? 'done' : ''}`}>
              <button
                onClick={() => handleToggleComplete(item)}
                className={`item-checkbox ${item.checked ? 'completed' : ''}`}
                aria-label={item.checked ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              <div className="item-content">
                <span className="item-title">{item.label}</span>
                <span className="item-meta">{[item.category, item.time].filter(Boolean).join(' · ')}</span>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(item)} className="icon-btn" aria-label="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirmId(item.id)} className="icon-btn" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingItem ? 'Edit Task' : 'Add Task'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="label">Task</label>
            <input
              id="label"
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="What do you need to do?"
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
              <label htmlFor="time">Time (optional)</label>
              <input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" className="blue-btn">
              {editingItem ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}

export default TodayTab;
