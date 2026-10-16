-- Anonymous demo discovery: cross-instance quota + shared result cache.
--
-- NAMESPACE: this database is shared by several applications, so every object
-- here is named `personalization_demo_*` (matching this app's existing
-- `personalization_*` tables) and is labelled with a `comment on table` at the
-- end of this file, so ownership is unambiguous. Service-role only.
--
-- `lib/rateLimit.ts` keeps its buckets in process memory, so on Netlify every
-- Lambda instance owns its own bucket and a caller that can reach several
-- instances gets several buckets. `POST /api/demo/discover` is an anonymous
-- route that performs outbound HTTP on the operator's behalf, so its limit has
-- to be shared across instances, and the whole "may this caller proceed?"
-- decision has to be atomic (two concurrent invocations must not both read the
-- old count and both pass).
--
-- Two tables, three RPCs, all called only through the service-role client
-- (`src/lib/supabase.ts createServerClient()`), which is what the routes use:
--
--   public.personalization_demo_discovery_limits     + public.personalization_demo_consume_quota(p_key, p_max, p_window_ms)
--   public.personalization_demo_discovery_cache      + public.personalization_demo_discovery_cache_get(p_url)
--                                   + public.personalization_demo_discovery_cache_put(p_url, p_payload, p_ttl_ms)
--
-- No identity is stored anywhere. `personalization_demo_discovery_limits.p_key` is a rate-limit
-- key (an anonymous IP, or the single shared `anon` bucket) and
-- `personalization_demo_discovery_cache.cache_key` is the canonical website URL. The cache row
-- holds only the public asset list of a public website -- no user data, no IP,
-- no token.
--
-- FAIL CLOSED is the route's job and the database's: the RPCs validate their
-- arguments and raise rather than guess, RLS is enabled with no policies (so a
-- browser client with the anon key can neither read nor write), and execute is
-- revoked from public/anon/authenticated so only the server-side role can call
-- them. If Supabase is unreachable the route answers 503 instead of letting
-- unlimited anonymous traffic through.

-- ---------------------------------------------------------------------------
-- Table: personalization_demo_discovery_limits
-- ---------------------------------------------------------------------------

create table if not exists public.personalization_demo_discovery_limits (
  quota_key         text primary key,
  window_started_at timestamptz not null default now(),
  window_expires_at timestamptz not null default now(),
  request_count     integer not null default 1,
  updated_at        timestamptz not null default now(),
  constraint pz_demo_limits_request_count_non_negative
    check (request_count >= 0)
);

comment on table public.personalization_demo_discovery_limits is
  'Cross-instance request counters for the anonymous demo endpoint. Keyed by a rate-limit key (anonymous IP), never by a user identity.';

create index if not exists personalization_demo_discovery_limits_window_expires_at_idx
  on public.personalization_demo_discovery_limits (window_expires_at);

-- ---------------------------------------------------------------------------
-- Table: personalization_demo_discovery_cache
-- ---------------------------------------------------------------------------

