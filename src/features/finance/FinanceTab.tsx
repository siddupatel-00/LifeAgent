import { useState } from 'react';
import { useTransactions } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useDate, formatDate } from '../../hooks/useUtils';
import { Plus, Edit2, Trash2, DollarSign, ArrowDown, ArrowUp } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CustomSelect from '../../components/ui/CustomSelect';

const SPEND_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Other'];
const EARN_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investments', 'Gifts', 'Other'];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', INR: '\u20B9', CAD: 'C$', AUD: 'A$', JPY: '\u00A5', CNY: '\u00A5',
};

export function FinanceTab() {
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const user = useAuthStore((s) => s.user);
  const { todayKey } = useDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [listFilter, setListFilter] = useState<'today' | 'all'>('today');
  const [actionError, setActionError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'spend' as 'spend' | 'earn',
    category: 'Food',
    date: todayKey(),
    notes: '',
  });

  const currencySymbol = user?.currency
    ? (CURRENCY_SYMBOLS[user.currency] || user.currency)
    : '$';

  const today = todayKey();
  const todayTxns = transactions.filter(t => t.date === today);
  const visibleTxns = listFilter === 'today' ? todayTxns : transactions;

  const totalEarned = todayTxns.filter(t => t.type === 'earn').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalSpent = todayTxns.filter(t => t.type === 'spend').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const balance = totalEarned - totalSpent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) return;
    setActionError('');

    try {
      const amount = parseFloat(formData.amount);
      if (Number.isNaN(amount)) return;

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, formData);
      } else {
        await createTransaction(formData);
      }
      setShowAddModal(false);
      setEditingTransaction(null);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save transaction');
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
      category: transaction.category || 'Other',
      date: transaction.date,
      notes: transaction.notes || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete transaction');
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

      {actionError && <div className="form-error">{actionError}</div>}

      <div className="finance-summary">
        <div className="summary-card income">
          <div className="summary-icon"><ArrowUp size={22} /></div>
          <div className="summary-info">
            <span className="summary-label">Income</span>
            <span className="summary-value">{currencySymbol}{totalEarned.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card expense">
          <div className="summary-icon"><ArrowDown size={22} /></div>
          <div className="summary-info">
            <span className="summary-label">Expenses</span>
            <span className="summary-value">{currencySymbol}{totalSpent.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card balance">
          <div className="summary-icon"><DollarSign size={22} /></div>
          <div className="summary-info">
            <span className="summary-label">Balance</span>
            <span className={`summary-value ${balance < 0 ? 'negative' : ''}`}>{currencySymbol}{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="finance-actions">
        <button onClick={() => { resetForm(); setEditingTransaction(null); setShowAddModal(true); }} className="blue-btn">
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
        <div className="filter-tabs">
          <button className={listFilter === 'today' ? 'active' : ''} onClick={() => setListFilter('today')}>Today</button>
          <button className={listFilter === 'all' ? 'active' : ''} onClick={() => setListFilter('all')}>All Time</button>
        </div>
      </div>

      <ul className="transactions-list-full">
        {visibleTxns.length === 0 ? (
          <li className="empty-hint">No transactions{listFilter === 'today' ? ' for today' : ''}</li>
        ) : (
          visibleTxns.slice(0, 50).map((tx) => (
            <li key={tx.id} className="transaction-item">
              <div className="tx-info">
                <span className="tx-title">{tx.title}</span>
                <span className="tx-meta">{[tx.category, tx.date !== today ? formatDate(tx.date) : null].filter(Boolean).join(' · ')}</span>
              </div>
              <span className={`tx-amount ${tx.type === 'earn' ? 'positive' : 'negative'}`}>
                {tx.type === 'earn' ? '+' : '−'}{currencySymbol}{Number(tx.amount).toFixed(2)}
              </span>
              <div className="tx-actions">
                <button onClick={() => handleEdit(tx)} className="icon-btn" aria-label="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirmId(tx.id)} className="icon-btn" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'} size="lg">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="type">Type</label>
              <CustomSelect
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any, category: e.target.value === 'earn' ? 'Salary' : 'Food' }))}
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
          <div className="form-row">
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
            <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">
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

export default FinanceTab;
