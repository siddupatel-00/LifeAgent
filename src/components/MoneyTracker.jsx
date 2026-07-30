import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, BarChart2, BarChart3, TrendingUp, PieChart, List, DollarSign } from 'lucide-react';
import { todayKey } from '../utils/date';
import { getApiUrl } from '../utils/apiConfig';
import MoneyCharts from './MoneyCharts';
import CustomSelect from './CustomSelect';
import Modal from './Modal';

const SPEND_CATEGORIES = ['General', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Other'];
const EARNING_CATEGORIES = ['Job', 'Business', 'Freelancing', 'Startup', 'Other'];

export default function MoneyTracker({ transactions = [], setTransactions, token, showToast, currency, timeRange = 'today', timeframe, setTimeframe, timezone, userProfile, customStartDate, customEndDate, showForm, setShowForm }) {
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('spend');
  const [newCategory, setNewCategory] = useState('General');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState(todayKey(timezone || userProfile?.timezone));
  const [loading, setLoading] = useState(false);
  const [rightPanelView, setRightPanelView] = useState('charts');

  useEffect(() => {
    if (showForm) {
      setRightPanelView('add');
    }
  }, [showForm]);
  // Fetch initial transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(getApiUrl('/api/transactions'), {
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
      const res = await fetch(getApiUrl('/api/transactions'), {
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
        setShowForm?.(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Error adding transaction', 'error');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(getApiUrl('/api/transactions'), {
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
      const res = await fetch(getApiUrl('/api/transactions'), {
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Transactions</h3>
          <div style={{ position: 'relative' }}>
            <CustomSelect
              className="timeframe-dropdown"
              value={timeframe || timeRange || 'today'}
              onChange={(e) => {
                if (setTimeframe) setTimeframe(e.target.value);
              }}
              options={[
                { value: 'today', label: 'Today' },
                { value: '7d', label: 'Past 7 Days' },
                { value: '30d', label: 'Past 30 Days' },
                { value: 'this_month', label: 'This Month' },
                { value: 'this_year', label: 'This Year' },
                { value: 'lifetime', label: 'All Time' }
              ]}
              style={{ width: '160px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTransactions.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-main)', borderRadius: '18px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <DollarSign size={40} style={{ color: 'var(--accent-blue)', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No items logged yet</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No items logged yet. Click + to add your first entry</p>
              <button
                onClick={() => {
                  setRightPanelView('add');
                  setShowForm?.(true);
                }}
                className="blue-btn"
                style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.85rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add Transaction
              </button>
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
      
      <Modal
        isOpen={rightPanelView === 'add'}
        onClose={() => { setRightPanelView('charts'); setShowForm?.(false); }}
        title="Add Transaction"
        icon={Plus}
        maxWidth="440px"
      >
        <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Type</label>
            <CustomSelect 
              value={newType} 
              onChange={(e) => {
                const val = e.target.value;
                setNewType(val);
                setNewCategory(val === 'earn' ? 'Job' : 'General');
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
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(newType === 'earn' ? EARNING_CATEGORIES : SPEND_CATEGORIES).map(cat => {
                const isSelected = newCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 600 : 500,
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
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
            <button type="button" onClick={() => { setRightPanelView('charts'); setShowForm?.(false); }} className="secondary-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem' }}>Cancel</button>
            <button type="submit" className="blue-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem', justifyContent: 'center' }}><Plus size={18} /> Record Entry</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={editingId !== null}
        onClose={cancelEdit}
        title="Edit Transaction"
        icon={Edit2}
        maxWidth="440px"
      >
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
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {((editForm.type || 'spend') === 'earn' ? EARNING_CATEGORIES : SPEND_CATEGORIES).map(cat => {
                const currentCat = editForm.category || ((editForm.type || 'spend') === 'earn' ? 'Job' : 'General');
                const isSelected = currentCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, category: cat })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 600 : 500,
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
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
            <button onClick={cancelEdit} className="secondary-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem' }}>Cancel</button>
            <button onClick={() => saveEdit(editingId)} className="blue-btn" style={{ padding: '10px 20px', borderRadius: '50px', fontSize: '0.9rem', justifyContent: 'center' }}><Check size={18} /> Save Changes</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
