import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Guards for the H5/H6 Row Level Security remediations plus the brand-table
 * owner-scoping migration.
 *
 * H5: personalization_discovery_jobs policies scoped to `auth.uid()::text`
 *     were inert under Clerk auth (auth.uid() is always NULL when the project
 *     authenticates with Clerk, not Supabase Auth). The fix migration must use
 *     the `current_setting('app.clerk_user_id', true)` idiom.
 *
 * H6: personalization_projects is created outside the migrations directory, so
 *     its live RLS state cannot be audited from source. The fix migration must
 *     enable RLS with owner-scoped policies WITHOUT creating or altering the
 *     table with a guessed schema.
 *
 * C1: the five brand_* tables carried `for all using (true) with check (true)`
 *     policies while the Supabase ANON key ships in the browser bundle, so any
 *     visitor could read / write / DELETE every tenant's brand data. The fix
 *     must scope every policy to the owning Clerk user id.
 *
 * Every migration must be re-runnable: `add column if not exists`,
 * `create index if not exists` and `drop policy if exists` before each
 * `create policy` make a second application a no-op.
 */

const BRAND_MIGRATION = 'supabase/migrations/20261010130000_brand_tables_owner_rls.sql'
const H5_FIX_MIGRATION = 'supabase/migrations/20261010160000_fix_discovery_jobs_rls_clerk.sql'
const H5_ORIGINAL_MIGRATION = 'supabase/migrations/20260928000000_create_personalization_discovery_jobs.sql'
const H6_MIGRATION = 'supabase/migrations/20261010160100_personalization_projects_owner_rls.sql'
const REFERENCE_MIGRATION = 'supabase/migrations/20260905000000_create_personalization_outputs.sql'

const BRAND_TABLES = ['brand_dna', 'brand_campaigns', 'brand_assets', 'brand_photoshoots', 'brand_animations']

const CLERK_PREDICATE = /clerk_user_id = current_setting\('app\.clerk_user_id', true\)/g

const read = (relativePath: string): string => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf-8')

/**
 * Strips `--` line comments so policy assertions inspect executable SQL only.
 * Migration comments legitimately name `auth.uid()` to document why it is not
 * used, which must not count as the policy still using it.
 */
const readSql = (relativePath: string): string => read(relativePath).replace(/--[^\n]*/g, '')

const countOf = (haystack: string, needle: string): number => haystack.split(needle).length - 1

type ProjectRow = { id: string; clerk_user_id: string }

const rows: ProjectRow[] = [
  { id: 'project-1', clerk_user_id: 'user_1' },
  { id: 'project-2', clerk_user_id: 'user_2' },
]

/**
 * Postgres semantics for the fixed predicate
 * `clerk_user_id = current_setting('app.clerk_user_id', true)`:
 * the `true` second argument makes a missing session setting return NULL
 * (instead of raising), and `value = NULL` is never true, so rows are filtered
 * out rather than matched. An anon browser client (src/lib/supabase.ts) never
 * calls set_config, which is exactly the fail-closed behaviour we want.
 */
function runSelectPolicy(rowsToFilter: ProjectRow[], sessionSetting: string | null): ProjectRow[] {
  if (sessionSetting === null) return []
  return rowsToFilter.filter((row) => row.clerk_user_id === sessionSetting)
}

/** The broken `auth.uid()::text` idiom: auth.uid() is always NULL under Clerk. */
function runInertAuthUidPolicy(rowsToFilter: ProjectRow[]): ProjectRow[] {
  const authUid: string | null = null
  return rowsToFilter.filter((row) => row.clerk_user_id === authUid)
}

