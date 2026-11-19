'use client';

// Media Hub — hosts the vendored upstream VidBee web app (apps/vidbee) in an iframe, themed with this app's
// cyan palette in light and dark. All download / queue / RSS / transcription UI is upstream's. Access is enforced
// server-side by app/vidbee/[[...path]]/route.ts (Clerk auth + VIDBEE_ALLOWED_USERS).
// Light / Dark / System is switched inside VidBee itself (the button in its title bar, or Settings → Theme).
export default function MediaHub() {
  return (
    <iframe
      title="Media Hub"
      src="/vidbee"
      allow="clipboard-write; fullscreen"
      style={{ width: '100%', height: '100%', minHeight: 0, border: 0, display: 'block' }}
    />
  );
}
