'use client';
import dynamic from 'next/dynamic';
import LandingPage from './LandingPage';
import LandingAuthControls from './LandingAuthControls';

const FeatureDemos = dynamic(() => import('./FeatureDemos'), {
  ssr: false,
  loading: () => (
    <section id="demos" className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/50">
        Loading interactive demos...
      </div>
    </section>
  )
});

export default function LandingPageClient() {
  return <LandingPage FeatureDemos={FeatureDemos} AuthControls={LandingAuthControls} />;
}
