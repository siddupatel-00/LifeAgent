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
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: 'var(--shadow-lg)',
          margin: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: type === 'danger' ? 'rgba(239, 111, 62, 0.15)' : 'var(--accent-blue-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: type === 'danger' ? 'var(--orange)' : 'var(--text-main)',
              flexShrink: 0
            }}>
              <AlertTriangle size={16} />
            </div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-main)' }}>{title}</h3>
          </div>
          <button 
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            className="secondary-btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: type === 'danger' ? 'var(--orange)' : 'var(--accent-blue)',
              color: type === 'danger' ? '#ffffff' : 'var(--accent-text)',
              font: "600 0.85rem 'DM Sans', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.15s ease'
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
