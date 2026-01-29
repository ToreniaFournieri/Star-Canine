import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from './Game.jsx';
import './index.css';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error ? String(this.state.error) : 'Unknown error';
      return (
        <div style={{ color: '#22c55e', padding: '20px', fontFamily: 'monospace', backgroundColor: '#000', minHeight: '100vh' }}>
          <h1>Error Loading Game</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{errorMessage}</pre>
          {this.state.errorInfo && (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px', marginTop: '20px' }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Show loading indicator immediately
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<div style="color: #22c55e; padding: 20px; font-family: monospace;">Loading STAR CANINE...</div>';
}

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Game />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (e) {
  // Fallback if React fails to load
  if (rootElement) {
    rootElement.innerHTML = '<div style="color: #ff0000; padding: 20px; font-family: monospace;">Critical Error: ' + String(e) + '</div>';
  }
}
