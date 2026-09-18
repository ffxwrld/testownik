import { Component, ErrorInfo, ReactNode } from 'react';
import { WarningCircle, ArrowsClockwise, House } from '@phosphor-icons/react';
import i18n from '../../i18n/config';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[GlobalErrorBoundary] Przechwycono nieobsłużony błąd:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    try {
      localStorage.removeItem('testownik_multiplayer_session');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-md p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-5">
              <WarningCircle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold mb-2">
              {i18n.t('common.errorBoundary.title', 'Coś poszło nie tak')}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              {i18n.t('common.errorBoundary.desc', 'Wystąpił nieoczekiwany błąd podczas wyświetlania widoku. Twoje zapisane dane są bezpieczne.')}
            </p>

            {this.state.error?.message && (
              <div className="w-full p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl mb-6 text-left overflow-auto max-h-24">
                <p className="font-mono text-[11px] text-red-600 dark:text-red-400 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="w-full flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-primary-500/20"
              >
                <ArrowsClockwise className="w-4 h-4" />
                <span>{i18n.t('common.errorBoundary.reload', 'Odśwież stronę')}</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <House className="w-4 h-4" />
                <span>{i18n.t('common.errorBoundary.home', 'Menu główne')}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
