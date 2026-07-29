import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { registerModal, unregisterModal, updateModalCallback } from './modalManager';

export default function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = '440px',
  zIndex = 999999
}) {
  const modalIdRef = useRef(null);
  if (!modalIdRef.current) {
    modalIdRef.current = 'modal_' + Math.random().toString(36).substr(2, 9);
  }

  useEffect(() => {
    if (!isOpen) return;

    const id = modalIdRef.current;
    registerModal(id, onClose);

    return () => {
      unregisterModal(id);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateModalCallback(modalIdRef.current, onClose);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const modalContent = (
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
          padding: '28px',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          width: '90%',
          maxWidth: maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {Icon && (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'var(--accent-blue-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0
                }}
              >
                <Icon size={20} />
              </div>
            )}
            {title && (
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-main)'
                }}
              >
                {title}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px'
            }}
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
