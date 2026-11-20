-- Finder continuity (E8) follow-up: a size cap on the durable enrichment cache, and an anonymous chain-flag summary.
-- APPLIED to the project via the Supabase tool as migration `finder_cache_cap_and_chain_summary` (2026-11-17),
-- approved by the owner in the plan. Recorded here so the repo matches the database.
--
-- Idempotent: `create index if not exists` / `create or replace function`, so replaying it is safe.
-- Rollback: restore the previous business_enrichment_cache_put from 20261115000100_finder_continuity_rpcs.sql and
--   drop function if exists public.finder_chain_flag_summary(integer);
--   drop index if exists public.business_enrichment_cache_fetched_idx;

-- Bounded durable cache: at most 5,000 rows and 64 KB per row; oldest evicted first. Signature unchanged,
-- so existing grants and callers keep working.
create index if not exists business_enrichment_cache_fetched_idx on public.business_enrichment_cache (fetched_at desc);

create or replace function public.business_enrichment_cache_put(p_host text, p_enrichment jsonb, p_ttl_seconds integer default 604800)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_max_rows constant integer := 5000; v_max_bytes constant integer := 65536;
begin
  if p_host is null or char_length(p_host) < 3 then
    raise exception 'business_enrichment_cache_put: host is required' using errcode = '22023';
  end if;
  -- The cache is best-effort: an oversized value is simply not stored.
  if p_enrichment is null or octet_length(p_enrichment::text) > v_max_bytes then return; end if;
  insert into public.business_enrichment_cache (host, enrichment, fetched_at, expires_at)
  values (lower(p_host), p_enrichment, now(), now() + make_interval(secs => least(greatest(coalesce(p_ttl_seconds, 604800), 60), 2592000)))
  on conflict (host) do update set enrichment = excluded.enrichment, fetched_at = now(), expires_at = excluded.expires_at;
  delete from public.business_enrichment_cache where expires_at < now() - interval '1 day';
  delete from public.business_enrichment_cache
    where host in (select host from public.business_enrichment_cache order by fetched_at desc offset v_max_rows);
end;
$$;

-- Aggregated, anonymous: which businesses at least N DIFFERENT users flagged "is a chain". No user ids returned.
-- It only reports; nothing reads it automatically and the chain registry is never edited by code.
create or replace function public.finder_chain_flag_summary(p_min_users integer default 3)
returns table (business_key text, distinct_users bigint, last_flagged_at timestamptz)
language sql security definer set search_path = public, pg_temp stable
as $$
  select business_id, count(distinct clerk_user_id), max(created_at)
  from public.finder_lead_feedback where reason = 'is_a_chain'
  group by business_id having count(distinct clerk_user_id) >= greatest(coalesce(p_min_users, 3), 2)
  order by 2 desc, 3 desc limit 100;
$$;
revoke all on function public.finder_chain_flag_summary(integer) from public, anon, authenticated;
grant execute on function public.finder_chain_flag_summary(integer) to service_role;