describe('brand tables owner-scoped RLS migration (C1)', () => {
  const sql = readSql(BRAND_MIGRATION)

  it('adds the owner column to all five brand tables', () => {
    for (const table of BRAND_TABLES) {
      expect(sql).toMatch(new RegExp(`alter table ${table}\\s+add column if not exists clerk_user_id text;`))
    }
  })

  it('creates one owner index per brand table', () => {
    for (const table of BRAND_TABLES) {
      expect(sql).toContain(`create index if not exists ${table}_clerk_user_id_idx`)
    }
    expect(countOf(sql, 'create index if not exists')).toBe(BRAND_TABLES.length)
  })

  it('replaces the public `using (true)` policies with owner-scoped select/insert/update/delete policies', () => {
    for (const table of BRAND_TABLES) {
      expect(sql).toContain(`drop policy if exists "public all ${table}" on ${table};`)
      expect(sql).toContain(`create policy "${table}_owner_select" on ${table}`)
      expect(sql).toContain(`create policy "${table}_owner_insert" on ${table}`)
      expect(sql).toContain(`create policy "${table}_owner_update" on ${table}`)
      expect(sql).toContain(`create policy "${table}_owner_delete" on ${table}`)
    }
    // 4 policies per table, 5 tables.
    expect(countOf(sql, 'create policy')).toBe(BRAND_TABLES.length * 4)
  })

  it('uses the Clerk GUC idiom for every policy and never auth.uid()', () => {
    expect(sql).not.toContain('auth.uid()')
    expect(sql).not.toContain('using (true)')
    expect(sql.match(CLERK_PREDICATE) ?? []).toHaveLength(BRAND_TABLES.length * 5)
  })

  it('keeps row level security enabled on all five tables', () => {
    for (const table of BRAND_TABLES) {
      expect(sql).toMatch(new RegExp(`alter table ${table}\\s+enable row level security;`))
    }
  })
})

describe('H5 fix migration (personalization_discovery_jobs RLS)', () => {
  const sql = readSql(H5_FIX_MIGRATION)

  it('no longer references auth.uid()', () => {
    expect(sql).not.toContain('auth.uid()')
  })

  it('drops the three inert policies before recreating them (re-runnable)', () => {
    expect(sql).toContain('drop policy if exists "Users can view own discovery jobs"')
    expect(sql).toContain('drop policy if exists "Users can insert own discovery jobs"')
    expect(sql).toContain('drop policy if exists "Users can update own discovery jobs"')
    expect(countOf(sql, 'drop policy if exists')).toBe(3)
  })

  it('keeps row level security enabled', () => {
    expect(sql).toMatch(/alter table public\.personalization_discovery_jobs enable row level security/)
  })

  it('recreates select/insert/update policies with the Clerk idiom (4 predicates)', () => {
    expect(sql).toContain('for select')
    expect(sql).toContain('for insert')
    expect(sql).toContain('for update')
    expect(sql.match(CLERK_PREDICATE) ?? []).toHaveLength(4)
  })

  it('copies the exact predicate used by the reference personalization_outputs migration', () => {
    const reference = read(REFERENCE_MIGRATION)
    const predicate = "using (clerk_user_id = current_setting('app.clerk_user_id', true))"
    expect(reference).toContain(predicate)
    expect(sql).toContain(predicate)
    expect(sql).toContain("with check (clerk_user_id = current_setting('app.clerk_user_id', true))")
  })

  it('does not modify the original applied migration (it keeps the broken idiom)', () => {
    const original = read(H5_ORIGINAL_MIGRATION)
    expect(original.match(/auth\.uid\(\)::text/g) ?? []).toHaveLength(3)
    expect(original).toContain('clerk_user_id = auth.uid()::text')
  })
})

