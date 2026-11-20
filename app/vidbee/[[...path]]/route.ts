import { auth, currentUser } from '@clerk/nextjs/server';
import { handleVidBee } from '@/lib/vidbee/gate.mjs';

// Media Hub = vendored upstream VidBee (apps/vidbee), proxied here behind Clerk auth + VIDBEE_ALLOWED_USERS.
// Needs the VidBee web/API processes running (see docs/MEDIA_HUB.md); serverless hosts can't run them.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  let user: { id: string; emails: string[] } | null = null;
  try {
    const { userId } = await auth();
    if (userId) {
      // Only look up emails when the allowlist actually contains one.
      const needsEmail = (process.env.VIDBEE_ALLOWED_USERS || '').includes('@');
      const emails = needsEmail ? ((await currentUser())?.emailAddresses ?? []).map((e) => e.emailAddress) : [];
      user = { id: userId, emails };
    }
  } catch {
    user = null;
  }
  return handleVidBee(request, { user });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH, handle as HEAD };
