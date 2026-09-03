'use client';
import dynamic from 'next/dynamic';
import LandingPage from './LandingPage';
import LandingAuthControls from './LandingAuthControls';

const FullStudio = dynamic(() => import('@/components/StandaloneShell'), {
  ssr: false,
  loading: () => (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/50">
        Loading the full studio...
      </div>
    </section>
  )
});

// Only render Clerk-dependent auth controls when the publishable key is present.
// This prevents useAuth() from being called outside <ClerkProvider /> during
// local development with empty/missing keys.
const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const AuthControls = isClerkEnabled ? LandingAuthControls : null;

export default function LandingPageClient() {
  return <LandingPage FullStudio={FullStudio} AuthControls={AuthControls} />;
}
