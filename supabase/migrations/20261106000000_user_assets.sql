-- Shared per-user asset library (images, videos, audio the user uploaded or generated).
--
-- Files live in the public `uploads` bucket under smartvideo/<user>/library/; this table only lists them so
-- every studio can show "your uploads" and reuse them. Ownership uses the Clerk identity, like the other
-- per-user tables. Only the server (service role) reads or writes this table, so RLS is enabled with no
-- policies: anon/authenticated keys get nothing.

create table if not exists public.user_assets (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  kind          text not null check (kind in ('image', 'video', 'audio')),
  source        text not null default 'upload' check (source in ('upload', 'result')),
  name          text not null default '',
  url           text not null,
  storage_path  text,
  created_at    timestamptz not null default now(),
  unique (clerk_user_id, url)
);

create index if not exists user_assets_user_created_idx
  on public.user_assets (clerk_user_id, created_at desc);

alter table public.user_assets enable row level security;
