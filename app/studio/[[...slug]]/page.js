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
  const [extra, setExtra] = useState({ id: null, demo: null });
  useEffect(() => {
    if (!needsExtra) return;
    let live = true;
    resolveDemoById(templateId).then((demo) => {
      if (live) setExtra({ id: templateId, demo: demo ?? null });
    });
    return () => {
      live = false;
    };
  }, [needsExtra, templateId]);

  if (needsExtra && extra.id !== templateId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  return <StandaloneShell templateData={templateData ?? extra.demo} />;
}
