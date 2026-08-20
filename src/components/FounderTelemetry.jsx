import React, { useState, useEffect } from 'react';
import { Mail, Users, Calendar, Trash2, CheckCircle2, RefreshCw, MessageSquare, Clock } from 'lucide-react';
import { getApiUrl } from '../utils/apiConfig';

export default function FounderTelemetry({ token, showToast }) {
  const [data, setData] = useState({
    totalUsers: 0,
    unreadCount: 0,
    messages: [],
    userTimeline: []
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread'

  const fetchFounderData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch founder telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFounderData();
  }, [token]);

  const handleMarkRead = async (msgId) => {
    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subAction: 'mark_read', id: msgId })
      });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1),
          messages: prev.messages.map(m => m.id === msgId ? { ...m, is_read: 1 } : m)
        }));
        showToast?.('Message marked as read', 'success');
      }
    } catch (err) {
      showToast?.('Failed to update message', 'error');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await fetch(getApiUrl('/api/auth?action=founder'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subAction: 'delete', id: msgId })
      });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          messages: prev.messages.filter(m => m.id !== msgId)
        }));
        showToast?.('Message deleted', 'success');
      }
    } catch (err) {
      showToast?.('Failed to delete message', 'error');
    }
  };

  const filteredMessages = data.messages.filter(m => {
    if (activeFilter === 'unread') return !m.is_read;
    return true;
  });

  return (
    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            <MessageSquare size={18} color="#d8f277" /> Founder Inbox & Platform Telemetry
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
            Live messages from landing page visitors and registered users usage timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchFounderData}
          disabled={loading}
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            font: "500 0.78rem 'DM Mono', monospace",
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={13} className={loading ? 'spin-animation' : ''} /> Refresh
        </button>
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.76rem', font: "500 0.76rem 'DM Mono', monospace", textTransform: 'uppercase' }}>
            <Users size={14} color="#d8f277" /> Total Users
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "Fraunces, Georgia, serif", marginTop: '6px', color: 'var(--text-main)' }}>
            {data.totalUsers}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>Registered platform accounts</div>
        </div>

        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.76rem', font: "500 0.76rem 'DM Mono', monospace", textTransform: 'uppercase' }}>
            <Mail size={14} color="#ef6f3e" /> Total Messages
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "Fraunces, Georgia, serif", marginTop: '6px', color: 'var(--text-main)' }}>
            {data.messages.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>From landing page visitors</div>
        </div>

        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.76rem', font: "500 0.76rem 'DM Mono', monospace", textTransform: 'uppercase' }}>
            <Clock size={14} color="#f59e0b" /> Unread Messages
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "Fraunces, Georgia, serif", marginTop: '6px', color: data.unreadCount > 0 ? '#ef6f3e' : '#78a354' }}>
            {data.unreadCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>Awaiting review</div>
        </div>
      </div>

      {/* USER SIGNUP TIMELINE */}
      {data.userTimeline && data.userTimeline.length > 0 && (
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ font: "500 0.8rem 'DM Mono', monospace", color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#d8f277" /> USER SIGNUP TIMELINE (LAST 30 DAYS)
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
            {data.userTimeline.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'var(--bg-card)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem'
                }}
              >
                <span style={{ font: "500 0.76rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>{item.date}</span>
                <span style={{ font: "600 0.8rem 'DM Mono', monospace", color: '#d8f277' }}>+{item.count} users</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISITOR MESSAGES INBOX */}
      <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ font: "500 0.82rem 'DM Mono', monospace", color: 'var(--text-main)' }}>
            📬 VISITOR MESSAGES ({filteredMessages.length})
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                background: activeFilter === 'all' ? 'var(--ink)' : 'transparent',
                color: activeFilter === 'all' ? '#d8f277' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                font: "500 0.74rem 'DM Mono', monospace",
                cursor: 'pointer'
              }}
            >
              All ({data.messages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              style={{
                background: activeFilter === 'unread' ? 'rgba(239, 111, 62, 0.15)' : 'transparent',
                color: activeFilter === 'unread' ? '#ef6f3e' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                font: "500 0.74rem 'DM Mono', monospace",
                cursor: 'pointer'
              }}
            >
              Unread ({data.unreadCount})
            </button>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            No visitor messages found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  background: msg.is_read ? 'var(--bg-card)' : 'rgba(216, 242, 119, 0.05)',
                  border: `1px solid ${msg.is_read ? 'var(--border-color)' : 'rgba(216, 242, 119, 0.4)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {msg.name || 'Anonymous Visitor'}
                    </span>
                    {msg.email && (
                      <a
                        href={`mailto:${msg.email}`}
                        style={{ font: "500 0.75rem 'DM Mono', monospace", color: '#d8f277', textDecoration: 'none' }}
                      >
                        {msg.email}
                      </a>
                    )}
                    {!msg.is_read && (
                      <span style={{ font: "500 0.65rem 'DM Mono', monospace", background: '#ef6f3e', color: '#fff', padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ font: "400 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
                      {msg.created_at || 'Recently'}
                    </span>
                    {!msg.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(msg.id)}
                        style={{ background: 'none', border: 'none', color: '#78a354', cursor: 'pointer', padding: '2px' }}
                        title="Mark as read"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      style={{ background: 'none', border: 'none', color: '#ef6f3e', cursor: 'pointer', padding: '2px', opacity: 0.8 }}
                      title="Delete message"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.86rem', lineHeight: '1.5', color: 'var(--text-main)', whiteSpace: 'pre-wrap', background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
