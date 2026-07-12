-- Clerk-synced users table
-- The app already provisions public.users; this migration ensures the schema
-- matches what app/api/webhooks/clerk/route.ts writes. `id` is the Clerk user id
-- so upserts stay idempotent. The create is a no-op when the table exists.

create table if not exists public.users (
  id              text primary key,                 -- Clerk user id (user_xxx)
  name            text not null,
  email           text not null unique,
  email_verified  boolean not null default false,
  image           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

alter table public.users enable row level security;

drop policy if exists "users readable by all" on public.users;
create policy "users readable by all"
  on public.users for select
  using (true);
