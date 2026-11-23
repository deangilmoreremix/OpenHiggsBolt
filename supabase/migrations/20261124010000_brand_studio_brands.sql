-- ===========================================================================
-- brand_studio_brands.sql
-- Durable home for the lightweight Brand Studio brands that /api/brands and /api/brand used to keep in a per-instance Map
-- (lost on restart or scale-out). Owner-scoped by Clerk user id; service role only (RLS on, no client grants), and every query in
-- src/shared/brandRepo.ts filters on clerk_user_id. No data is migrated: the old Map was ephemeral.
-- ===========================================================================
create table if not exists public.brand_studio_brands (
  id text primary key,
  clerk_user_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists brand_studio_brands_owner_idx on public.brand_studio_brands (clerk_user_id, created_at desc);
alter table public.brand_studio_brands enable row level security;
revoke all on table public.brand_studio_brands from anon, authenticated;
