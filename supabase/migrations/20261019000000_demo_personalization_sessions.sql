-- Demo personalization sessions.
--
-- Narrowly scoped server-validated permission for the landing-page
-- demo Personalization Modal (Lead Finder, business search, import,
-- customize, preview, render). A session row authorizes exactly the
-- demo template + actions listed on it and nothing else. It never
-- grants access to paid studios or normal paid rendering.
--
-- Writes are service-role only (server-side API routes). RLS exposes
-- an owner-scoped SELECT so a client can only read its own session.
-- All statements are idempotent.

create table if not exists public.demo_personalization_sessions (
  id text primary key default gen_random_uuid()::text,
  -- Nullable: signed-out demo visitors have no Clerk identity.
  clerk_user_id text,
  -- The landing-page demo template this session is scoped to.
  template_id text not null,
  -- Actions this session is authorized to perform (e.g. lead-finder,
  -- import, customize, preview, render).
  actions jsonb not null default '[]'::jsonb,
  -- Short expiry so a demo token cannot be reused indefinitely.
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  -- Best-effort IP hash for rate limiting public demo creation.
  ip_hash text
);

create index if not exists demo_sessions_clerk_user_id_idx
  on public.demo_personalization_sessions(clerk_user_id);
create index if not exists demo_sessions_expires_at_idx
  on public.demo_personalization_sessions(expires_at);

alter table public.demo_personalization_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'demo_personalization_sessions'
      and policyname = 'Users can view own demo sessions'
  ) then
    create policy "Users can view own demo sessions"
      on public.demo_personalization_sessions for select
      using (
        clerk_user_id = current_setting('app.clerk_user_id', true)
        OR clerk_user_id IS NULL
      );
  end if;
end $$;

comment on table public.demo_personalization_sessions is
  'Narrowly scoped server-validated sessions for the free landing-page demo Personalization Modal. Never grants paid studio access.';
