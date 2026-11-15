-- landing_sync_settings.sql
-- One row per user holding their own MailerLite API key (AES-256-GCM, same helper as the muapi / OpenAI keys),
-- so Video Pages can send a page's contacts (with their personal links) to the user's MailerLite account.
-- RLS is ON with no policies: only the server (service role) reads or writes it, scoped by clerk_user_id.
-- The key is never returned to the browser. Idempotent.

create table if not exists public.landing_sync_settings (
  clerk_user_id text primary key,
  provider text not null default 'mailerlite' check (provider in ('mailerlite')),
  api_key_enc text not null,
  updated_at timestamptz not null default now()
);

alter table public.landing_sync_settings enable row level security;
