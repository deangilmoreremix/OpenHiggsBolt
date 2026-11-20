'use client';

import React from 'react';
import { useSmartVideoAccess } from './SmartVideoAccessProvider';

/**
 * GO-Viral studio is one of the two paid apps (the other is the reseller
 * apps). Buyers and the super user see the studio; every other signed-in user
 * sees a locked screen with a way to buy or restore access.
 */
export default function GoViralGate({ children }: { children: React.ReactNode }) {
  const { hasSmartVideoViral, isSuperUser, isLoading, openUpgradeModal } = useSmartVideoAccess();

  if (hasSmartVideoViral || isSuperUser) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50">Loading GO-Viral…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-6" data-testid="go-viral-locked">
      <div className="w-full max-w-md text-center bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-purple-500/10 border border-white/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">GO-Viral is sold separately</h2>
        <p className="text-sm text-white/60 mb-6">
          Purchase GO-Viral to browse the viral prompt feed and send prompts to your studios.
          Every other studio stays open to you.
        </p>
        <button
          type="button"
          onClick={() => openUpgradeModal('go-ai-viral')}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold hover:opacity-90 transition-opacity"
        >
          Unlock GO-Viral
        </button>
      </div>
    </div>
  );
}
