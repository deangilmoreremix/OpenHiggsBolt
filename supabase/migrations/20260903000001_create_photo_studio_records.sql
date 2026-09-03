-- Photo Studio job history
--
// Persists Photo Studio generation records per user so history survives
// server restarts and multi-instance deployments. Each row is scoped to
// `clerk_user_id` so users can only read their own records.

create table if not exists public.photo_studio_records (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null,
  request_id text unique,
  brand_id text,
  image_url text not null,
  style text not null,
  category text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photo_studio_records_clerk_user_id_idx
  on public.photo_studio_records(clerk_user_id);

create index if not exists photo_studio_records_request_id_idx
  on public.photo_studio_records(request_id);

alter table public.photo_studio_records enable row level security;

create policy "Users can view own photo records"
  on public.photo_studio_records for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Users can insert own photo records"
  on public.photo_studio_records for insert
  with check (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Users can update own photo records"
  on public.photo_studio_records for update
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Service role can manage photo records"
  on public.photo_studio_records for all
  using (true) with check (true);
