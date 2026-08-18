import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, BarChart2, BarChart3, TrendingUp, PieChart, List, DollarSign } from 'lucide-react';
import { todayKey } from '../utils/date';
import { getApiUrl } from '../utils/apiConfig';
import MoneyCharts from './MoneyCharts';
import CustomSelect from './CustomSelect';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
        setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...finalForm } : t));
        showToast('Transaction Updated', 'success');
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating transaction', 'error');
    }
  };

  return (
    <div className="money-tracker-grid" style={{ alignItems: 'flex-start', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '8px' }} className="hide-scrollbar">
        {/* Cashflow summary cards */}
        <div className="money-summary-cards" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '16px 18px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#d8f277' }} />
            <div style={{ font: "500 0.68rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', whiteSpace: 'nowrap' }}>
              Total Earned
            </div>
            <div style={{ font: "700 1.4rem 'DM Mono', monospace", color: '#d8f277', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
              {currency}{totalEarned.toFixed(2)}
            </div>
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '16px 18px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#ef6f3e' }} />
            <div style={{ font: "500 0.68rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', whiteSpace: 'nowrap' }}>
              Total Spent
            </div>
            <div style={{ font: "700 1.4rem 'DM Mono', monospace", color: '#ef6f3e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
              {currency}{totalSpent.toFixed(2)}
            </div>
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '16px 18px', background: 'var(--bg-card)', borderRadius: '6px', border: `1px solid ${netBalance >= 0 ? 'rgba(216, 242, 119, 0.3)' : 'rgba(239, 111, 62, 0.3)'}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: netBalance >= 0 ? '#d8f277' : '#ef6f3e' }} />
            <div style={{ font: "500 0.68rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', whiteSpace: 'nowrap' }}>
              Net Balance
            </div>
            <div style={{ font: "700 1.4rem 'DM Mono', monospace", color: netBalance >= 0 ? '#d8f277' : '#ef6f3e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
              {netBalance >= 0 ? '+' : ''}{currency}{netBalance.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
          <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.35rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Transactions</h3>
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
              style={{ width: '160px', borderRadius: '6px', border: '1px solid var(--border-color)', font: "500 0.8rem 'DM Mono', monospace" }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTransactions.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <DollarSign size={36} style={{ color: '#d8f277', opacity: 0.6 }} />
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>No transactions logged</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>No items logged yet. Click below to add your first entry.</p>
              <button
                onClick={() => {
                  setRightPanelView('add');
                  setShowForm?.(true);
                }}
                className="button button-primary"
                style={{ marginTop: '8px', padding: '10px 18px', fontSize: '0.82rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', font: "600 0.8rem 'DM Sans', sans-serif", background: 'var(--ink)', color: '#d8f277', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                <Plus size={15} /> Add Transaction
              </button>
            </div>
          ) : (
            filteredTransactions.map(item => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 18px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: '5px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 7px', background: 'var(--bg-main)', borderRadius: '4px', border: '1px solid var(--border-color)', font: "500 0.68rem 'DM Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase', color: item.type === 'earn' ? '#d8f277' : '#ef6f3e' }}>
                        {item.category || 'General'}
                      </span>
                      <span style={{ color: 'var(--border-color)' }}>•</span>
                      <span style={{ font: "400 0.75rem 'DM Mono', monospace" }}>{item.date}</span>
                    </div>
                    {item.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>{item.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <div style={{ font: "700 1.15rem 'DM Mono', monospace", color: item.type === 'earn' ? '#d8f277' : '#ef6f3e', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                      {item.type === 'earn' ? '+' : '-'}{currency}{Number(item.amount).toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirmId(item.id)} style={{ background: 'none', border: 'none', color: '#ef6f3e', cursor: 'pointer', padding: '3px', borderRadius: '4px' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Charts */}
      <div style={{ background: 'var(--bg-card)', padding: '22px', borderRadius: '6px', border: '1px solid var(--border-color)', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', position: 'sticky', top: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.15rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Financial Analytics</h4>
          </div>
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
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
                    padding: '8px 0', 
                    borderRadius: '6px', 
                    border: isActive ? '1px solid #d8f277' : '1px solid var(--border-color)', 
                    cursor: 'pointer', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? '#d8f277' : 'var(--bg-main)', 
                    color: isActive ? '#11110f' : 'var(--text-muted)', 
                    transition: 'all 0.2s',
                    font: "600 0.78rem 'DM Sans', sans-serif"
                  }}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>

          <div style={{ width: '100%', height: chartType === 'pie' ? 'auto' : '380px', minHeight: '380px' }}>
            <MoneyCharts transactions={filteredTransactions} chartType={chartType} currency={currency} />
          </div>
        </div>
      </div>
      
      {/* Modal: Add Transaction */}
      <Modal
        isOpen={rightPanelView === 'add'}
        onClose={() => { setRightPanelView('charts'); setShowForm?.(false); }}
        title="Record Transaction"
        icon={Plus}
        maxWidth="440px"
      >
        <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: "'DM Sans', sans-serif" }}>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Transaction Type</label>
            <CustomSelect 
              value={newType} 
              onChange={(e) => {
                const val = e.target.value;
                setNewType(val);
                setNewCategory(val === 'earn' ? 'Job' : 'General');
              }} 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', font: "500 0.85rem 'DM Mono', monospace" }}
              options={[
                { value: "spend", label: "Spending (-)" },
                { value: "earn", label: "Earning (+)" }
              ]}
            />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Description</label>
            <input type="text" placeholder="e.g. Groceries, Freelance Invoice..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Amount ({currency})</label>
            <input type="text" placeholder="e.g., 950+300 or 1250" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', font: "600 0.95rem 'DM Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(newType === 'earn' ? EARNING_CATEGORIES : SPEND_CATEGORIES).map(cat => {
                const isSelected = newCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      font: "500 0.75rem 'DM Mono', monospace",
                      letterSpacing: '0.03em',
                      border: isSelected ? '1px solid ' + (newType === 'earn' ? '#d8f277' : '#ef6f3e') : '1px solid var(--border-color)',
                      background: isSelected ? (newType === 'earn' ? '#d8f277' : '#ef6f3e') : 'var(--bg-main)',
                      color: isSelected ? (newType === 'earn' ? '#11110f' : '#ffffff') : 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
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
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Date</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', font: "500 0.85rem 'DM Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
            <input type="text" placeholder="Additional details..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" onClick={() => { setRightPanelView('charts'); setShowForm?.(false); }} className="secondary-btn" style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.85rem', font: "500 0.82rem 'DM Sans', sans-serif" }}>Cancel</button>
            <button type="submit" style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.85rem', font: "600 0.82rem 'DM Sans', sans-serif", background: '#d8f277', color: '#11110f', border: '1px solid #d8f277', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Plus size={16} /> Record Entry</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Transaction */}
      <Modal
        isOpen={editingId !== null}
        onClose={cancelEdit}
        title="Edit Transaction"
        icon={Edit2}
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: "'DM Sans', sans-serif" }}>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Type</label>
            <CustomSelect 
              value={editForm.type || 'spend'} 
              onChange={e => {
                const val = e.target.value;
                setEditForm({ ...editForm, type: val, category: val === 'earn' ? 'Job' : 'General' });
              }} 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', font: "500 0.85rem 'DM Mono', monospace" }}
              options={[
                { value: "spend", label: "Spending (-)" },
                { value: "earn", label: "Earning (+)" }
              ]}
            />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Description</label>
            <input type="text" placeholder="Enter description..." value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Amount ({currency})</label>
            <input type="text" placeholder="e.g., 950+300 or 1250" value={editForm.amount || ''} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', font: "600 0.95rem 'DM Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {((editForm.type || 'spend') === 'earn' ? EARNING_CATEGORIES : SPEND_CATEGORIES).map(cat => {
                const currentCat = editForm.category || ((editForm.type || 'spend') === 'earn' ? 'Job' : 'General');
                const isSelected = currentCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, category: cat })}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      font: "500 0.75rem 'DM Mono', monospace",
                      letterSpacing: '0.03em',
                      border: isSelected ? '1px solid ' + ((editForm.type || 'spend') === 'earn' ? '#d8f277' : '#ef6f3e') : '1px solid var(--border-color)',
                      background: isSelected ? ((editForm.type || 'spend') === 'earn' ? '#d8f277' : '#ef6f3e') : 'var(--bg-main)',
                      color: isSelected ? ((editForm.type || 'spend') === 'earn' ? '#11110f' : '#ffffff') : 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
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
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Date</label>
            <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', font: "500 0.85rem 'DM Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ font: "500 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
            <input type="text" placeholder="Enter notes..." value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button onClick={cancelEdit} className="secondary-btn" style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.85rem', font: "500 0.82rem 'DM Sans', sans-serif" }}>Cancel</button>
            <button onClick={() => saveEdit(editingId)} style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.85rem', font: "600 0.82rem 'DM Sans', sans-serif", background: '#d8f277', color: '#11110f', border: '1px solid #d8f277', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> Save Changes</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => {
          const id = deleteConfirmId;
          setDeleteConfirmId(null);
          if (id) deleteTransaction(id);
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
