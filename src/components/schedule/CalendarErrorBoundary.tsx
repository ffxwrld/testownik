import { Component, ErrorInfo, ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class CalendarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Calendar Error caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-3xl text-center my-8 backdrop-blur-md">
          <WarningCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Nie udało się wyświetlić harmonogramu</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-4">
            {this.state.error || 'Wystąpił problem z formatowaniem dat.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl text-xs transition active:scale-95 shadow-sm"
          >
            Odśwież kalendarz
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
