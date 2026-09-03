create table if not exists public.user_entitlements (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text not null references public.users(id) on delete cascade,
  email text not null,
  entitlements jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  source text not null default 'manual',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_entitlements_clerk_user_id_idx on public.user_entitlements(clerk_user_id);
create index if not exists user_entitlements_email_idx on public.user_entitlements(email);
create unique index if not exists user_entitlements_clerk_user_id_unique on public.user_entitlements(clerk_user_id);

alter table public.user_entitlements enable row level security;

create policy "Users can view own entitlements"
  on public.user_entitlements for select
  using (clerk_user_id = current_setting('app.clerk_user_id', true));

create policy "Service role can manage entitlements"
  on public.user_entitlements for all
  using (true) with check (true);
