import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, BarChart2, BarChart3, TrendingUp, PieChart, List } from 'lucide-react';
import { todayKey } from '../utils/date';
import MoneyCharts from './MoneyCharts';
import CustomSelect from './CustomSelect';

const SPEND_CATEGORIES = ['Choose Category', 'General', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Other'];
const EARNING_CATEGORIES = ['Choose Category', 'Job', 'Business', 'Freelancing', 'Startup', 'Other'];

export default function MoneyTracker({ transactions, setTransactions, token, showToast, currency, timeRange = 'today', timeframe, timezone, userProfile, customStartDate, customEndDate }) {
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('spend');
  const [newCategory, setNewCategory] = useState('Choose Category');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState(todayKey(timezone || userProfile?.timezone));
  const [loading, setLoading] = useState(false);
  const [rightPanelView, setRightPanelView] = useState('charts');
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
  
  const [chartType, setChartType] = useState('bar');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Filter transactions according to active timeframe (e.g. 'today', '3d', '7d', etc.)
  const filteredTransactions = (() => {
    const tz = timezone || userProfile?.timezone;
    const todayStr = todayKey(tz);

    const getNormalizedDate = (dStr) => {
      if (!dStr || dStr === 'Today') return todayStr;
      if (dStr === 'Yesterday') {
        const d = new Date(todayStr + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
      }
      if (dStr.includes('days ago')) {
        const num = parseInt(dStr, 10) || 1;
        const d = new Date(todayStr + 'T00:00:00');
        d.setDate(d.getDate() - num);
        return d.toISOString().split('T')[0];
      }
      return dStr.split('T')[0];
    };

    const activeTf = timeframe || timeRange || 'today';

    if (!activeTf || activeTf === 'today') {
      return (transactions || []).filter(t => getNormalizedDate(t?.date) === todayStr);
    }

    if (activeTf === 'lifetime' || activeTf === 'all' || activeTf === 'all_time') {
      return transactions || [];
    }

    const now = new Date(todayStr + 'T00:00:00');

    if (['3d', '7d', '14d', '25d', '30d'].includes(activeTf)) {
      const days = parseInt(activeTf);
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - days);
      const pastStr = pastDate.toISOString().split('T')[0];
      return (transactions || []).filter(t => {
        const d = getNormalizedDate(t?.date);
        return d >= pastStr && d <= todayStr;
      });
    }

    if (['1m', '3m', '6m', '12m'].includes(activeTf)) {
      const months = parseInt(activeTf);
      const pastDate = new Date(now);
      pastDate.setMonth(pastDate.getMonth() - months);
      const pastStr = pastDate.toISOString().split('T')[0];
      return (transactions || []).filter(t => {
        const d = getNormalizedDate(t?.date);
        return d >= pastStr && d <= todayStr;
      });
    }

    if (activeTf === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}-`;
      return (transactions || []).filter(t => getNormalizedDate(t?.date).startsWith(prefix));
    }

    if (activeTf === 'last_month') {
      const pastDate = new Date(now);
      pastDate.setMonth(pastDate.getMonth() - 1);
      const year = pastDate.getFullYear();
      const month = String(pastDate.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}-`;
      return (transactions || []).filter(t => getNormalizedDate(t?.date).startsWith(prefix));
    }

    if (activeTf === 'this_year') {
      const year = now.getFullYear();
      const prefix = `${year}-`;
      return (transactions || []).filter(t => getNormalizedDate(t?.date).startsWith(prefix));
    }

    if (activeTf === 'custom') {
      return (transactions || []).filter(t => {
        const d = getNormalizedDate(t?.date);
        const start = customStartDate || '1970-01-01';
        const end = customEndDate || '2999-12-31';
        return d >= start && d <= end;
      });
    }

    return transactions || [];
  })();

  const totalEarned = filteredTransactions.filter(t => t.type === 'earn').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalSpent = filteredTransactions.filter(t => t.type === 'spend').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const netBalance = totalEarned - totalSpent;

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;
    
    let evaluatedAmount = 0;
    try {
      const sanitized = String(newAmount).replace(/[^0-9+\-*/().]/g, '');
      if (!sanitized) throw new Error('Empty');
      // eslint-disable-next-line no-new-func
      evaluatedAmount = new Function('return ' + sanitized)();
      if (isNaN(evaluatedAmount) || !isFinite(evaluatedAmount)) throw new Error('Invalid Math');
    } catch (err) {
      showToast?.('Invalid amount format or calculation', 'error');
      return;
    }
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          title: newTitle, 
          amount: parseFloat(evaluatedAmount), 
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
        setRightPanelView('charts');
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
    let evaluatedAmount = 0;
    try {
      const sanitized = String(editForm.amount).replace(/[^0-9+\-*/().]/g, '');
      if (!sanitized) throw new Error('Empty');
      // eslint-disable-next-line no-new-func
      evaluatedAmount = new Function('return ' + sanitized)();
      if (isNaN(evaluatedAmount) || !isFinite(evaluatedAmount)) throw new Error('Invalid Math');
    } catch (err) {
      showToast?.('Invalid amount format or calculation', 'error');
      return;
    }
    
    const finalForm = { ...editForm, amount: parseFloat(evaluatedAmount) };
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(finalForm)
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
    <div className="money-tracker-grid" style={{ alignItems: 'flex-start' }}>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '8px' }} className="hide-scrollbar">
        <div className="money-summary-cards">
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Transactions</h3>
          <button onClick={() => setRightPanelView('add')} className="blue-btn" style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Record Entry
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>No transactions recorded for selected timeframe.</p>
            </div>
          ) : (
            filteredTransactions.map(item => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
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
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.type === 'earn' ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {item.type === 'earn' ? '+' : '-'}{currency}{item.amount}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => deleteTransaction(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', position: 'sticky', top: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Charts</h4>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
              { id: 'line', label: 'Line Chart', icon: TrendingUp },
              { id: 'pie', label: 'Pie Chart', icon: PieChart }
            ].map(t => {
              const IconComp = t.icon;
              const isActive = chartType === t.id;
              return (
                <button 
                  key={t.id} 
                  onClick={() => setChartType(t.id)} 
                  title={t.label}
                  style={{ 
                    flex: 1, 
                    padding: '10px 0', 
                    borderRadius: '10px', 
                    border: isActive ? 'none' : '1px solid var(--border-color)', 
                    cursor: 'pointer', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? 'var(--accent-blue)' : 'var(--bg-main)', 
                    color: isActive ? '#fff' : 'var(--text-muted)', 
                    transition: 'all 0.2s' 
                  }}
                >
                  <IconComp size={18} />
                </button>
              );
            })}
          </div>

          <div style={{ width: '100%', height: chartType === 'pie' ? 'auto' : '400px', minHeight: '400px' }}>
            <MoneyCharts transactions={filteredTransactions} chartType={chartType} currency={currency} />
          </div>
        </div>
      </div>
      
      {rightPanelView === 'add' && (
        <div className="blur-overlay" onClick={() => setRightPanelView('charts')}>
          <div className="glass-card animate-entrance" style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', width: '100%', maxWidth: '440px', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                  <Plus size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Add Transaction</h3>
              </div>
              <button onClick={() => setRightPanelView('charts')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}><X size={20}/></button>
            </div>
            <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Type</label>
                <CustomSelect 
                  value={newType} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewType(val);
                    setNewCategory('Choose Category');
                  }} 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  options={[
                    { value: "spend", label: "Spending (-)" },
                    { value: "earn", label: "Earning (+)" }
                  ]}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description</label>
                <input type="text" placeholder="Enter description..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Amount ({currency})</label>
                <input type="text" placeholder="e.g., 950+300 or 1250" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
                <CustomSelect 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  options={(newType === 'earn' ? EARNING_CATEGORIES : SPEND_CATEGORIES).map(c => ({ value: c, label: c }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
                <input type="text" placeholder="Enter notes..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setRightPanelView('charts')} className="secondary-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem' }}>Cancel</button>
                <button type="submit" className="blue-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem', justifyContent: 'center' }}><Plus size={18} /> Record Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingId !== null && (
        <div className="blur-overlay" onClick={cancelEdit}>
          <div className="glass-card animate-entrance" style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', width: '100%', maxWidth: '440px', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                  <Edit2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Edit Transaction</h3>
              </div>
              <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Type</label>
                <CustomSelect 
                  value={editForm.type || 'spend'} 
                  onChange={e => {
                    const val = e.target.value;
                    setEditForm({ ...editForm, type: val, category: val === 'earn' ? 'Job' : 'General' });
                  }} 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  options={[
                    { value: "spend", label: "Spending (-)" },
                    { value: "earn", label: "Earning (+)" }
                  ]}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description</label>
                <input type="text" placeholder="Enter description..." value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Amount ({currency})</label>
                <input type="text" placeholder="e.g., 950+300 or 1250" value={editForm.amount || ''} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
                <CustomSelect 
                  value={editForm.category || 'General'} 
                  onChange={e => setEditForm({...editForm, category: e.target.value})} 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  options={(editForm.type === 'earn' ? EARNING_CATEGORIES : SPEND_CATEGORIES).map(c => ({ value: c, label: c }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
                <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
                <input type="text" placeholder="Enter notes..." value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={cancelEdit} className="secondary-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem' }}>Cancel</button>
                <button type="button" onClick={saveEdit} className="blue-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem', justifyContent: 'center' }}><Check size={18} /> Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
