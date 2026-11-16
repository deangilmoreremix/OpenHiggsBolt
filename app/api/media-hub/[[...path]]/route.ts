import { auth } from '@clerk/nextjs/server';
import { handleMediaHub } from '@/lib/mediaHub/core.mjs';

// Media Hub API: yt-dlp downloads, transcription (speaker labels) and AI summaries.
// Needs a long-running Node server with yt-dlp + ffmpeg on PATH (self-hosted / Docker / Electron);
// serverless hosts can't run it — GET /api/media-hub/status reports what is missing.
// Everything requires a signed-in user except signed file links (/file/:id?t=…), which carry an HMAC token.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    userId = null;
  }
  return handleMediaHub(request, { userId, base: '/api/media-hub' });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
