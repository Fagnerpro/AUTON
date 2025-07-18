import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Erro capturado pelo ErrorBoundary:', error, errorInfo);
    
    // Específico para erros DOM de removeChild/insertBefore
    if (error.message?.includes('removeChild') || error.message?.includes('insertBefore')) {
      console.warn('⚠️ Erro DOM detectado - provavelmente relacionado a Portal/Radix UI');
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="text-sm text-red-600">
            Erro ao carregar componente. Tente recarregar a página.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;