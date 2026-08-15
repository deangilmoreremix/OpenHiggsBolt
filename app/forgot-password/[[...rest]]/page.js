'use client';

import { useState, useEffect } from 'react';
import { useSignIn, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PRODUCT_NAME } from '../../../components/landing/landingData';

export default function ForgotPasswordPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'send_code' | 'reset_password'>('send_code');

  // Provision workspace once authenticated.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch('/api/workspace/provision', { method: 'POST' }).catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!signIn) return;

    const formData = new FormData(e.currentTarget);
    const emailAddress = formData.get('email');

    const { error } = await signIn.resetPasswordEmailCode.sendCode({
      emailAddress,
    });

    if (!error) {
      setStep('reset_password');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!signIn) return;

    const formData = new FormData(e.currentTarget);
    const codeVal = formData.get('code');
    const newPassword = formData.get('password');

    const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({
      code: codeVal,
    });

    if (verifyError) {
      return;
    }

    const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
    });

    if (submitError) {
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl('/studio');
          if (url.startsWith('http')) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    }
  };

  if (!isLoaded) {
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (isSignedIn) {
    return null;
  }

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
              Enter your email and we will send you a code to reset your password.
            </p>
          </div>

          <div className="landing-card rounded-3xl p-6 md:p-8">
            {step === 'send_code' ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="you@example.com"
                  />
                  {errors?.fields?.emailAddress && (
                    <p className="mt-1.5 text-sm text-red-400">{errors.fields.emailAddress.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={fetchStatus === 'fetching'}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 py-3 text-center text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {fetchStatus === 'fetching' ? 'Sending code...' : 'Send reset code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-white/80">
                    Reset code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="123456"
                  />
                  {errors?.fields?.code && (
                    <p className="mt-1.5 text-sm text-red-400">{errors.fields.code.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80">
                    New password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="••••••••"
                  />
                  {errors?.fields?.password && (
                    <p className="mt-1.5 text-sm text-red-400">{errors.fields.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={fetchStatus === 'fetching'}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 py-3 text-center text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {fetchStatus === 'fetching' ? 'Resetting...' : 'Reset password'}
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
