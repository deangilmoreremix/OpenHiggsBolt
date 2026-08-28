'use client';

import { useSearchParams } from 'next/navigation';
import StandaloneShell from '@/components/StandaloneShell';
import { findDemoById } from '@/data/demoLookup';

export default function StudioPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get('template');
  const templateData = templateId ? findDemoById(templateId) : null;

  return <StandaloneShell templateData={templateData} />;
}
