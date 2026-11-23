'use client';

// Warmbly Studio: the standalone Warmbly app (warmbly/web, built to /warmbly-app/ by `pnpm build:warmbly`)
// shown in an iframe that fills the studio area, like the other embedded apps.
// It signs in with this app's Clerk session (same origin), so it has no sign-in page of its own.
// The studio is served from this app's own origin (run `pnpm build:warmbly` first); Warmbly's dev server refuses to be framed.
// Override the address with NEXT_PUBLIC_WARMBLY_URL.

const WARMBLY_URL = process.env.NEXT_PUBLIC_WARMBLY_URL || '/warmbly-app/';

export default function WarmblyStudio() {
  return (
    <iframe
      title="Warmbly Studio"
      src={WARMBLY_URL}
      allow="clipboard-read; clipboard-write; fullscreen"
      className="block h-full w-full border-0 bg-[#030303]"
    />
  );
}
