'use client';

import { useUser } from '@clerk/nextjs';

/**
 * PersonalizedHeroHeading
 *
 * Renders the hero <h1> with dynamic personalization when the user is
 * signed in: greets them by first name and reinforces that the studio is
 * already tuned to their brand. Falls back to the static headline for
 * signed-out visitors so the SSR HTML and pre-hydration state still read
 * cleanly.
 */
export default function PersonalizedHeroHeading() {
  const { isSignedIn, isLoaded, user } = useUser();

  // Static headline shown to signed-out visitors (and during SSR / before
  // Clerk finishes loading) — keeps the page meaningful without auth.
  if (!isLoaded || !isSignedIn) {
    return (
      <h1 className="landing-gradient-text text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
        A creative studio that learns the way you create.
      </h1>
    );
  }

  const firstName =
    user?.firstName?.trim() ||
    user?.username?.split(/[_\-.\s]/)[0] ||
    'there';

  return (
    <h1 className="landing-gradient-text text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
      Welcome back, {firstName} — your studio already knows your style.
    </h1>
  );
}