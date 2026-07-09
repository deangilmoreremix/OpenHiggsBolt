'use client';
import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { PRODUCT_NAME } from '../../components/landing/landingData';

export default function ForgotPasswordPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode({
        emailAddress: email,
      });
      if (!error) {
        setSent(true);
      }
    } catch {
      // handled by errors object
    }
  };

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
              Reset password
            </p>
            <h1 className="landing-gradient-text text-4xl font-black tracking-tight md:text-5xl">
              Forgot your password?
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/60">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="landing-card rounded-3xl p-6 md:p-8">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                  If an account exists for <span className="font-semibold">{email}</span>, you'll receive a password reset link shortly.
                </div>
                <Link
                  href="/sign-in"
                  className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/70">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
                  />
                  {submitted && errors?.fields?.emailAddress ? (
                    <p className="mt-2 text-sm text-red-300">{errors.fields.emailAddress.message}</p>
                  ) : null}
                  {submitted && errors?.global ? (
                    <p className="mt-2 text-sm text-red-300">{errors.global[0]?.message || 'Something went wrong.'}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={fetchStatus === 'fetching'}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 text-sm font-bold text-black shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {fetchStatus === 'fetching' ? 'Sending link…' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-white/55">
            Remember your password?{' '}
            <Link href="/sign-in" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
