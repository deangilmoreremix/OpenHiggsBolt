-- Personalization outputs table
--
-- Persists personalization generation results per user so history survives
-- server restarts and multi-instance deployments. Each row is scoped to
-- `clerk_user_id` so users can only read their own records.

create table if not exists public.personalization_outputs (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  origin_studio text not null default 'demo-personalization',
  source_type text not null,
  source_demo_id text,
  source_demo_slug text,
  viral_record_id text,
  source_media text,
  source_url text,
  personalization_mode text,
  model text,
  original_prompt text not null,
  personalized_prompt text not null,
  identity_asset_ids text[] not null default '{}',
  logo_asset_ids text[] not null default '{}',
  product_asset_ids text[] not null default '{}',
  brand_reference_asset_ids text[] not null default '{}',
  first_frame_asset_id text,
  last_frame_asset_id text,
  output_urls text[] not null default '{}',
  output_type text not null,
  client_id text,
  created_at timestamptz not null default now()
);

create index if not exists personalization_outputs_clerk_user_id_idx
  on public.personalization_outputs(clerk_user_id);

create index if not exists personalization_outputs_created_at_idx
  on public.personalization_outputs(created_at desc);

alter table public.personalization_outputs enable row level security;

create policy "Users can view own personalization outputs"
  on public.personalization_outputs for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Users can insert own personalization outputs"
  on public.personalization_outputs for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));
