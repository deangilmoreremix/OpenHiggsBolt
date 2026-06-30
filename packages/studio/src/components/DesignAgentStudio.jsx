"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { getUserBalance } from '../muapi';

const CreativeCanvas = dynamic(
  () => import('design-agent').then((m) => ({ default: m.CreativeCanvas })).catch(() => {
    throw new Error('Design Agent workspace not initialized');
  }),
  {
    ssr: false,
    loading: () => <DesignAgentUnavailable />,
  }
);

function DesignAgentUnavailable() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-black p-8">
      <div className="max-w-md text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">Design Agent is initializing</h2>
        <p className="text-sm text-white/50">
          The <code className="px-1.5 py-0.5 rounded bg-white/5 text-white/70 text-xs">design-agent</code> workspace package
          isn&apos;t installed in this checkout. Run <code className="px-1.5 py-0.5 rounded bg-white/5 text-white/70 text-xs">npm run setup</code> to
          fetch and link it, then restart the dev server.
        </p>
      </div>
    </div>
  );
}

export default function DesignAgentStudio({ apiKey, isHeaderVisible, onToggleHeader }) {
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
        console.error('Failed to fetch user data for Design Agent:', err);
      }
    };

    fetchUser();
  }, [apiKey]);

  return (
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
  );
}
