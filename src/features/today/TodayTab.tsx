import { useState } from 'react';
import { useTodayItems } from '../../hooks/useQueries';
import { useUIStore } from '../../stores/uiStore';
import { useDate } from '../../hooks/useUtils';
import { Plus, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CATEGORIES = ['Health', 'Work', 'Personal', 'Learning', 'Fitness', 'Finance', 'Social', 'Other'];

export function TodayTab({ user }: { user: any }) {
  const { todayKey, formatDate, getWeekDays } = useDate();
  const { timeRange } = useUIStore();
  const { items, isLoading, createItem, updateItem, deleteItem, completeItem, uncompleteItem } = useTodayItems(todayKey());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Personal',
    date: todayKey(),
  });

  const today = todayKey();
  const todayItems = items.filter(item => item.date === today);
  const completedCount = todayItems.filter(i => i.completed).length;
  const totalCount = todayItems.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingItem) {
        await updateItem(editingItem.id, { ...formData });
      } else {
        await createItem({ ...formData, completed: false });
      }
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', category: 'Personal', date: todayKey() });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ title: item.title, category: item.category, date: item.date });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleToggleComplete = async (item: any) => {
    try {
      if (item.completed) {
        await uncompleteItem(item.id);
      } else {
        await completeItem(item.id);
      }
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  if (isLoading) {
    return <div className="loading-state">Loading...</div>;
  }

  return (
    <div className="today-tab">
      <div className="today-header">
        <div className="today-title-section">
          <h2 className="today-title">Today</h2>
          <p className="today-date">{formatDate(today)}</p>
        </div>
        <div className="today-progress">
          <div className="progress-ring" style={{ '--progress': totalCount > 0 ? (completedCount / totalCount) * 100 : 0 }}>
            <span className="progress-text">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
          </div>
          <span className="progress-label">{completedCount} of {totalCount} done</span>
        </div>
      </div>

      <button onClick={() => { resetForm(); setShowAddModal(true); }} className="blue-btn add-item-btn">
        <Plus size={18} />
        <span>Add Item</span>
      </button>

      {todayItems.length === 0 ? (
        <div className="empty-state">
          <p>No items for today. Add your first task!</p>
        </div>
      ) : (
        <ul className="today-list">
          {todayItems.map((item) => (
            <li key={item.id} className="today-item">
              <button
                onClick={() => handleToggleComplete(item)}
                className={`item-checkbox ${item.completed ? 'completed' : ''}`}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed && <CheckCircle2 size={20} />}
              </button>
              <div className="item-content">
                <span className="item-title">{item.title}</span>
                <span className="item-category">{item.category}</span>
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

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingItem ? 'Edit Item' : 'Add Item'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What do you need to do?"
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
              {editingItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        confirmClass="contrast-btn"
      />
    </div>
  );
}