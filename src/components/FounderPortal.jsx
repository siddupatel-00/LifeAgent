import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Users, MessageSquare, TrendingUp, CheckCircle2, 
  XCircle, Trash2, Check, UserPlus, RefreshCw, LogOut, Search, 
  Sparkles, ArrowRight, Mail, Calendar, Eye, EyeOff, AlertCircle, Clock
} from 'lucide-react';
import { getApiUrl } from '../utils/apiUrl';
import { safeStorage } from '../utils/safeStorage';

export default function FounderPortal({ onNavigate, showToast }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return !!safeStorage.getItem('founder_session_token');
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'team', 'messages', 'growth'
  
  // Data state
  const [data, setData] = useState({
    totalUsers: 0,
    unreadCount: 0,
    messages: [],
    users: [],
    teamMembers: [],
    userTimeline: []
  });

  // Apply Form state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: '', email: '', role: 'founder', reason: '' });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  // User search query
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch founder data
  const fetchFounderData = async () => {
    const token = safeStorage.getItem('founder_session_token');
    const storedPasscode = safeStorage.getItem('founder_passcode') || '12345678';
    
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder'), {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-founder-passcode': storedPasscode
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIsUnlocked(true);
      } else {
        if (res.status === 401 || res.status === 403) {
          setIsUnlocked(false);
          safeStorage.removeItem('founder_session_token');
        }
      }
    } catch (err) {
      console.error('Failed to fetch founder telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchFounderData();
    }
  }, [isUnlocked]);

  // Handle Passcode Unlock
  const handleUnlock = async (e) => {
    e.preventDefault();
    setPasscodeError('');
    if (!passcode.trim()) {
      setPasscodeError('Please enter the founder passcode.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder_login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        safeStorage.setItem('founder_session_token', resData.token);
        safeStorage.setItem('founder_passcode', passcode.trim());
        setIsUnlocked(true);
        setPasscode('');
        showToast?.('👑 Master Founder Access Granted', 'success');
      } else {
        setPasscodeError(resData.error || 'Invalid passcode. Access denied.');
      }
    } catch (err) {
      setPasscodeError('Network error. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Lock / Logout
  const handleLock = () => {
    safeStorage.removeItem('founder_session_token');
    safeStorage.removeItem('founder_passcode');
    setIsUnlocked(false);
    showToast?.('Founder session locked.', 'info');
  };

  // Handle Apply for Access
  const handleApply = async (e) => {
    e.preventDefault();
    setApplyError('');
    setApplySuccess('');
    if (!applyForm.email.trim()) {
      setApplyError('Email address is required.');
      return;
    }

    setApplyLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder_apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyForm)
      });
      const resData = await res.json();
      if (res.ok) {
        setApplySuccess('Application submitted! The founder will review and approve your access.');
        setApplyForm({ name: '', email: '', role: 'founder', reason: '' });
      } else {
        setApplyError(resData.error || 'Failed to submit application.');
      }
    } catch (err) {
      setApplyError('Connection error. Please try again later.');
    } finally {
      setApplyLoading(false);
    }
  };

  // Approve / Revoke / Delete Member
  const handleMemberAction = async (memberId, action) => {
    const token = safeStorage.getItem('founder_session_token');
    const storedPasscode = safeStorage.getItem('founder_passcode') || '12345678';

    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-founder-passcode': storedPasscode
        },
        body: JSON.stringify({ subAction: action, id: memberId })
      });
      const resData = await res.json();
      if (res.ok) {
        showToast?.(resData.message || 'Updated member status', 'success');
        fetchFounderData();
      } else {
        showToast?.(resData.error || 'Failed to update member', 'error');
      }
    } catch (err) {
      showToast?.('Connection error', 'error');
    }
  };

  // Mark Read / Delete Visitor Message
  const handleMessageAction = async (msgId, action) => {
    const token = safeStorage.getItem('founder_session_token');
    const storedPasscode = safeStorage.getItem('founder_passcode') || '12345678';

    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-founder-passcode': storedPasscode
        },
        body: JSON.stringify({ subAction: action, id: msgId })
      });
      if (res.ok) {
        if (action === 'mark_read') {
          setData(prev => ({
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            messages: prev.messages.map(m => m.id === msgId ? { ...m, is_read: 1 } : m)
          }));
          showToast?.('Message marked as read', 'success');
        } else if (action === 'delete') {
          setData(prev => ({
            ...prev,
            messages: prev.messages.filter(m => m.id !== msgId)
          }));
          showToast?.('Message deleted', 'success');
        }
      }
    } catch (err) {
      showToast?.('Failed to update message', 'error');
    }
  };

  // Filtered Users
  const filteredUsers = (data.users || []).filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.handle && u.handle.toLowerCase().includes(q))
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LOCKED VIEW (Security Gate)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <main className="animate-entrance" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-main)' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '36px', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
          
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'rgba(216, 242, 119, 0.1)', border: '1px solid #d8f277', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={26} color="#d8f277" />
          </div>

          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: '8px' }}>
            <span className="eyebrow-dot" /> restricted area <span className="eyebrow-rule" /> system
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--text-main)', margin: '4px 0 8px' }}>
            Founder Command
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.5 }}>
            Private telemetry, user directories, and access management. Enter your master founder passcode to unlock.
          </p>

          {passcodeError && (
            <div style={{ background: 'rgba(239, 111, 62, 0.1)', border: '1px solid var(--orange)', color: 'var(--orange)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
              <AlertCircle size={16} /> {passcodeError}
            </div>
          )}

          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <input
                type="password"
                placeholder="Enter Passcode (e.g. 12345678)..."
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  fontFamily: "'DM Mono', monospace",
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="blue-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}
            >
              {loading ? 'Verifying Passcode...' : 'Unlock Founder Portal 🔐'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              style={{ background: 'none', border: 'none', color: '#d8f277', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <UserPlus size={14} /> Apply for Founder / Employee
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('landing', '/')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ← Back Home
            </button>
          </div>
        </div>

        {/* APPLY MODAL */}
        {showApplyModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
            <div className="animate-entrance" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', margin: 0, color: 'var(--text-main)' }}>
                  Apply for Access
                </h3>
                <button onClick={() => setShowApplyModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={20} /></button>
              </div>

              {applySuccess ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <CheckCircle2 size={44} color="#d8f277" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px' }}>{applySuccess}</p>
                  <button onClick={() => { setShowApplyModal(false); setApplySuccess(''); }} className="secondary-btn" style={{ width: '100%', padding: '10px' }}>Done</button>
                </div>
              ) : (
                <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {applyError && (
                    <div style={{ color: 'var(--orange)', fontSize: '0.82rem' }}>{applyError}</div>
                  )}
                  <div>
                    <label className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="Your name..."
                      value={applyForm.name}
                      onChange={e => setApplyForm({ ...applyForm, name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={applyForm.email}
                      onChange={e => setApplyForm({ ...applyForm, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>Role / Reason</label>
                    <input
                      type="text"
                      placeholder="Co-founder, Engineer, Marketing..."
                      value={applyForm.reason}
                      onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <button type="submit" disabled={applyLoading} className="blue-btn" style={{ width: '100%', padding: '10px', marginTop: '6px', justifyContent: 'center' }}>
                    {applyLoading ? 'Submitting...' : 'Submit Application 🚀'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. UNLOCKED FOUNDER COMMAND CENTER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className="animate-entrance" style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '24px 20px 80px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* TOP HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span className="wordmark-mark" style={{ width: '32px', height: '32px', fontSize: '1.1rem' }}>L</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Founder Command Center
            </h1>
            <span style={{ background: 'rgba(216, 242, 119, 0.15)', color: '#d8f277', border: '1px solid #d8f277', padding: '2px 8px', borderRadius: '4px', font: "700 0.68rem 'DM Mono', monospace", textTransform: 'uppercase' }}>
              👑 Master Owner
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Live platform telemetry, user database, visitor inquiries, and team member role permissions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchFounderData}
            disabled={loading}
            className="secondary-btn"
            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
          </button>
          <button
            onClick={() => onNavigate?.('landing', '/')}
            className="secondary-btn"
            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
          >
            Storefront
          </button>
          <button
            onClick={handleLock}
            className="secondary-btn"
            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Lock Session
          </button>
        </div>
      </div>

      {/* METRIC HIGHLIGHT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '8px' }}>
            Total Registered Users <Users size={16} color="#d8f277" />
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {data.totalUsers || data.users?.length || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Accounts in Turso database
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '8px' }}>
            Team & Founders <ShieldCheck size={16} color="var(--accent-blue)" />
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {data.teamMembers?.filter(m => m.status === 'active').length || 1}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data.teamMembers?.filter(m => m.status === 'pending').length || 0} pending applications
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '8px' }}>
            Visitor Messages <MessageSquare size={16} color="#ef6f3e" />
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {data.messages?.length || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: data.unreadCount > 0 ? '#ef6f3e' : 'var(--text-muted)', marginTop: '4px', fontWeight: data.unreadCount > 0 ? 600 : 400 }}>
            {data.unreadCount || 0} unread direct notes
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '22px', paddingBottom: '2px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #d8f277' : '2px solid transparent',
            color: activeTab === 'users' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> Registered Users ({data.users?.length || data.totalUsers || 0})
        </button>

        <button
          onClick={() => setActiveTab('team')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'team' ? '2px solid #d8f277' : '2px solid transparent',
            color: activeTab === 'team' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldCheck size={16} /> Team & Approvals ({data.teamMembers?.length || 0})
          {data.teamMembers?.some(m => m.status === 'pending') && (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef6f3e' }}></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'messages' ? '2px solid #d8f277' : '2px solid transparent',
            color: activeTab === 'messages' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquare size={16} /> Visitor Notes ({data.messages?.length || 0})
          {data.unreadCount > 0 && (
            <span style={{ background: '#ef6f3e', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
              {data.unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('growth')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'growth' ? '2px solid #d8f277' : '2px solid transparent',
            color: activeTab === 'growth' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingUp size={16} /> Growth Telemetry
        </button>
      </div>

      {/* TAB 1: REGISTERED USERS DIRECTORY */}
      {activeTab === 'users' && (
        <section className="animate-entrance">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by name, email, or handle..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', font: "500 0.8rem 'DM Mono', monospace" }}>
              Showing {filteredUsers.length} of {data.users?.length || data.totalUsers} users
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', font: "700 0.75rem 'DM Mono', monospace", textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>User ID</th>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Email Address</th>
                  <th style={{ padding: '12px 16px' }}>Handle</th>
                  <th style={{ padding: '12px 16px' }}>AI Name</th>
                  <th style={{ padding: '12px 16px' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No registered users match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.id || idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        #{u.id}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {u.name || 'Anonymous User'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontFamily: "'DM Mono', monospace", fontSize: '0.84rem' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#d8f277', fontFamily: "'DM Mono', monospace", fontSize: '0.84rem' }}>
                        {u.handle ? (u.handle.startsWith('@') ? u.handle : `@${u.handle}`) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {u.ai_name || 'AI'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: "'DM Mono', monospace" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: TEAM & FOUNDER ACCESS APPROVALS */}
      {activeTab === 'team' && (
        <section className="animate-entrance">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: '0 0 8px', color: 'var(--text-main)' }}>
              Founder & Employee Access Management
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '0 0 20px' }}>
              Users who applied for founder or employee roles appear here. As Master Owner, you can grant or revoke access instantly.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', font: "700 0.75rem 'DM Mono', monospace", textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Applicant</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Role / Reason</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data.teamMembers || data.teamMembers.length === 0) ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No pending or active founder applications yet. Users can apply at <code>/founder</code>.
                      </td>
                    </tr>
                  ) : (
                    data.teamMembers.map(member => (
                      <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {member.name || 'Team Applicant'}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: '0.84rem' }}>
                          {member.email}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {member.role || 'Founder'} {member.reason ? `• "${member.reason}"` : ''}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontFamily: "'DM Mono', monospace",
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            background: member.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : (member.status === 'revoked' ? 'rgba(239, 111, 62, 0.15)' : 'rgba(234, 179, 8, 0.15)'),
                            color: member.status === 'active' ? '#22c55e' : (member.status === 'revoked' ? '#ef6f3e' : '#eab308'),
                            border: `1px solid ${member.status === 'active' ? '#22c55e' : (member.status === 'revoked' ? '#ef6f3e' : '#eab308')}`
                          }}>
                            {member.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {member.status !== 'active' && (
                              <button
                                onClick={() => handleMemberAction(member.id, 'approve_member')}
                                className="blue-btn"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
                                title="Approve & Grant Access"
                              >
                                <Check size={12} /> Approve
                              </button>
                            )}
                            {member.status === 'active' && (
                              <button
                                onClick={() => handleMemberAction(member.id, 'revoke_member')}
                                className="secondary-btn"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', color: '#ef6f3e' }}
                                title="Revoke Access"
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              onClick={() => handleMemberAction(member.id, 'delete_member')}
                              className="secondary-btn"
                              style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '4px', color: 'var(--text-muted)' }}
                              title="Delete Application"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: VISITOR MESSAGES INBOX */}
      {activeTab === 'messages' && (
        <section className="animate-entrance">
          {(!data.messages || data.messages.length === 0) ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.92rem' }}>No visitor messages received yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    background: msg.is_read ? 'var(--bg-card)' : 'rgba(216, 242, 119, 0.04)',
                    border: msg.is_read ? '1px solid var(--border-color)' : '1px solid #d8f277',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {msg.name || 'Anonymous Visitor'}
                        </span>
                        {msg.email && (
                          <a href={`mailto:${msg.email}`} style={{ color: 'var(--accent-blue)', fontSize: '0.82rem', fontFamily: "'DM Mono', monospace", textDecoration: 'none' }}>
                            {msg.email}
                          </a>
                        )}
                        {!msg.is_read && (
                          <span style={{ background: '#d8f277', color: '#12140a', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", marginTop: '2px' }}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Recent'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!msg.is_read && (
                        <button
                          onClick={() => handleMessageAction(msg.id, 'mark_read')}
                          className="secondary-btn"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleMessageAction(msg.id, 'delete')}
                        className="secondary-btn"
                        style={{ padding: '5px 8px', fontSize: '0.75rem', borderRadius: '4px', color: '#ef6f3e' }}
                        title="Delete Message"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: GROWTH TELEMETRY */}
      {activeTab === 'growth' && (
        <section className="animate-entrance">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: '0 0 8px', color: 'var(--text-main)' }}>
              30-Day Registration Timeline
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '0 0 24px' }}>
              Daily account signup velocity across the platform.
            </p>

            {(!data.userTimeline || data.userTimeline.length === 0) ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No telemetry points recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.userTimeline.map(item => (
                  <div key={item.date} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: 'var(--text-muted)', width: '100px' }}>
                      {item.date}
                    </span>
                    <div style={{ flex: 1, background: 'var(--bg-main)', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, item.count * 15)}%`, background: '#d8f277', borderRadius: '7px' }} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', width: '60px', textAlign: 'right' }}>
                      +{item.count} users
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
