-- reconcile: add missing columns without dropping live tables
alter table workspaces
  add column if not exists owner_id text,
  add column if not exists plan text default 'free';

alter table workspace_members
  add column if not exists invited_by text;

create table if not exists app_users (
  id text primary key,
  clerk_user_id text unique not null,
  email text unique,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists app_users_clerk_id_idx on app_users(clerk_user_id);
create index if not exists workspaces_owner_idx on workspaces(owner_id);

create or replace function current_clerk_user_id()
returns text
language sql
stable
as $$
  select current_setting('app.clerk_user_id', true)
$$;

create or replace function current_app_user_id()
returns text
language sql
stable
as $$
  select id from app_users where clerk_user_id = current_clerk_user_id() limit 1
$$;

create or replace function current_workspace_ids()
returns setof text
language sql
stable
as $$
  select workspace_id::text from workspace_members
  where user_id::text = current_app_user_id()
$$;

create or replace function is_workspace_member(ws text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from workspace_members
    where workspace_id::text = ws and user_id::text = current_app_user_id()
  )
$$;
