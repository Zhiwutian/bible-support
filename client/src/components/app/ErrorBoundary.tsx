import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, EmptyState } from '@/components/ui';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * Catch uncaught render/runtime errors and show a safe fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Keep console output in development for easier debugging.
    if (import.meta.env.DEV) {
      console.error('Unhandled frontend error', error, errorInfo);
    }
  }

  private readonly handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto min-h-screen w-full max-w-3xl bg-slate-50 px-6 py-10 text-slate-900">
          <EmptyState
            title="Something went wrong"
            description="A runtime error occurred while rendering this page."
            actions={<Button onClick={this.handleReset}>Try again</Button>}
          />
        </main>
      );
    }

    return this.props.children;
  }
}