describe('H6 fix migration (personalization_projects RLS)', () => {
  const sql = readSql(H6_MIGRATION)

  it('does not create the table with a guessed schema or alter existing columns', () => {
    expect(sql).not.toMatch(/create table/i)
    expect(sql).not.toMatch(/add column/i)
    expect(sql).not.toMatch(/drop column/i)
  })

  it('enables RLS guarded on table existence', () => {
    // RLS is enabled by a conditional `execute` inside the DO block, after
    // both guards, so it only runs when the table exists AND carries the
    // owner column.
    expect(sql).toContain("execute 'alter table public.personalization_projects enable row level security';")

    const enableAt = sql.search(/alter table public\.personalization_projects enable row level security/)
    const doStartAt = sql.search(/do \$\$/)
    const doEndAt = sql.search(/end\s*\$\$;/)
    const tableGuardAt = sql.search(/relname = 'personalization_projects'/)
    const noticeAt = sql.search(/raise notice/)
    const returnAt = sql.search(/\breturn;/)
    const columnGuardAt = sql.search(/attname = 'clerk_user_id'/)
    const exceptionAt = sql.search(/raise exception/)

    // the enable lives inside the DO block that holds both guards
    expect(doStartAt).toBeGreaterThan(-1)
    expect(doEndAt).toBeGreaterThan(-1)
    expect(enableAt).toBeGreaterThan(doStartAt)
    expect(enableAt).toBeLessThan(doEndAt)

    // table-existence guard: an absent table raises a notice and returns
    // before the enable is reached, so the refuse path changes nothing
    expect(tableGuardAt).toBeGreaterThan(-1)
    expect(tableGuardAt).toBeLessThan(enableAt)
    expect(noticeAt).toBeGreaterThan(-1)
    expect(returnAt).toBeGreaterThan(noticeAt)
    expect(returnAt).toBeLessThan(enableAt)

    // clerk_user_id guard: a table without the owner column aborts the whole
    // migration (single transaction) before RLS is enabled
    expect(columnGuardAt).toBeGreaterThan(-1)
    expect(columnGuardAt).toBeLessThan(enableAt)
    expect(exceptionAt).toBeGreaterThan(columnGuardAt)
    expect(exceptionAt).toBeLessThan(enableAt)
  })

  it('guards policy creation on the table and clerk_user_id column existing (fails safe)', () => {
    expect(sql).toContain("attname = 'clerk_user_id'")
    expect(sql).toContain('raise notice')
    // A table that exists but lacks clerk_user_id now FAILS LOUD: the guard
    // raises a hard exception, which aborts the whole migration (migrations
    // apply in a single transaction), so the refuse path changes nothing.
    expect(sql).toContain('raise exception')
    expect(sql).toMatch(/raise exception 'H6 REFUSING TO RUN/)
    // exactly one of each: the missing-column path is the loud one, the
    // absent-table path stays a notice-only no-op
    expect(countOf(sql, 'raise exception')).toBe(1)
    expect(countOf(sql, 'raise notice')).toBe(1)
    // re-runnable: policies are dropped if present before being created, and
    // the fifth drop removes the inert live `Users can manage own projects`
    // policy so the happy path converges.
    expect(sql).toContain('drop policy if exists "Users can manage own projects" on public.personalization_projects')
    expect(countOf(sql, 'drop policy if exists')).toBe(5)
  })

  it('creates select/insert/update/delete policies with the Clerk idiom (5 predicates)', () => {
    expect(sql).toContain('for select')
    expect(sql).toContain('for insert')
    expect(sql).toContain('for update')
    expect(sql).toContain('for delete')
    expect(sql.match(CLERK_PREDICATE) ?? []).toHaveLength(5)
    expect(sql).not.toContain('auth.uid()')
  })
})

describe('idempotency: applying the migrations twice is a no-op', () => {
  it('brand migration re-runs via add column if not exists / create index if not exists / drop policy if exists', () => {
    const sql = readSql(BRAND_MIGRATION)
    expect(countOf(sql, 'add column if not exists')).toBe(BRAND_TABLES.length)
    // Every create policy is preceded by its own drop policy if exists, so a
    // second application converges instead of erroring on a duplicate name.
    expect(countOf(sql, 'create policy')).toBe(BRAND_TABLES.length * 4)
    // Each table drops its `public all {table}` policy, the four LIVE legacy
    // `{table}_{select,insert,update,delete}` policies, and its own four
    // owner policies: 9 drops per table, so a second run converges on any
    // database in either state.
    expect(countOf(sql, 'drop policy if exists')).toBe(BRAND_TABLES.length * 9)
    // Pin the defect the correction fixed: the four live out-of-band legacy
    // policy names must be dropped for every table. Postgres ORs per-command
    // permissive policies together, so leaving them in place would keep
    // granting every workspace member access to every row of the workspace.
    for (const table of BRAND_TABLES) {
      for (const command of ['select', 'insert', 'update', 'delete']) {
        expect(sql).toContain(`drop policy if exists "${table}_${command}" on ${table};`)
      }
    }
  })

  it('H5 fix migration re-runs via drop policy if exists + no-op enable', () => {
    const sql = readSql(H5_FIX_MIGRATION)
    expect(countOf(sql, 'drop policy if exists')).toBe(countOf(sql, 'create policy'))
    // `enable row level security` is a no-op once RLS is on.
    expect(countOf(sql, 'enable row level security')).toBe(1)
  })

  it('H6 fix migration re-runs via drop policy if exists and a no-op enable', () => {
    const sql = readSql(H6_MIGRATION)
    // Every recreated policy is dropped by its exact name before it is created,
    // so a second application converges instead of erroring on a duplicate.
    for (const name of [
      'Users can view own personalization projects',
      'Users can insert own personalization projects',
      'Users can update own personalization projects',
      'Users can delete own personalization projects',
    ]) {
      expect(sql).toContain(`drop policy if exists "${name}" on public.personalization_projects`)
      expect(sql).toContain(`create policy "${name}"`)
    }
    expect(countOf(sql, 'create policy')).toBe(4)
    // The fifth drop removes the inert live `Users can manage own projects`
    // policy (FOR ALL, auth.uid() = user_id); extra `drop ... if exists`
    // statements are no-ops on a database that never had it.
    expect(countOf(sql, 'drop policy if exists')).toBe(5)
    expect(countOf(sql, 'drop policy if exists')).toBeGreaterThanOrEqual(countOf(sql, 'create policy'))
    // `enable row level security` is a no-op once RLS is on. It is a guarded
    // `execute` inside the DO block, not a top-level `alter table if exists`.
    expect(countOf(sql, 'enable row level security')).toBe(1)
    expect(countOf(sql, 'alter table if exists')).toBe(0)
  })
})

describe('behaviour: the Clerk RLS predicate against owner, stranger, and anon clients', () => {
  it('lets the owner read their own rows', () => {
    expect(runSelectPolicy(rows, 'user_1')).toEqual([{ id: 'project-1', clerk_user_id: 'user_1' }])
    expect(runSelectPolicy(rows, 'user_2')).toEqual([{ id: 'project-2', clerk_user_id: 'user_2' }])
  })

  it('blocks a different authenticated user from reading other rows', () => {
    expect(runSelectPolicy(rows, 'user_3')).toEqual([])
  })

  it('blocks an anon-scoped client (no app.clerk_user_id session setting) from reading any row', () => {
    const supabaseBrowserSource = read('src/lib/supabase.ts')
    expect(supabaseBrowserSource).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    // the browser client never establishes the Clerk session setting, so
    // current_setting('app.clerk_user_id', true) is NULL for it
    expect(supabaseBrowserSource).not.toContain('app.clerk_user_id')
    expect(runSelectPolicy(rows, null)).toEqual([])
  })

  it('demonstrates the old auth.uid() idiom was inert: it blocked even the owner', () => {
    // Under Clerk auth.uid() is always NULL, so the H5 policies matched nothing.
    expect(runInertAuthUidPolicy(rows)).toEqual([])
    // The fix restores legitimate owner access while still denying anon clients.
    expect(runSelectPolicy(rows, 'user_1')).toHaveLength(1)
    expect(runSelectPolicy(rows, null)).toEqual([])
  })
})
