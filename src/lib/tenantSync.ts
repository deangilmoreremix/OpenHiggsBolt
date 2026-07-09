import { currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from './supabaseServer';

export interface SyncedUser {
  id: string;
  clerk_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40) || 'workspace';
}

export async function syncUserFromClerk(
  clerkUserId: string,
  email: string | null,
  firstName: string | null,
  lastName: string | null,
  imageUrl: string | null
): Promise<SyncedUser> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_users')
    .upsert(
      {
        clerk_user_id: clerkUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as SyncedUser;
}

export async function ensureUserAndWorkspace(): Promise<{
  user: SyncedUser;
  workspace: Workspace;
}> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error('Not authenticated');
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  const firstName = clerkUser.firstName ?? null;
  const lastName = clerkUser.lastName ?? null;
  const imageUrl = clerkUser.imageUrl ?? null;

  const user = await syncUserFromClerk(
    clerkUser.id,
    email,
    firstName,
    lastName,
    imageUrl
  );

  const supabase = getSupabaseAdmin();
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace:workspaces(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (membership?.workspace) {
    const ws = membership.workspace;
    return {
      user,
      workspace: (Array.isArray(ws) ? ws[0] : ws) as unknown as Workspace,
    };
  }

  const baseName = firstName ? `${firstName}'s workspace` : 'My workspace';
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ name: baseName, slug, owner_id: user.id, plan: 'free' })
    .select()
    .single();

  if (wsError) throw wsError;

  const { error: memError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memError) throw memError;

  return { user, workspace: workspace as Workspace };
}

export async function getCurrentWorkspace(): Promise<Workspace | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('app_users')
    .select('id')
    .eq('clerk_user_id', clerkUser.id)
    .maybeSingle();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace:workspaces(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace) return null;
  const ws = membership.workspace;
  return (Array.isArray(ws) ? ws[0] : ws) as unknown as Workspace;
}
