import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    this.setState({ hasError: true, error });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>
            Erro no Componente
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
            Ocorreu um erro inesperado. Recarregue a página para tentar novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}