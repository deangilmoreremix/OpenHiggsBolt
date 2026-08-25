'use client';
import { UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function LandingAuthControls() {
  const { isSignedIn, isLoaded } = useAuth();

  // Signed in: show the user menu + a link into the studio.
  if (isLoaded && isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/studio"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Open studio
        </Link>
        <UserButton
          userProfileUrl="/account"
          afterSignOutUrl="/"
          appearance={{
            elements: { avatarBox: 'h-9 w-9' },
          }}
        />
      </div>
    );
  }

  // Signed out (or still loading Clerk): always render the entry points so
  // "Sign in" / "Get started" are visible immediately — including in the SSR
  // HTML and before Clerk finishes loading on the client. Previously this
  // state showed a skeleton, which left the buttons invisible if Clerk was
  // slow or blocked.
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2 text-sm font-bold text-black shadow-lg transition hover:opacity-90"
        >
          Sign up
        </Link>
      </div>
      <Link
        href="/forgot-password"
        className="text-sm text-cyan-300 hover:text-cyan-200"
      >
        Forgot password?
      </Link>
    </div>
  );
}
