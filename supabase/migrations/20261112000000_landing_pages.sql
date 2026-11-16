-- landing_pages.sql
-- Video Pages: any video becomes a personalised landing page (editable page data, per-contact links,
-- viewer events, lead capture). Ported from the SmartVideo editor.
--
-- Access model (same as user_assets / generated_videos in this repo):
--   * Row Level Security is ON and there are NO policies, so the anon and authenticated roles can read
--     and write nothing directly. The browser never talks to these tables.
--   * Every read and write goes through Next.js routes using the service-role client. Owner routes scope
--     every query with clerk_user_id = <Clerk userId>; the public page and the public event/lead routes
--     only ever touch rows of PUBLISHED pages.
--   * The helper functions below are executable by the service role only.
-- Idempotent: safe to re-run.

create table if not exists public.landing_pages (
  id text primary key
    check (id ~ '^[A-Za-z0-9_-]{8,32}$'),
  clerk_user_id text not null,
  title text not null default 'Untitled page'
    check (char_length(title) <= 200),
  video_url text not null
    check (video_url ~ '^https://' and char_length(video_url) <= 2048),
  poster_url text
    check (poster_url is null or (poster_url ~ '^https://' and char_length(poster_url) <= 2048)),
  duration numeric
    check (duration is null or duration >= 0),
  source jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_pages_source_is_object check (jsonb_typeof(source) = 'object'),
  constraint landing_pages_config_is_object check (jsonb_typeof(config) = 'object'),
  constraint landing_pages_config_size check (pg_column_size(config) < 262144)
);

create index if not exists landing_pages_owner_idx
  on public.landing_pages (clerk_user_id, updated_at desc);

alter table public.landing_pages enable row level security;

create or replace function public.landing_pages_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists landing_pages_touch on public.landing_pages;
create trigger landing_pages_touch
  before update on public.landing_pages
  for each row execute function public.landing_pages_touch();

-- One row per person a page is personalised for. `fields` holds the CSV columns (firstname, company, email...).
create table if not exists public.landing_page_contacts (
  id text primary key
    check (id ~ '^[A-Za-z0-9_-]{6,40}$'),
  page_id text not null references public.landing_pages (id) on delete cascade,
  clerk_user_id text not null,
  fields jsonb not null default '{}'::jsonb,
  external jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint landing_page_contacts_fields_is_object check (jsonb_typeof(fields) = 'object'),
  constraint landing_page_contacts_fields_size check (pg_column_size(fields) < 8192),
  constraint landing_page_contacts_external_is_object check (jsonb_typeof(external) = 'object')
);

create index if not exists landing_page_contacts_page_idx
  on public.landing_page_contacts (page_id, created_at desc);
create index if not exists landing_page_contacts_owner_idx
  on public.landing_page_contacts (clerk_user_id);

alter table public.landing_page_contacts enable row level security;

-- Viewer activity. Written only by the server, only for published pages.
create table if not exists public.landing_page_events (
  id bigint generated always as identity primary key,
  page_id text not null references public.landing_pages (id) on delete cascade,
  contact_id text
    check (contact_id is null or contact_id ~ '^[A-Za-z0-9_-]{1,80}$'),
  kind text not null
    check (kind in ('view', 'play', 'progress_25', 'progress_50', 'progress_75', 'complete', 'cta_click', 'lead', 'like')),
  created_at timestamptz not null default now()
);

create index if not exists landing_page_events_page_idx
  on public.landing_page_events (page_id, contact_id, kind);

alter table public.landing_page_events enable row level security;

-- Lead-form submissions from a published page.
create table if not exists public.landing_page_leads (
  id bigint generated always as identity primary key,
  page_id text not null references public.landing_pages (id) on delete cascade,
  contact_id text
    check (contact_id is null or contact_id ~ '^[A-Za-z0-9_-]{1,80}$'),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint landing_page_leads_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint landing_page_leads_data_size check (pg_column_size(data) < 8192)
);

create index if not exists landing_page_leads_page_idx
  on public.landing_page_leads (page_id, created_at desc);

alter table public.landing_page_leads enable row level security;

-- Record one viewer event for a PUBLISHED page; a 'view' also bumps the page's counter. Called by the server only.
create or replace function public.landing_page_record_event(
  p_page_id text,
  p_kind text,
  p_contact_id text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_kind not in ('view', 'play', 'progress_25', 'progress_50', 'progress_75', 'complete', 'cta_click', 'lead', 'like') then
    return;
  end if;
  if p_contact_id is not null and p_contact_id !~ '^[A-Za-z0-9_-]{1,80}$' then
    p_contact_id := null;
  end if;
  insert into public.landing_page_events (page_id, contact_id, kind)
  select p.id, p_contact_id, p_kind
    from public.landing_pages p
   where p.id = p_page_id and p.published = true;
  if p_kind = 'view' then
    update public.landing_pages
       set view_count = view_count + 1
     where id = p_page_id and published = true;
  end if;
end;
$$;

-- Totals for one page. The caller (server) has already checked the page belongs to the signed-in user.
create or replace function public.landing_page_stats(p_page_id text)
returns table (
  views bigint,
  plays bigint,
  completes bigint,
  cta_clicks bigint,
  leads bigint,
  unique_contacts bigint,
  likes bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  select count(*) filter (where e.kind = 'view'),
         count(*) filter (where e.kind = 'play'),
         count(*) filter (where e.kind = 'complete'),
         count(*) filter (where e.kind = 'cta_click'),
         count(*) filter (where e.kind = 'lead'),
         count(distinct e.contact_id),
         count(*) filter (where e.kind = 'like')
    from public.landing_page_events e
   where e.page_id = p_page_id;
$$;

create or replace function public.landing_page_events_by_contact(p_page_id text)
returns table (
  contact_id text,
  views bigint,
  plays bigint,
  max_progress integer,
  completes bigint,
  cta_clicks bigint,
  leads bigint,
  last_seen timestamptz
)
language sql
stable
set search_path = public, pg_temp
as $$
  select e.contact_id,
         count(*) filter (where e.kind = 'view'),
         count(*) filter (where e.kind = 'play'),
         coalesce(max(case e.kind
           when 'progress_25' then 25
           when 'progress_50' then 50
           when 'progress_75' then 75
           when 'complete' then 100
         end), 0),
         count(*) filter (where e.kind = 'complete'),
         count(*) filter (where e.kind = 'cta_click'),
         count(*) filter (where e.kind = 'lead'),
         max(e.created_at)
    from public.landing_page_events e
   where e.page_id = p_page_id
     and e.contact_id is not null
   group by e.contact_id
   order by max(e.created_at) desc;
$$;

revoke all on function public.landing_page_record_event(text, text, text) from public, anon, authenticated;
revoke all on function public.landing_page_stats(text) from public, anon, authenticated;
revoke all on function public.landing_page_events_by_contact(text) from public, anon, authenticated;
grant execute on function public.landing_page_record_event(text, text, text) to service_role;
grant execute on function public.landing_page_stats(text) to service_role;
grant execute on function public.landing_page_events_by_contact(text) to service_role;
