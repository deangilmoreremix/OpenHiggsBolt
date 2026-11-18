'use client';

// Outreach Studio: the standalone Warmbly app (warmbly/web, built to /outreach-app/ by `pnpm build:outreach`)
// shown in an iframe that fills the studio area, like the other embedded apps.
// It signs in with this app's Clerk session (same origin), so it has no sign-in page of its own.
// Override the address with NEXT_PUBLIC_OUTREACH_URL (e.g. `pnpm exec vite --port 5180` in warmbly/web).

const OUTREACH_URL = process.env.NEXT_PUBLIC_OUTREACH_URL || '/outreach-app/';

export default function OutreachStudio() {
  return (
    <iframe
      title="Outreach Studio"
      src={OUTREACH_URL}
      allow="clipboard-read; clipboard-write; fullscreen"
      className="block h-full w-full border-0 bg-[#030303]"
    />
  );
}
