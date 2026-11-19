-- ===========================================================================
-- mcp_keys.sql
--
-- Long-lived SmartVideo GO MCP keys. A signed-in user creates one in the app; the
-- gateway (app/api/mcp-gateway) resolves it to the Clerk user and then uses that
-- user's own, already-encrypted generation key from app_users.muapi_key.
--
-- Only a SHA-256 hash of the key is stored (the raw key is shown once). No secret
-- is stored here. RLS is on and anon/authenticated have no grants: only the
-- service role (Next route handlers) can read or write this table.
-- ===========================================================================

create table if not exists public.mcp_keys (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  label text not null default 'MCP key',
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists mcp_keys_user_idx on public.mcp_keys (clerk_user_id) where revoked_at is null;

alter table public.mcp_keys enable row level security;
revoke all on table public.mcp_keys from anon, authenticated;
