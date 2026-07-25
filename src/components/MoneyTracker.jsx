import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const CATEGORIES = ['General', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Other'];

export default function MoneyTracker({ transactions, setTransactions, token, showToast, currency }) {
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('spend');
  const [newCategory, setNewCategory] = useState('General');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  // Fetch initial transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch('/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        } else {
          showToast?.('Failed to load transactions', 'error');
        }
      } catch (e) {
        showToast?.('Network error loading transactions', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const totalEarned = transactions.filter(t => t.type === 'earn').reduce((acc, t) => acc + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === 'spend').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalEarned - totalSpent;

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          title: newTitle, 
          amount: parseFloat(newAmount), 
          type: newType,
          category: newCategory,
          notes: newNotes,
          date: newDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(prev => [data, ...prev]);
        setNewTitle('');
        setNewAmount('');
        setNewNotes('');
        showToast('Transaction Added', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error adding transaction', 'error');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        showToast('Transaction Deleted', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting transaction', 'error');
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...editForm } : t));
        showToast('Transaction Updated', 'success');
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating transaction', 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ flex: 1, padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Earned</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{currency}{totalEarned.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Spent</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{currency}{totalSpent.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Net Balance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netBalance >= 0 ? '#22c55e' : '#ef4444' }}>{currency}{netBalance.toFixed(2)}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>Transactions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>No transactions recorded yet.</p>
            </div>
          ) : (
            transactions.map(item => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                {editingId === item.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
                      <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})} style={{ width: '100px', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                        <option value="spend">Spending</option>
                        <option value="earn">Earning</option>
                      </select>
                      <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <input type="text" placeholder="Notes (optional)" value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} style={{ padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}><X size={14}/> Cancel</button>
                      <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Check size={14}/> Save</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>{item.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ padding: '2px 8px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>{item.category || 'General'}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                      </div>
                      {item.notes && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>{item.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.type === 'earn' ? '#22c55e' : '#ef4444' }}>
                        {item.type === 'earn' ? '+' : '-'}{currency}{item.amount}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => deleteTransaction(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Add Transaction</h4>
        <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Type</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              <option value="spend">Spending (-)</option>
              <option value="earn">Earning (+)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description</label>
            <input type="text" placeholder="e.g. Groceries..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Amount ({currency})</label>
            <input type="number" placeholder="0.00" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
            <input type="text" placeholder="Extra info..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
          </div>
          <button type="submit" className="blue-btn" style={{ justifyContent: 'center', marginTop: '6px' }}><Plus size={18} /> Record Entry</button>
        </form>
      </div>
    </div>
  );
}
