'use client';

import { useState, useEffect } from 'react';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PRODUCT_NAME } from '../../../components/landing/landingData';

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  // Provision workspace once authenticated.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch('/api/workspace/provision', { method: 'POST' }).catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!signUp) return;

    const formData = new FormData(e.currentTarget);
    const firstNameVal = formData.get('firstName');
    const lastNameVal = formData.get('lastName');
    const emailVal = formData.get('email');
    const pwd = formData.get('password');

    const { error } = await signUp.password({
      emailAddress: emailVal,
      password: pwd,
      firstName: firstNameVal,
      lastName: lastNameVal,
    });

    if (error) {
      return;
    }

    // If email verification is required, send the code.
    if (
      signUp.status === 'missing_requirements' &&
      signUp.unverifiedFields.includes('email_address')
    ) {
      await signUp.verifications.sendEmailCode();
    }

    if (signUp.status === 'complete') {
      await signUp.finalize({
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

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!signUp) return;

    const formData = new FormData(e.currentTarget);
    const codeVal = formData.get('code');

    const { error } = await signUp.verifications.verifyEmailCode({ code: codeVal });

    if (error) {
      return;
    }

    if (signUp.status === 'complete') {
      await signUp.finalize({
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

  const showVerification =
    signUp &&
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address');

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
              Get started
            </p>
            <h1 className="landing-gradient-text text-4xl font-black tracking-tight md:text-5xl">
              Create your studio account
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/60">
              Join creators, agencies, and teams shipping AI video campaigns in minutes.
            </p>
          </div>

          <div className="landing-card rounded-3xl p-6 md:p-8">
            {showVerification ? (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Verify your email</h2>
                  <p className="mt-1 text-sm text-white/60">
                    We sent a verification code to <span className="text-cyan-300">{email}</span>.
                  </p>
                </div>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-white/80">
                    Verification code
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
                <button
                  type="submit"
                  disabled={fetchStatus === 'fetching'}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 py-3 text-center text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify email'}
                </button>
                <button
                  type="button"
                  onClick={() => signUp?.verifications.sendEmailCode()}
                  disabled={fetchStatus === 'fetching'}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Resend code
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white/80">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      placeholder="Jane"
                    />
                    {errors?.fields?.firstName && (
                      <p className="mt-1.5 text-sm text-red-400">{errors.fields.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white/80">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      placeholder="Doe"
                    />
                    {errors?.fields?.lastName && (
                      <p className="mt-1.5 text-sm text-red-400">{errors.fields.lastName.message}</p>
                    )}
                  </div>
                </div>
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
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80">
                    Password
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
                  {fetchStatus === 'fetching' ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-white/55">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
