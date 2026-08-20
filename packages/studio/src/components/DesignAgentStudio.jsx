'use client';

import React, { useState, useEffect, memo } from 'react';
import { CreativeCanvas } from 'design-agent';
import { getUserBalance } from '../muapi';

// Simple error boundary base class
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[DesignAgentStudio] Unhandled error', { error: error?.message || error, stack: errorInfo?.componentStack });
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
}

class CreativeCanvasErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-black text-white">
          <div className="max-w-md p-6 rounded-xl border border-white/10 bg-white/5 text-center space-y-4">
            <div className="text-4xl">🎨</div>
            <h2 className="text-lg font-bold">Canvas Error</h2>
            <p className="text-sm text-white/60">
              The design canvas encountered an unexpected error. Your session data is preserved.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-all"
            >
              Reload Canvas
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DesignAgentStudio({ apiKey, isHeaderVisible, onToggleHeader }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    sessionStorage.setItem("fromDesignAgent", "true");
    if (!apiKey) return;
    localStorage.setItem("token", apiKey);
    
    const fetchUser = async () => {
      try {
        const data = await getUserBalance(apiKey);
        setUserData({
          username: data.email?.split('@')[0] || 'Studio User',
          email: data.email,
          balance: data.balance || 0
        });
      } catch (err) {
        console.error('Failed to fetch user data for Design Agent', { error: err?.message || err });
      }
    };

    fetchUser();
  }, [apiKey]);

  return (
    <CreativeCanvasErrorBoundary>
      <div className="h-full w-full bg-black overflow-hidden design-agent-studio">
        <CreativeCanvas 
          user={userData}
          isAuthorized={!!userData}
          creditConversionRate={200}
          theme="dark"
          onToggleHeader={onToggleHeader}
          isHeaderVisible={isHeaderVisible}
        />
      </div>
    </CreativeCanvasErrorBoundary>
  );
}

export default memo(DesignAgentStudio);
