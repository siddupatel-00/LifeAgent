import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { registerModal, unregisterModal, updateModalCallback } from './modalManager';

export default function ConfirmModal({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  type = 'danger',
  zIndex = 1000000
}) {
  const modalIdRef = useRef(null);
  if (!modalIdRef.current) {
    modalIdRef.current = 'confirm_modal_' + Math.random().toString(36).substr(2, 9);
  }

  useEffect(() => {
    if (!isOpen) return;

    const id = modalIdRef.current;
    registerModal(id, onCancel);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unregisterModal(id);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel?.();
    }
  };

  const content = (
    <div 
      className="blur-overlay" 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="glass-card animate-entrance" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '28px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          margin: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: type === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: type === 'danger' ? '#ef4444' : '#f59e0b',
              flexShrink: 0
            }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h3>
          </div>
          <button 
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: '0 0 24px 0', fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: type === 'danger' ? '#ef4444' : 'var(--accent-blue)',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: type === 'danger' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
