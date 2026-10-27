create table if not exists public.reseller_purchases (
  id text primary key default gen_random_uuid()::text,
  clerk_user_id text,
  email text not null,
  package_id text not null,
  entitlement_keys jsonb not null default '[]'::jsonb,
  stripe_session_id text,
  stripe_customer_id text,
  amount_total integer,
  currency text,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reseller_purchases_stripe_session_id_unique
  on public.reseller_purchases(stripe_session_id);

create unique index if not exists reseller_purchases_clerk_user_package_unique
  on public.reseller_purchases(clerk_user_id, package_id);

create index if not exists reseller_purchases_email_idx on public.reseller_purchases(email);
create index if not exists reseller_purchases_clerk_user_id_idx on public.reseller_purchases(clerk_user_id);

alter table public.reseller_purchases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reseller_purchases'
      and policyname = 'Users can view own reseller purchases'
  ) then
    create policy "Users can view own reseller purchases"
      on public.reseller_purchases for select
      using (clerk_user_id = current_setting('app.clerk_user_id', true));
  end if;
end $$;
