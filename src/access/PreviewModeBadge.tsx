'use client';

import React from 'react';
import { useSmartVideoAccess } from './SmartVideoAccessProvider';

export default function PreviewModeBadge() {
  const { isPaid, isSignedIn, openUpgradeModal } = useSmartVideoAccess();

  if (isPaid || !isSignedIn) return null;

  return (
    <button
      type="button"
      onClick={() => openUpgradeModal('preview-badge')}
      title="You're in preview mode — explore everything, purchase to create"
      className="inline-flex h-fit items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide text-amber-300/90 transition-colors hover:border-amber-300/60 hover:bg-amber-400/15 hover:text-amber-200"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden="true" />
      Preview Mode
    </button>
  );
}
