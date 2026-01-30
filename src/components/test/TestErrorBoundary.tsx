"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

export class TestErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-xl font-semibold text-error">Something went wrong</p>
          <p className="text-sm text-muted">This test encountered an unexpected error.</p>
          <button
            onClick={this.handleRetry}
            className="rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
