'use client';

import { useClerk as useClerkOriginal, useAuth as useAuthOriginal } from '@clerk/nextjs';

/**
 * Safe wrapper around Clerk hooks that returns no-op fallbacks when Clerk
 * is not configured (no publishable key) or when the component is rendered
 * outside a <ClerkProvider />.
 *
 * This prevents runtime crashes in local/dev environments where the app
 * intentionally runs without Clerk auth.
 */

const NO_CLERK_SIGN_OUT = () => Promise.resolve();

function useSafeClerk() {
  try {
    return useClerkOriginal();
  } catch {
    return {
      signOut: NO_CLERK_SIGN_OUT,
      // Include other Clerk fields if needed by consumers.
    } as ReturnType<typeof useClerkOriginal>;
  }
}

function useSafeAuth() {
  try {
    return useAuthOriginal();
  } catch {
    return {
      isSignedIn: false,
      isLoaded: true,
      userId: null,
    } as ReturnType<typeof useAuthOriginal>;
  }
}

export { useSafeClerk, useSafeAuth };
