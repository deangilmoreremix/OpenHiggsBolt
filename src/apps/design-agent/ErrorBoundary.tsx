'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches rendering errors in the design-agent canvas
 * and chat UI. Shows a recovery UI instead of crashing the whole page.
 */
export default class DesignAgentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DesignAgent] Unhandled error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="h-full w-full flex items-center justify-center bg-bg-page text-primary-text">
          <div className="max-w-md p-6 rounded-xl border border-divider bg-bg-card text-center space-y-4">
            <div className="text-4xl">🎨</div>
            <h2 className="text-lg font-bold">Something went wrong</h2>
            <p className="text-sm text-secondary-text">
              The design agent encountered an unexpected error. Your work is preserved in the session.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:brightness-110 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
