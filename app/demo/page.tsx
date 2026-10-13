import type { Metadata } from 'next';
import { DemoPersonalizeProvider } from '../../src/shared/personalization/DemoPersonalizeProvider';
import FreeDiscoveryDemo from '../../src/components/FreeDiscoveryDemo';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Demo — Find My Brand and Preview Its Brand Assets | SmartVideo GO',
  description:
    'Try the free demo: paste a business website or search a local business by niche and city, and SmartVideo reads the page to show the logos, photos, product shots and branding assets it can find. No sign-in, no credits.',
  keywords: [
    'free local business demo',
    'find my brand',
    'OpenStreetMap business search',
    'website brand asset discovery',
    'logo preview',
    'SmartVideo GO',
  ],
  openGraph: {
    title: 'Free Demo — Find My Brand and Preview Its Brand Assets',
    description:
      'Paste a business website or search a local business, and preview the assets found there. No sign-in required.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Demo — Find My Brand and Preview Its Brand Assets',
    description:
      'Paste a business website or search a local business, and preview the assets found there. No sign-in required.',
  },
};

/**
 * Public landing surface for the free discovery pipeline.
 *
 * It mounts the SHARED personalization provider in anonymous mode — so the
 * modal runs the restricted free pipeline behind `POST /api/demo/discover` and
 * never offers paid actions. The provider itself mounts the ONE shared
 * `PersonalizationModal` while it is open, so there is no second instance and
 * no second implementation of the personalization UI anywhere.
 *
 * Free visitors reach no paid AI: the access mode only selects which discovery
 * endpoint is called and which affordances the shared modal renders, and the
 * server re-checks every request anyway.
 */
export default function FreeDiscoveryDemoPage() {
  return (
    <DemoPersonalizeProvider access="anonymous">
      <main className="min-h-screen bg-[#050505] text-white">
        <FreeDiscoveryDemo />

        <footer className="border-t border-white/10 px-5 py-6 text-xs leading-6 text-white/40 sm:px-8">
          <p>
            Business data comes from OpenStreetMap contributors. Website assets are read from the businesses&rsquo; own
            public pages and remain the property of their owners — this preview is for demonstration only.
          </p>
          <p className="mt-2">
            <Link href="/" className="inline-flex min-h-[44px] items-center font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-2">
              Back to SmartVideo GO
            </Link>{' '}
            to start a project.
          </p>
        </footer>
      </main>
    </DemoPersonalizeProvider>
  );
}