create table if not exists public.personalization_demo_discovery_cache (
  cache_key  text primary key,
  payload    jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.personalization_demo_discovery_cache is
  'Shared demo discovery results keyed by canonical website URL. Holds the public asset list only: no caller identity, IP or token.';

create index if not exists personalization_demo_discovery_cache_expires_at_idx
  on public.personalization_demo_discovery_cache (expires_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Enabled with no policies: the fail-closed default for a browser/anon client.
-- The route is the only reader and writer, through the service role.

alter table public.personalization_demo_discovery_limits enable row level security;
alter table public.personalization_demo_discovery_cache enable row level security;

-- ---------------------------------------------------------------------------
-- RPC: personalization_demo_consume_quota(p_key text, p_max int, p_window_ms bigint)
-- ---------------------------------------------------------------------------
-- Atomically increments the counter for `p_key` inside a single INSERT ... ON
-- CONFLICT DO UPDATE, so concurrent invocations cannot both observe the
-- pre-increment count. A window that has already expired restarts at 1 rather
-- than continuing to count against the old window.
--
-- Returns jsonb: { allowed, remaining, retry_after_ms, window_expires_at }.
-- `allowed` is false once the count passes p_max, and `retry_after_ms` is the
-- time left in the current window so the route can set Retry-After.
--
-- SECURITY DEFINER so the function owns the write regardless of the calling
-- role; search_path is pinned to prevent search-path hijacking.

create or replace function public.personalization_demo_consume_quota(
  p_key text,
  p_max integer,
  p_window_ms bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_count integer;
  v_window_expires timestamptz;
  v_allowed boolean;
  v_retry_after_ms bigint;
  v_window_seconds double precision;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'personalization_demo_consume_quota: p_key is required'
      using errcode = '22023';
  end if;
  if p_max is null or p_max < 1 then
    raise exception 'personalization_demo_consume_quota: p_max must be at least 1'
      using errcode = '22023';
  end if;
  if p_window_ms is null or p_window_ms < 1000 then
    raise exception 'personalization_demo_consume_quota: p_window_ms must be at least 1000'
      using errcode = '22023';
  end if;

  v_window_seconds := (p_window_ms::double precision / 1000.0);

  insert into public.personalization_demo_discovery_limits
    (quota_key, window_started_at, window_expires_at, request_count, updated_at)
  values
    (p_key,
     now(),
     now() + make_interval(secs => v_window_seconds),
     1,
     now())
  on conflict (quota_key) do update
    set request_count = case
          when personalization_demo_discovery_limits.window_expires_at <= now() then 1
          else personalization_demo_discovery_limits.request_count + 1
        end,
        window_started_at = case
          when personalization_demo_discovery_limits.window_expires_at <= now() then now()
          else personalization_demo_discovery_limits.window_started_at
        end,
        window_expires_at = case
          when personalization_demo_discovery_limits.window_expires_at <= now()
            then now() + make_interval(secs => v_window_seconds)
          else personalization_demo_discovery_limits.window_expires_at
        end,
        updated_at = now()
  returning request_count, window_expires_at
  into v_request_count, v_window_expires;

  v_allowed := v_request_count <= p_max;
  v_retry_after_ms := case
    when v_allowed then 0
    else greatest(
      0,
      ceil(extract(epoch from (v_window_expires - now())) * 1000)
    )::bigint
  end;

  return jsonb_build_object(
    'allowed', v_allowed,
    'remaining', greatest(0, p_max - v_request_count),
    'retry_after_ms', v_retry_after_ms,
    'window_expires_at',
      to_char(v_window_expires at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: personalization_demo_discovery_cache_get(p_url text)
-- ---------------------------------------------------------------------------
-- Returns the cached payload for `p_url`, or NULL when there is no row or the
-- row's TTL has elapsed. Expiry is evaluated by the database, so every
-- instance agrees on freshness.

create or replace function public.personalization_demo_discovery_cache_get(p_url text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payload jsonb;
begin
  if p_url is null or btrim(p_url) = '' then
    return null;
  end if;

  select payload into v_payload
  from public.personalization_demo_discovery_cache
  where cache_key = p_url
    and expires_at > now();

  return v_payload;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: personalization_demo_discovery_cache_put(p_url text, p_payload jsonb, p_ttl_ms bigint)
-- ---------------------------------------------------------------------------
-- Upsert: a Netlify fan-out that crawls the same site concurrently converges on
-- one row instead of duplicating work. `p_ttl_ms` is supplied by the route
-- (6 hours) so the freshness policy stays in code.

create or replace function public.personalization_demo_discovery_cache_put(
  p_url text,
  p_payload jsonb,
  p_ttl_ms bigint
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ttl_ms bigint;
begin
  if p_url is null or btrim(p_url) = '' or p_payload is null then
    return;
  end if;

  v_ttl_ms := case
    when p_ttl_ms is null or p_ttl_ms < 0 then 0
    else p_ttl_ms
  end;

  insert into public.personalization_demo_discovery_cache
    (cache_key, payload, expires_at, created_at, updated_at)
  values
    (p_url,
     p_payload,
     now() + make_interval(secs => (v_ttl_ms::double precision / 1000.0)),
     now(),
     now())
  on conflict (cache_key) do update
    set payload = excluded.payload,
        expires_at = excluded.expires_at,
        updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Server-side role only. The anon and authenticated browser roles receive
-- nothing: the anon key ships in the browser bundle, and a caller that could
-- invoke these directly could mint quota buckets or poison the shared cache.

revoke all on function public.personalization_demo_consume_quota(text, integer, bigint) from public, anon, authenticated;
revoke all on function public.personalization_demo_discovery_cache_get(text) from public, anon, authenticated;
revoke all on function public.personalization_demo_discovery_cache_put(text, jsonb, bigint) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ownership labels (this database is shared by several applications).
-- ---------------------------------------------------------------------------
comment on table public.personalization_demo_discovery_limits is
  'OpenHiggsBolt / SmartVideo GO - anonymous Find-My-Brand discovery rate limiting. '
  'Cross-instance quota counters for POST /api/demo/discover (src/server/demoRateLimit.ts). '
  'Shared database: namespaced personalization_demo_*. Service-role only.';

comment on table public.personalization_demo_discovery_cache is
  'OpenHiggsBolt / SmartVideo GO - shared cache of anonymous discovery results. '
  'Public asset URLs and page metadata only, no customer data (src/server/demoDiscovery.ts). '
  'Shared database: namespaced personalization_demo_*. Service-role only.';
