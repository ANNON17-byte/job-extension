import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopupApp } from './App';
import '../index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ApplyMate popup crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: '380px', padding: '20px', background: '#020617', color: '#f8fafc', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <strong style={{ fontSize: '14px' }}>ApplyMate Assistant</strong>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
            An unexpected error occurred loading this page context. Click below to open your full dashboard:
          </p>
          <button
            onClick={() => {
              const url = chrome.runtime.getURL('dashboard.html');
              chrome.tabs.create({ url });
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Open ApplyMate Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PopupApp />
    </ErrorBoundary>
  </React.StrictMode>
);
