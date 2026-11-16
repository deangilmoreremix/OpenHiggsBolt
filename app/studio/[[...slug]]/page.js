'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StandaloneShell from '@/components/StandaloneShell';
import { findDemoById, resolveDemoById } from '@/data/demoLookup';
import { getMotionTemplateByComponent } from '@/data/motionRecipeCatalog';

export default function StudioPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get('template');
  
  let templateData = null;
  if (templateId) {
    // Check if this is a Motion Studio template (format: motion-studio|{componentName})
    if (templateId.startsWith('motion-studio|')) {
      const componentName = templateId.split('|')[1];
      templateData = getMotionTemplateByComponent(componentName) ?? null;
    } else {
      // Use existing demo lookup for other studio types
      templateData = findDemoById(templateId) ?? null;
    }
  }

  // Templates from the industry sections' extra demos load on demand. Wait for
  // them before mounting the studio so it starts with the template applied.
  const needsExtra = Boolean(templateId) && !templateId.startsWith('motion-studio|') && !templateData;
  const [extra, setExtra] = useState({ id: null, demo: null, failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!needsExtra) return;
    let live = true;
    resolveDemoById(templateId).then(
      (demo) => {
        if (live) setExtra({ id: templateId, demo: demo ?? null, failed: false });
      },
      () => {
        if (live) setExtra({ id: templateId, demo: null, failed: true });
      },
    );
    return () => {
      live = false;
    };
  }, [needsExtra, templateId, attempt]);

  const extraReady = needsExtra && extra.id === templateId;
  if (extraReady && extra.failed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
        <div className="max-w-md text-center" role="alert">
          <h1 className="text-2xl font-black text-white">Couldn&apos;t load this template</h1>
          <p className="mt-2 text-sm text-white/60">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setExtra({ id: null, demo: null, failed: false });
              setAttempt((n) => n + 1);
            }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.01]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (needsExtra && !extraReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  // Only the result for the template in the URL now (a studio tab change drops it).
  return <StandaloneShell templateData={templateData ?? (extraReady ? extra.demo : null)} />;
}
