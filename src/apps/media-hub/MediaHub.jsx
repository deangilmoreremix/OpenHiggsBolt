'use client';

// Media Hub — hosts the vendored upstream VidBee web app (apps/vidbee) in an iframe, themed with this app's
// cyan palette. All download / queue / RSS / transcription UI is upstream's. Access is enforced server-side by
// app/vidbee/[[...path]]/route.ts (Clerk auth + VIDBEE_ALLOWED_USERS).
export default function MediaHub() {
  return (
    <iframe
      title="Media Hub"
      src="/vidbee"
      allow="clipboard-write; fullscreen"
      style={{ width: '100%', height: '100%', minHeight: 0, border: 0, background: '#050505', display: 'block' }}
    />
  );
}
