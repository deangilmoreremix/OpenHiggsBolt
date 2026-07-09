"use client";
import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PRODUCT_NAME } from '../../components/landing/landingData';

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingSecondFactor, setPendingSecondFactor] = useState(false);
  const [code, setCode] = useState('');

  const destination = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect_url');
      if (redirect) return redirect;
    }
    return '/studio';
  };

  const finishSignIn = async () => {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl(destination());
        if (url.startsWith('http')) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
    try {
      await fetch('/api/workspace/provision', { method: 'POST' });
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await signIn.password({
        identifier: email,
        password,
      });
      if (error) {
        return;
      }
    } catch {
      // handled by errors object
    }

    if (signIn.status === 'complete') {
      await finishSignIn();
      return;
    }

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      try {
        await signIn.mfa.sendEmailCode();
        setPendingSecondFactor(true);
      } catch {
        // handled by errors object
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code });
      if (error) {
        return;
      }
    } catch {
      // handled by errors object
    }

    if (signIn.status === 'complete') {
      await finishSignIn();
    }
  };

  if (pendingSecondFactor) {
    return (
      <SignInSecondFactorView
        email={email}
        code={code}
        setCode={setCode}
        errors={errors}
        fetchStatus={fetchStatus}
        onVerify={handleVerify}
        onResend={() => signIn.mfa.sendEmailCode()}
      />
    );
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
              Welcome back
            </p>
            <h1 className="landing-gradient-text text-4xl font-black tracking-tight md:text-5xl">
              Sign in to the studio
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/60">
              Pick up where you left off — your assets, campaigns, and workflows are waiting.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="landing-card rounded-3xl p-6 md:p-8">
            <div className="space-y-5">
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
                {errors?.fields?.identifier ? (
                  <p className="mt-2 text-sm text-red-300">{errors.fields.identifier.message}</p>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-white/70">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 pr-12 text-sm text-white placeholder-white/40 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/50 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors?.fields?.password ? (
                  <p className="mt-2 text-sm text-red-300">{errors.fields.password.message}</p>
                ) : null}
              </div>

              {errors?.global ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errors.global[0]?.longMessage || errors.global[0]?.message || 'Sign in failed.'}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={fetchStatus === 'fetching'}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 text-sm font-bold text-black shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {fetchStatus === 'fetching' ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

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

export function SignInSecondFactorView({
  email,
  code,
  setCode,
  errors,
  fetchStatus,
  onVerify,
  onResend,
}) {
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
              Verify it's you
            </p>
            <h1 className="landing-gradient-text text-4xl font-black tracking-tight md:text-5xl">
              Confirm your identity
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/60">
              For your security, we sent a verification code to{' '}
              <span className="font-semibold text-white/80">{email}</span>. Enter it below to finish
              signing in.
            </p>
          </div>

          <form onSubmit={onVerify} className="landing-card rounded-3xl p-6 md:p-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="code" className="mb-2 block text-sm font-medium text-white/70">
                  Verification code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-lg tracking-[0.5em] text-white placeholder-white/40 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
                />
                {errors?.fields?.code ? (
                  <p className="mt-2 text-sm text-red-300">{errors.fields.code.message}</p>
                ) : null}
              </div>

              {errors?.global ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errors.global[0]?.longMessage || errors.global[0]?.message || 'Verification failed.'}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={fetchStatus === 'fetching'}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 text-sm font-bold text-black shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {fetchStatus === 'fetching' ? 'Verifying…' : 'Verify & sign in'}
              </button>

              <button
                type="button"
                onClick={onResend}
                disabled={fetchStatus === 'fetching'}
                className="w-full text-center text-sm font-semibold text-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Resend code
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-white/55">
            Wrong account?{' '}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Start over
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
