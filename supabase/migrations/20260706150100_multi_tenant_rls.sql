-- Multi-tenant RLS for existing per-request auth
-- Works with the reconciled schema where IDs are text and
-- current_app_user_id / current_workspace_ids / is_workspace_member are in place.

-- app_users: scoped to own row
alter table app_users enable row level security;

drop policy if exists "app_users_self_select" on app_users;
drop policy if exists "app_users_self_update" on app_users;
drop policy if exists "app_users_self_insert" on app_users;

create policy "app_users_self_select" on app_users
  for select to authenticated
  using (clerk_user_id = current_clerk_user_id());

create policy "app_users_self_update" on app_users
  for update to authenticated
  using (clerk_user_id = current_clerk_user_id())
  with check (clerk_user_id = current_clerk_user_id());

create policy "app_users_self_insert" on app_users
  for insert to authenticated
  with check (clerk_user_id = current_clerk_user_id());

-- workspaces: member can read, owner can manage
alter table workspaces enable row level security;

drop policy if exists "workspaces_member_select" on workspaces;
drop policy if exists "workspaces_owner_update" on workspaces;
drop policy if exists "workspaces_owner_delete" on workspaces;
drop policy if exists "workspaces_authenticated_insert" on workspaces;

create policy "workspaces_member_select" on workspaces
  for select to authenticated
  using (is_workspace_member(id::text));

create policy "workspaces_authenticated_insert" on workspaces
  for insert to authenticated
  with check (owner_id::text = current_app_user_id());

create policy "workspaces_owner_update" on workspaces
  for update to authenticated
  using (owner_id::text = current_app_user_id())
  with check (owner_id::text = current_app_user_id());

create policy "workspaces_owner_delete" on workspaces
  for delete to authenticated
  using (owner_id::text = current_app_user_id());

-- workspace_members: visible to fellow members, owners/admins can mutate
alter table workspace_members enable row level security;

drop policy if exists "workspace_members_select" on workspace_members;
drop policy if exists "workspace_members_admin_insert" on workspace_members;
drop policy if exists "workspace_members_admin_update" on workspace_members;
drop policy if exists "workspace_members_admin_delete" on workspace_members;

create policy "workspace_members_select" on workspace_members
  for select to authenticated
  using (is_workspace_member(workspace_id::text));

create policy "workspace_members_admin_insert" on workspace_members
  for insert to authenticated
  with check (
    exists(
      select 1 from workspace_members wm
      where wm.workspace_id::text = workspace_members.workspace_id::text
        and wm.user_id::text = current_app_user_id()
        and wm.role::text in ('owner', 'admin')
    )
  );

create policy "workspace_members_admin_update" on workspace_members
  for update to authenticated
  using (
    exists(
      select 1 from workspace_members wm
      where wm.workspace_id::text = workspace_members.workspace_id::text
        and wm.user_id::text = current_app_user_id()
        and wm.role::text in ('owner', 'admin')
    )
  )
  with check (
    exists(
      select 1 from workspace_members wm
      where wm.workspace_id::text = workspace_members.workspace_id::text
        and wm.user_id::text = current_app_user_id()
        and wm.role::text in ('owner', 'admin')
    )
  );

create policy "workspace_members_admin_delete" on workspace_members
  for delete to authenticated
  using (
    exists(
      select 1 from workspace_members wm
      where wm.workspace_id::text = workspace_members.workspace_id::text
        and wm.user_id::text = current_app_user_id()
        and wm.role::text in ('owner', 'admin')
    )
  );
