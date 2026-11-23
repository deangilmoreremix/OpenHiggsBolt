-- Source-scoped saved-project list.
--
-- `personalization_saved_projects_list` returns the caller's 50 most recently
-- updated rows. The project route used to narrow that list to one source demo
-- AFTER the limit, so a source whose latest row was older than the caller's 50
-- newest rows could never be restored. This function applies the source filter
-- inside the query, before the limit.
--
-- The demo id lives at `source->>'id'` (see `projectRowFromState` in
-- `src/shared/personalization/supabaseProjectPersistence.ts` and
-- `readSourceDemoId` in `app/api/personalization/project/route.ts`).
--
-- Same ownership model as the other saved-project RPCs: SECURITY DEFINER, the
-- identity is set as the GUC the RLS policies read, search_path is pinned, and
-- only the server-side roles may execute it.

create or replace function public.personalization_saved_projects_list_by_source(
  p_clerk_user_id text,
  p_source_id text
)
returns setof public.personalization_saved_projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_clerk_user_id is null or p_clerk_user_id = '' then
    raise exception 'personalization_saved_projects_list_by_source: clerk_user_id is required'
      using errcode = '28000';
  end if;
  if p_source_id is null or p_source_id = '' then
    raise exception 'personalization_saved_projects_list_by_source: source_id is required'
      using errcode = '22023';
  end if;
  perform set_config('app.clerk_user_id', p_clerk_user_id, true);
  return query
    select * from public.personalization_saved_projects
    where clerk_user_id = p_clerk_user_id
      and source->>'id' = p_source_id
    order by updated_at desc
    limit 50;
end;
$$;

-- Supports the per-user, per-source lookup above.
create index if not exists personalization_saved_projects_user_source_updated_idx
  on public.personalization_saved_projects (clerk_user_id, (source->>'id'), updated_at desc);

revoke all on function public.personalization_saved_projects_list_by_source(text, text) from public, anon, authenticated;
