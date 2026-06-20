import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '../../shared/utils/logger';
import * as Sentry from "@sentry/react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error:', error, errorInfo);
    Sentry.captureException(error, { extra: errorInfo as Record<string, unknown> });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
          <div className="bg-white rounded-[32px] p-12 max-w-lg w-full text-center shadow-2xl border border-slate-100">
            <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-error/20">
              <AlertTriangle className="w-12 h-12 text-error" />
            </div>
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-4 tracking-tight">Something went wrong</h2>
            <p className="text-slate-600 font-medium text-lg mb-8">We're sorry, an unexpected error occurred. Our team has been notified.</p>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-800 shadow-md transition-colors text-base"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="w-full bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors text-base"
              >
                Go to Homepage
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto border border-slate-200">
                <p className="text-error font-bold mb-2 text-sm">Error Details (Dev Only):</p>
                <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">{this.state.error.message}</pre>
                <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap mt-2">{this.state.error.stack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
