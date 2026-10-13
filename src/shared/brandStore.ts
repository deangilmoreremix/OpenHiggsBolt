// Shared in-memory store for Brand Studio.
//
// ⚠️ EPHEMERAL / NOT MULTI-TENANT ⚠️
// This store is a plain module-level Map. It lives in a single Node.js
// instance's memory and is shared across ALL concurrent requests and ALL
// users. Data is lost on every server restart, redeploy, or scale-out to
// multiple instances. Do NOT store secrets, PII, or anything that must
// survive a restart here. Replace with a real database (Postgres, Redis,
// etc.) before production use. Swap for a DB/persistent store in production (multi-instance). Kept as a plain module so both /api/brands and
// /api/brand route handlers share the same Map.
//
// ── OWNER SCOPING (H4) ─────────────────────────────────────────────────
// The Map is still module level, but every entry now carries the owning
// Clerk user id and BOTH consumers (`app/api/brand/route.ts` and
// `app/api/brands/route.ts`) gate on Clerk `auth()` before reading or
// writing, so a caller can only ever see and mutate their own entries.
// A non-owned id is reported as 404, never 403, so the response never
// confirms that another user's brand id exists.
//
// RESIDUAL LIMITATION (documented, accepted, minimal-change decision):
//   * Data is still lost on cold start / redeploy / multi-instance
//     scale-out, because nothing is persisted. The durable, owner-scoped
//     home for Brand data is the Supabase `brand_*` tables guarded by the
//     migration `20261010130000_brand_tables_owner_rls.sql`, which is what
//     the Netlify functions use. Migrating these Next.js routes onto those
//     tables would be a persistence refactor, not a security fix, and is
//     out of scope here — it is called out as follow-up work.
//   * The Map itself is NOT a security boundary. Defense in depth for the
//     Supabase-backed data lives in RLS; for this Map it lives entirely in
//     the two authenticated route handlers filtering by `owner`.
export type Brand = {
  id: string
  url: string
  /** Owning Clerk user id. Every entry is owned; unowned entries are unreachable. */
  owner: string
  brand_name?: string
  industry?: string
  tagline?: string
  value_proposition?: string
  target_audience?: string
  tone_of_voice?: string
  brand_personality?: string
  key_messages?: string
  primary_colors?: string
  secondary_colors?: string
  fonts?: string
  imagery_style?: string
  layout_style?: string
  logo_url?: string
  screenshot_url?: string
  created_at: string
}

export const brands = new Map<string, Brand>()

/**
 * Reset the store to an empty state.
 *
 * ⚠️ FOR TESTING ONLY. Calling this in production will erase all in-memory
 * brand data for every user on the current server instance.
 */
export function clearBrandStore(): void {
  brands.clear()
}

/** Only the brands owned by `userId`. */
export function getBrandsForUser(userId: string): Brand[] {
  return [...brands.values()].filter((b) => b.owner === userId)
}

/** A single brand, but only when it belongs to `userId`. */
export function getBrandForUser(id: string, userId: string): Brand | undefined {
  const brand = brands.get(id)
  if (!brand) return undefined
  // Ownership is checked here so the two route handlers cannot forget it.
  return brand.owner === userId ? brand : undefined
}
