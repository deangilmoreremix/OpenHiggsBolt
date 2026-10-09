'use client';

import React, { useState, useEffect, memo, Suspense } from 'react';
import dynamic from 'next/dynamic';
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

class DesignAgentErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-black text-white">
          <div className="max-w-md p-6 rounded-xl border border-white/10 bg-white/5 text-center space-y-4">
            <div className="text-4xl">🎨</div>
            <h2 className="text-lg font-bold">Design Agent Error</h2>
            <p className="text-sm text-white/60">
              The design agent encountered an unexpected error. Your session data is preserved.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-all"
            >
              Reload Design Agent
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dynamically import the actual DesignAgent component from src/apps/design-agent
const DesignAgent = dynamic(() => import('../../../../src/apps/design-agent/DesignAgent.tsx'), { ssr: false });

function DesignAgentStudio({ apiKey, isHeaderVisible, onToggleHeader, onRequestApiKey, templateData }) {
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
    <DesignAgentErrorBoundary>
      <div className="h-full w-full bg-black overflow-hidden design-agent-studio">
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin text-[#22d3ee] text-3xl">◌</div></div>}>
          <DesignAgent 
            apiKey={apiKey}
            onRequestApiKey={onRequestApiKey}
            templateData={templateData}
            isHeaderVisible={isHeaderVisible}
            onToggleHeader={onToggleHeader}
          />
        </Suspense>
      </div>
    </DesignAgentErrorBoundary>
  );
}

export default memo(DesignAgentStudio);
