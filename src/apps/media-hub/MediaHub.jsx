'use client';

// Smartvid Downloader — hosts the vendored upstream Smartvid Downloader web app (apps/smartvid) in an iframe, themed with this app's
// cyan palette in light and dark. All download / queue / RSS / transcription UI is upstream's. Access is enforced
// server-side by app/smartvid/[[...path]]/route.ts (Clerk auth + SMARTVID_ALLOWED_USERS).
// Light / Dark / System is switched inside Smartvid Downloader itself (the button in its title bar, or Settings → Theme).
export default function MediaHub() {
  return (
    <iframe
      title="Smartvid Downloader"
      src="/smartvid"
      allow="clipboard-write; fullscreen"
      style={{ width: '100%', height: '100%', minHeight: 0, border: 0, display: 'block' }}
    />
  );
}
