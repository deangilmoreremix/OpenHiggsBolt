-- =====================================================================
-- Multi-tenant schema: users, workspaces, members
-- Idempotent — can be safely re-applied.
-- =====================================================================

-- Users synced from Clerk.
-- NOTE: existing workspaces/workspace_members may have been created with
-- a prior revision and use text ids. We reconcile via `if not exists`
-- and live with text ids to avoid breaking data.
create table if not exists app_users (
  id text primary key,
  clerk_user_id text unique not null,
  email text unique,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop index if exists app_users_clerk_id_idx;
create index if not exists app_users_clerk_id_idx on app_users(clerk_user_id);

-- Workspaces (tenants) — may already exist; add missing columns
alter table workspaces
  add column if not exists owner_id text,
  add column if not exists plan text default 'free';

-- Workspace membership (many-to-many) — may already exist; add missing columns
alter table workspace_members
  add column if not exists invited_by text;

drop index if exists workspaces_owner_idx;
create index if not exists workspaces_owner_idx on workspaces(owner_id);

-- Reconcile workspace_role enum values if the enum already existed without
-- all the values we rely on in RLS policies.
alter type workspace_role add value if not exists 'owner';
alter type workspace_role add value if not exists 'viewer';

-- =====================================================================
-- Helper: get current Clerk user id from JWT claim set by the server
-- =====================================================================

create or replace function current_clerk_user_id()
returns text
language sql
stable
as $$
  select current_setting('app.clerk_user_id', true)
$$;

create or replace function current_app_user_id()
returns text
language sql
stable
as $$
  select id from app_users where clerk_user_id = current_clerk_user_id() limit 1
$$;

create or replace function current_workspace_ids()
returns setof text
language sql
stable
as $$
  select workspace_id::text from workspace_members
  where user_id::text = current_app_user_id()
$$;

create or replace function is_workspace_member(ws text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from workspace_members
    where workspace_id::text = ws and user_id::text = current_app_user_id()
  )
$$;

-- =====================================================================
-- If brand/video tables don't exist yet, add workspace_id when they do.
-- (No-ops if tables don't exist in this project's schema.)
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_dna') THEN
    EXECUTE 'alter table brand_dna add column if not exists workspace_id uuid references workspaces(id) on delete cascade';
    CREATE INDEX IF NOT EXISTS brand_dna_workspace_idx ON brand_dna(workspace_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_campaigns') THEN
    EXECUTE 'alter table brand_campaigns add column if not exists workspace_id uuid references workspaces(id) on delete cascade';
    CREATE INDEX IF NOT EXISTS brand_campaigns_workspace_idx ON brand_campaigns(workspace_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_assets') THEN
    EXECUTE 'alter table brand_assets add column if not exists workspace_id uuid references workspaces(id) on delete cascade';
    CREATE INDEX IF NOT EXISTS brand_assets_workspace_idx ON brand_assets(workspace_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_photoshoots') THEN
    EXECUTE 'alter table brand_photoshoots add column if not exists workspace_id uuid references workspaces(id) on delete cascade';
    CREATE INDEX IF NOT EXISTS brand_photoshoots_workspace_idx ON brand_photoshoots(workspace_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_animations') THEN
    EXECUTE 'alter table brand_animations add column if not exists workspace_id uuid references workspaces(id) on delete cascade';
    CREATE INDEX IF NOT EXISTS brand_animations_workspace_idx ON brand_animations(workspace_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'videco_videos') THEN
    EXECUTE 'alter table videco_videos add column if not exists workspace_id uuid references workspaces(id) on delete cascade';
    CREATE INDEX IF NOT EXISTS videco_videos_workspace_idx ON videco_videos(workspace_id);
  END IF;
END $$;
