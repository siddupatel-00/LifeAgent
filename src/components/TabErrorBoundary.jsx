import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[TabErrorBoundary] Error in tab "${this.props.tabName || 'Unknown'}":`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="glass-card animate-entrance" 
          style={{ 
            padding: '36px 24px', 
            textAlign: 'center', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '20px',
            margin: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px'
          }}>
            <AlertCircle size={28} />
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Unable to load {this.props.tabName || 'Tab'}
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: 0, lineHeight: '1.5' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this tab view.'}
          </p>

          <button 
            className="blue-btn" 
            onClick={this.handleReset}
            style={{ 
              padding: '10px 22px', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: '30px'
            }}
          >
            <RotateCcw size={16} /> Try Reloading Tab
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
