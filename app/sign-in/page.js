'use client';
import { useEffect } from 'react';
import { SignIn, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { PRODUCT_NAME } from '../../components/landing/landingData';

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // Provision the user's workspace in Supabase once the session is active.
  // (Idempotent on the server via onConflict: clerk_user_id.)
  // Post-sign-in navigation is owned by Clerk via fallbackRedirectUrl below
  // (honors ?redirect_url= set by middleware when arriving from a protected route).
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch('/api/workspace/provision', { method: 'POST' }).catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="landing-noise" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at top,rgba(34,211,238,0.14),transparent 30%),radial-gradient(circle at 80% 10%,rgba(168,85,247,0.12),transparent 32%),#050505',
        }}
      />
      <div
        className="landing-orb"
        style={{ left: '-6rem', top: '6rem', height: '18rem', width: '18rem', background: '#22d3ee' }}
        aria-hidden="true"
      />
      <div
        className="landing-orb"
        style={{ right: 0, top: '10rem', height: '24rem', width: '24rem', background: '#a855f7' }}
        aria-hidden="true"
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-black text-black">
              OG
            </span>
            <span className="font-semibold tracking-tight">{PRODUCT_NAME}</span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="relative mx-auto flex max-w-7xl items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-200">
              Welcome back
            </p>
            <h1 className="landing-gradient-text text-4xl font-black tracking-tight md:text-5xl">
              Sign in to the studio
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/60">
              Pick up where you left off — your assets, campaigns, and workflows are waiting.
            </p>
          </div>

          <SignIn routing="path" fallbackRedirectUrl="/studio" />

          <p className="mt-4 text-center text-sm text-white/55">
            <Link
              href="/forgot-password"
              className="font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Forgot your password?
            </Link>
          </p>

          <p className="mt-6 text-center text-sm text-white/55">
            New to {PRODUCT_NAME}?{' '}
            <Link href="/sign-up" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
