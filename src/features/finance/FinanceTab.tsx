import { useState } from 'react';
import { useTransactions } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useDate } from '../../hooks/useUtils';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, ArrowDown, ArrowUp, Filter } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CustomSelect from '../../components/ui/CustomSelect';

const SPEND_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Other'];
const EARN_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investments', 'Gifts', 'Other'];

export function FinanceTab({ user }: { user: any }) {
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { timeRange } = useUIStore();
  const { todayKey, formatDate } = useDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rightPanelView, setRightPanelView] = useState<'charts' | 'add' | 'list'>('charts');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'spend' as 'spend' | 'earn',
    category: 'Food',
    date: todayKey(),
    notes: '',
  });

  const today = todayKey();
  const filteredTransactions = transactions.filter(t => t.date === today);
  
  const totalEarned = filteredTransactions.filter(t => t.type === 'earn').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalSpent = filteredTransactions.filter(t => t.type === 'spend').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalEarned - totalSpent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) return;

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) return;

      const data = { ...formData, amount };
      
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await createTransaction(data);
      }
      setShowAddModal(false);
      setEditingTransaction(null);
      setRightPanelView('charts');
      resetForm();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', amount: '', type: 'spend', category: 'Food', date: todayKey(), notes: '' });
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      notes: transaction.notes || '',
    });
    setShowAddModal(true);
    setRightPanelView('add');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const categories = formData.type === 'spend' ? SPEND_CATEGORIES : EARN_CATEGORIES;

  if (isLoading) return <div className="loading-state">Loading transactions...</div>;

  return (
    <div className="finance-tab">
      <div className="tab-header">
        <h2 className="tab-title">Finance</h2>
        <p className="tab-subtitle">{formatDate(today)}</p>
      </div>

      <div className="finance-summary">
        <div className="summary-card income">
          <div className="summary-icon"><ArrowUp size={24} /></div>
          <div className="summary-info">
            <span className="summary-label">Income</span>
            <span className="summary-value">{user?.currency || '$'}{totalEarned.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card expense">
          <div className="summary-icon"><ArrowDown size={24} /></div>
          <div className="summary-info">
            <span className="summary-label">Expenses</span>
            <span className="summary-value">{user?.currency || '$'}{totalSpent.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card balance">
          <div className="summary-icon"><DollarSign size={24} /></div>
          <div className="summary-info">
            <span className="summary-label">Balance</span>
            <span className="summary-value">{user?.currency || '$'}{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="finance-actions">
        <button onClick={() => { resetForm(); setShowAddModal(true); setRightPanelView('add'); }} className="blue-btn">
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
        <button onClick={() => setRightPanelView('list')} className="secondary-btn">
          <Filter size={18} />
          <span>View All</span>
        </button>
      </div>

      {rightPanelView === 'charts' && (
        <div className="finance-charts">
          <div className="chart-placeholder">
            <h3>Spending Overview</h3>
            <p>Charts coming soon...</p>
          </div>
        </div>
      )}

      {rightPanelView === 'list' && (
        <div className="transactions-list-full">
          <h3>All Transactions</h3>
          {filteredTransactions.length === 0 ? (
            <p className="empty-hint">No transactions for today</p>
          ) : (
            <ul>
              {filteredTransactions.map((tx) => (
                <li key={tx.id} className="transaction-item">
                  <div className="tx-info">
                    <span className="tx-title">{tx.title}</span>
                    <span className="tx-category">{tx.category}</span>
                  </div>
                  <div className="tx-amount">
                    <span className={tx.type === 'earn' ? 'positive' : 'negative'}>
                      {tx.type === 'earn' ? '+' : '-'}{user?.currency || '$'}{Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="tx-actions">
                    <button onClick={() => handleEdit(tx)} className="icon-btn" aria-label="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(tx.id)} className="icon-btn" aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); setRightPanelView('charts'); }} title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'} size="lg">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="type">Type</label>
              <CustomSelect
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                options={[
                  { value: 'spend', label: 'Expense' },
                  { value: 'earn', label: 'Income' },
                ]}
              />
            </div>
            <div className="form-field">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What was this for?"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <CustomSelect
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              options={categories.map(cat => ({ value: cat, label: cat }))}
            />
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
          <div className="form-field">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => { setShowAddModal(false); resetForm(); setRightPanelView('charts'); }} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" className="blue-btn">
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}