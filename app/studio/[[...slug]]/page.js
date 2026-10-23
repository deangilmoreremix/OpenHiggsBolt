'use client';

import { useSearchParams } from 'next/navigation';
import StandaloneShell from '@/components/StandaloneShell';
import { findDemoById } from '@/data/demoLookup';
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
      templateData = findDemoById(templateId);
    }
  }

  return <StandaloneShell templateData={templateData} />;
}
