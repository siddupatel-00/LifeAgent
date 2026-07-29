import React, { useState } from 'react';
import { Plus, Flame, CheckCircle2, MoreVertical, Trash2, X } from 'lucide-react';
import Modal from './Modal';

export default function HabitsPanel({
  habits, setHabits, todayItems, setTodayItems,
  isAddHabitModalOpen, setIsAddHabitModalOpen,
  newHabitData, setNewHabitData,
  token, showToast
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);

  const handleUpdateHabitDb = async (id, streak, checked_today, paused_until) => {
    if (!token || !id) return;
    try {
      await fetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, streak, checked_today, paused_until })
      });
    } catch(e) {}
  };

  const handleToggleHabitItem = (targetHabitId) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== targetHabitId) return h;
      const nextChecked = !h.checkedToday;
      const newStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
      
      // Sync the linked today item
      setTodayItems(prevToday => prevToday.map(ti => {
        if (ti.habitId !== targetHabitId) return ti;
        fetch('/api/today', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id: ti.id, checked: nextChecked })
        }).catch(() => {});
        return { ...ti, checked: nextChecked };
      }));

      handleUpdateHabitDb(h.id, newStreak, nextChecked, h.pausedUntil);
      return { ...h, checkedToday: nextChecked, streak: newStreak };
    }));
  };

  const handleDeleteHabitDb = async (id) => {
    if (!token) return;
    try {
      await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      setHabits(prev => prev.filter(h => h.id !== id));
      setTodayItems(prev => prev.filter(ti => ti.habitId !== id));
      showToast('Habit Deleted', 'success');
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };
  
  React.useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="animate-entrance" onClick={() => setMenuOpenId(null)}>
      {habits.length === 0 ? (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <Flame size={48} color="var(--accent-blue)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Build Daily Pillars</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Track foundational habits that shape your life</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
            <input 
              type="text" placeholder="Enter habit name..."
              value={newHabitData.title}
              onChange={e => setNewHabitData({...newHabitData, title: e.target.value})}
              className="glass-input" 
            />
            <input 
              type="text" placeholder="Enter category..."
              value={newHabitData.category}
              onChange={e => setNewHabitData({...newHabitData, category: e.target.value})}
              className="glass-input" 
            />
            <input 
              type="text" placeholder="Enter daily goal..."
              value={newHabitData.target}
              onChange={e => setNewHabitData({...newHabitData, target: e.target.value})}
              className="glass-input" 
            />
            <button 
              className="primary-btn"
              onClick={async () => {
                if (!newHabitData.title || !token) return;
                try {
                  const res = await fetch('/api/habits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ label: newHabitData.title, category: newHabitData.category, target: newHabitData.target })
                  });
                  if (res.ok) {
                    const saved = await res.json();
                    const newItem = {
                      id: saved.id, title: saved.label, category: saved.category,
                      target: saved.target, checkedToday: false, streak: 0,
                      completionRate: 0, history: [0,0,0,0,0,0,0]
                    };
                    setHabits([newItem, ...habits]);
                    setNewHabitData({ title: '', category: '', target: '' });
                    showToast('Habit Added', 'success');
                  }
                } catch (e) {}
              }}
              style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 800, marginTop: '8px' }}
            >
              Start Tracking
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {habits.map(h => (
            <div key={h.id} className="motion-card" style={{
              background: h.checkedToday ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
              padding: '22px', borderRadius: '16px',
              border: `1px solid ${h.checkedToday ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              display: 'flex', flexDirection: 'column', position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="pill-tag" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', fontWeight: 700 }}>
                  {h.category} Pillar
                </span>
                <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={16} /> {h.streak} Day Streak
                </span>
              </div>
              
              <div style={{ position: 'absolute', top: '12px', right: '12px' }} onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => setMenuOpenId(menuOpenId === h.id ? null : h.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <MoreVertical size={20} />
                </button>
                {menuOpenId === h.id && (
                  <div className="dot-menu" style={{
                    position: 'absolute', top: '24px', right: '0', background: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: '120px'
                  }}>
                    <button 
                      onClick={() => { handleDeleteHabitDb(h.id); setMenuOpenId(null); }}
                      style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--danger-color, #ef4444)' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <h5 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '16px', textDecoration: h.checkedToday ? 'line-through' : 'none' }}>{h.title}</h5>
              
              <button
                onClick={() => handleToggleHabitItem(h.id)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  border: `1px solid ${h.checkedToday ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                  background: h.checkedToday ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: h.checkedToday ? '#fff' : 'var(--text-main)',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto'
                }}
              >
                <CheckCircle2 size={18} color={h.checkedToday ? "#fff" : "var(--accent-blue)"} />
                {h.checkedToday ? "Completed" : "Check-In"}
              </button>
            </div>
          ))}
        </div>
      )}

      {habits.length > 0 && (
        <button
          className="habits-fab"
          onClick={() => setIsAddHabitModalOpen(true)}
          style={{
            position: 'fixed', bottom: '32px', right: '32px',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--accent-blue)', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            zIndex: 900, transition: 'transform 0.2s'
          }}
        >
          <Plus size={24} />
        </button>
      )}

      <Modal
        isOpen={isAddHabitModalOpen && habits.length > 0}
        onClose={() => setIsAddHabitModalOpen(false)}
        title="Add New Habit"
        icon={Plus}
        maxWidth="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Habit Name</label>
            <input 
              type="text" placeholder="Enter habit name..."
              value={newHabitData.title}
              onChange={e => setNewHabitData({...newHabitData, title: e.target.value})}
              className="glass-input" 
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Category</label>
            <input 
              type="text" placeholder="Enter category..."
              value={newHabitData.category}
              onChange={e => setNewHabitData({...newHabitData, category: e.target.value})}
              className="glass-input" 
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Daily Goal</label>
            <input 
              type="text" placeholder="Enter daily goal..."
              value={newHabitData.target}
              onChange={e => setNewHabitData({...newHabitData, target: e.target.value})}
              className="glass-input" 
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              className="secondary-btn"
              onClick={() => setIsAddHabitModalOpen(false)}
              style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              Cancel
            </button>
            <button 
              className="primary-btn"
              onClick={async () => {
                if (!newHabitData.title || !token) return;
                try {
                  const res = await fetch('/api/habits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ label: newHabitData.title, category: newHabitData.category, target: newHabitData.target })
                  });
                  if (res.ok) {
                    const saved = await res.json();
                    const newItem = {
                      id: saved.id, title: saved.label, category: saved.category,
                      target: saved.target, checkedToday: false, streak: 0,
                      completionRate: 0, history: [0,0,0,0,0,0,0]
                    };
                    setHabits([newItem, ...habits]);
                    setNewHabitData({ title: '', category: '', target: '' });
                    setIsAddHabitModalOpen(false);
                    showToast('Habit Added', 'success');
                  }
                } catch (e) {}
              }}
              style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              Save Habit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
