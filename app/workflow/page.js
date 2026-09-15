'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkflowIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studio/workflows');
  }, [router]);

  return null;
}
