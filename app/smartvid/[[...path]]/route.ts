import { auth, currentUser } from '@clerk/nextjs/server';
import { handleSmartvid } from '@/lib/smartvid/gate.mjs';

// Smartvid Downloader = vendored upstream Smartvid Downloader (apps/smartvid), proxied here behind Clerk auth + SMARTVID_ALLOWED_USERS.
// Needs the Smartvid Downloader web/API processes running (see docs/MEDIA_HUB.md); serverless hosts can't run them.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  let user: { id: string; emails: string[] } | null = null;
  try {
    const { userId } = await auth();
    if (userId) {
      // Only look up emails when the allowlist actually contains one.
      const needsEmail = (process.env.SMARTVID_ALLOWED_USERS || '').includes('@');
      const emails = needsEmail ? ((await currentUser())?.emailAddresses ?? []).map((e) => e.emailAddress) : [];
      user = { id: userId, emails };
    }
  } catch {
    user = null;
  }
  return handleSmartvid(request, { user });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH, handle as HEAD };
