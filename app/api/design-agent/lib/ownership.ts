import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';

type OwnershipRecord = {
  clerk_user_id: string;
  session_id: string;
  job_id?: string;
};

export async function recordOwnership(params: { userId: string; sessionId?: string; jobId?: string }) {
  const key = params.sessionId || params.jobId;
  if (!key) return;

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // Upsert the ownership row. We key on session_id when present; otherwise job_id.
  const { error } = await supabase
    .from('design_agent_ownership')
    .upsert(
      {
        clerk_user_id: params.userId,
        session_id: params.sessionId || null,
        job_id: params.jobId || null,
        updated_at: nowIso,
      },
      {
        onConflict: params.sessionId ? 'session_id' : 'job_id',
      }
    );

  if (error) {
    console.error('Failed to record design agent ownership:', error);
  }
}

export async function getOwnerId(resourceKey: string, resourceType: 'session' | 'job'): Promise<string | undefined> {
  const supabase = getSupabaseAdmin();
  const column = resourceType === 'session' ? 'session_id' : 'job_id';

  const { data } = await supabase
    .from('design_agent_ownership')
    .select('clerk_user_id')
    .eq(column, resourceKey)
    .maybeSingle();

  return data?.clerk_user_id;
}

export async function requireOwnership(resourceKey: string, resourceType: 'session' | 'job' = 'session'): Promise<{ userId: string } | Response> {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const ownerId = await getOwnerId(resourceKey, resourceType);
  if (!ownerId) {
    // Resource not tracked yet — deny by default to prevent enumeration.
    return new Response('Forbidden', { status: 403 });
  }

  if (ownerId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  return { userId };
}

export async function resolveClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
