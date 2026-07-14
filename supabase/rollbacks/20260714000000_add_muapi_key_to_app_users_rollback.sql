-- Rollback: remove the persisted MuAPI key column.
alter table app_users
  drop column if exists muapi_key;
