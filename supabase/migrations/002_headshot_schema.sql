-- ai-headshot-generator Supabase schema (multi-tenant, no auth)

create extension if not exists "uuid-ossp";

create table if not exists public.creations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null default 'default',
  category text,
  image_url text,
  is_pack boolean default false,
  aspect_ratio text,
  created_at timestamptz default now(),
  request_id text unique,
  status text default 'processing',
  error text
);

create index if not exists idx_creations_tenant on public.creations(tenant_id);
create index if not exists idx_creations_request on public.creations(request_id);
create index if not exists idx_creations_status on public.creations(status);

alter table public.creations enable row level security;
create policy "creations_private_access" on public.creations for all using (true) with check (true);
