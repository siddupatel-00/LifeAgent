import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { subscribeSyncStatus } from '../db/syncEngine';

export default function SyncStatusIndicator() {
  const [status, setStatus] = useState('Synced');

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const getStatusDetails = () => {
    switch (status) {
      case 'Offline':
        return {
          icon: <WifiOff size={13} />,
          text: 'Offline',
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)'
        };
      case 'Syncing':
        return {
          icon: <RefreshCw size={13} className="spin-animation" />,
          text: 'Syncing',
          bg: 'rgba(59, 130, 246, 0.15)',
          color: 'var(--accent-blue)',
          border: 'rgba(59, 130, 246, 0.3)'
        };
      case 'Pending Sync':
        return {
          icon: <Clock size={13} />,
          text: 'Pending Sync',
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.3)'
        };
      case 'Synced':
      default:
        return {
          icon: <CheckCircle2 size={13} />,
          text: 'Synced',
          bg: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          border: 'rgba(34, 197, 94, 0.3)'
        };
    }
  };

  const config = getStatusDetails();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '20px',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontSize: '0.78rem',
        fontWeight: 700,
        transition: 'all 0.3s ease',
        userSelect: 'none'
      }}
      title={`Database Sync Status: ${status}`}
    >
      {config.icon}
      <span>{config.text}</span>

      <style>{`
        .spin-animation {
          animation: syncSpin 1.2s linear infinite;
        }
        @keyframes syncSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
