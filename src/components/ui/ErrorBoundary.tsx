import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { db } from '../../db';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GreenField UI Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetData = async () => {
    try {
      await db.delete();
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset DB:', err);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAF9] dark:bg-[#090D0F] text-slate-900 dark:text-white">
          <div className="max-w-md w-full glass-card p-6 rounded-3xl shadow-modal text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Récupération du Système GreenField
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Une exception d'exécution est survenue lors de l'initialisation des données locales.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-left text-red-600 dark:text-red-400 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Recharger l'Application
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleResetData}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
              >
                Réinitialiser la Base Locale
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

