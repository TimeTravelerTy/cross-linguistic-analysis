import React from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-[22px] border border-red-300/80 bg-red-50/80 p-6 text-sm text-red-900">
          <p className="mb-2 font-semibold">Render error — check the browser console for details.</p>
          <pre className="overflow-x-auto rounded bg-red-100 p-3 text-xs">{this.state.error.message}</pre>
          <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-3 text-xs opacity-70">{this.state.error.stack}</pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50"
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
