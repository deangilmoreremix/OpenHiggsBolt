'use client';

import { useSearchParams } from 'next/navigation';
import StandaloneShell from '@/components/StandaloneShell';
import LocaleTextBridge from '@/components/LocaleTextBridge';
import { findDemoById } from '@/data/demoLookup';

export default function ZhStudioPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get('template');
  const templateData = templateId ? findDemoById(templateId) : null;

  return (
    <>
      <LocaleTextBridge locale="zh" />
      <StandaloneShell templateData={templateData} locale="zh" />
    </>
  );
}
