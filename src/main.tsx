import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

class GlobalErrorBoundary extends Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null } as any;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Global Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if ((this.state as any).hasError) {
      const error = (this.state as any).error;
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111310',
          color: '#f4f2ea',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          zIndex: 99999,
          padding: '20px',
          textAlign: 'center',
        }}>
          <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600' }}>Something went wrong</h2>
          <p style={{ color: '#8e9185', marginBottom: '24px', fontSize: '14px', maxWidth: '300px' }}>
            The app encountered an unexpected error. Reload to continue.
          </p>
          {error && (
            <div style={{ background: '#2a1410', color: '#ef6f3e', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', maxWidth: '90%', wordBreak: 'break-word', textAlign: 'left' }}>
              {String(error?.message || error)}
            </div>
          )}
          <button
            onClick={this.handleReload}
            style={{
              background: '#d8f277',
              color: '#11110f',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return (this.props as any).children;
  }
}

// Keep any previously-registered service workers from serving stale assets.
if ('serviceWorker' in navigator && !window.Capacitor) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      for (const reg of registrations) reg.unregister();
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
