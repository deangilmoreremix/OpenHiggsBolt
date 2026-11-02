'use client';

import React from 'react';
import { useSmartVideoAccess } from './SmartVideoAccessProvider';

/**
 * Wraps a paid-upgrade studio (e.g. GO-Viral). Every user can SEE the studio
 * — it renders underneath — but until they own `entitlement` it is covered by
 * a non-interactive lock with an unlock call to action.
 */
export default function LockedStudio({
  entitlement,
  source,
  title,
  description,
  children,
}: {
  entitlement: string;
  source: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { hasEntitlement, isLoading, openUpgradeModal } = useSmartVideoAccess();
  const locked = !isLoading && !hasEntitlement(entitlement);

  if (!locked) return <>{children}</>;

  return (
    <div className="relative h-full w-full overflow-hidden" data-testid="locked-studio">
      <div aria-hidden="true" className="pointer-events-none h-full w-full select-none opacity-40 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-purple-500/10">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-amber-300/90">Upgrade</p>
          <h2 className="mb-2 text-2xl font-bold text-white">{title}</h2>
          <p className="mb-5 text-sm text-white/60">{description}</p>
          <button
            type="button"
            onClick={() => openUpgradeModal(source)}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 py-3 font-bold text-black transition-opacity hover:opacity-90"
          >
            Unlock {title}
          </button>
        </div>
      </div>
    </div>
  );
}
