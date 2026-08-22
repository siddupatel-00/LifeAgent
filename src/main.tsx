import { safeStorage } from './utils/safeStorage';
import React, { Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Global Error:', error, errorInfo);
  }

  handleReload = () => {
    try { safeStorage.clear(); } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0c10',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 99999,
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600' }}>Something went wrong</h2>
          <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px', maxWidth: '300px' }}>
            The app encountered an unexpected error. Tap below to reload cleanly.
          </p>
          {this.state.error && (
            <div style={{ background: '#220000', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', maxWidth: '90%', wordWrap: 'break-word', textAlign: 'left' }}>
              <strong>Error:</strong> {this.state.error.toString()}
            </div>
          )}
          <button 
            onClick={this.handleReload}
            style={{
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Always unregister old service workers and clear stale caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let reg of registrations) {
      reg.unregister();
    }
  }).catch(() => {});
  if (!window.Capacitor && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
)