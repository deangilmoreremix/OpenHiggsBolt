'use client';
import { UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function LandingAuthControls() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-24 rounded-full border border-white/10 bg-white/[0.04]" />
        <div className="h-9 w-28 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
      </div>
    );
  }

  if (isSignedIn) {
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

  return (
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
        Get started
      </Link>
    </div>
  );
}
