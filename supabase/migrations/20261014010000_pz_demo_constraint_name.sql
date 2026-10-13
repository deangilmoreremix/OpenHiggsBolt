-- ---------------------------------------------------------------------------
-- Postgres truncates identifiers at 63 bytes, so the original
-- `personalization_demo_discovery_limits_request_count_non_negative` was stored
-- truncated as `..._non_negativ`. Shorten it to something that fits and is
-- unambiguous in this shared database. Idempotent.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.personalization_demo_discovery_limits'::regclass
      and conname = 'pz_demo_limits_request_count_non_negative'
  ) then
    return;
  end if;

  alter table public.personalization_demo_discovery_limits
    drop constraint if exists personalization_demo_discovery_limits_request_count_non_negativ;
  alter table public.personalization_demo_discovery_limits
    drop constraint if exists personalization_demo_discovery_limits_request_count_non_negative;
  alter table public.personalization_demo_discovery_limits
    add constraint pz_demo_limits_request_count_non_negative check (request_count >= 0);
end $$;
