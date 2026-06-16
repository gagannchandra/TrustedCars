import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

/**
 * Catches uncaught render errors anywhere in the tree and shows a recoverable
 * fallback UI instead of a blank white screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Unexpected error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, forward this to Sentry / LogRocket / your log pipeline.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("Unhandled UI error:", error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-50 text-3xl">
          ⚠️
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          We hit an unexpected snag while rendering this page. Your data is safe —
          try reloading, or head back to the homepage.
        </p>
        {import.meta.env.DEV && this.state.message && (
          <pre className="mt-4 max-w-md overflow-auto rounded-md bg-slate-900 p-3 text-left text-xs text-red-300">
            {this.state.message}
          </pre>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={this.handleReset}
            className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Try again
          </button>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Go home
          </button>
        </div>
        <button
          onClick={this.handleReload}
          className="mt-4 text-xs font-medium text-slate-500 underline hover:text-slate-700"
        >
          Reload page
        </button>
      </div>
    );
  }
}
