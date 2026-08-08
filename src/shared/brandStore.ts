// Shared in-memory store for Brand Studio.
//
// ⚠️ EPHEMERAL / NOT MULTI-TENANT ⚠️
// This store is a plain module-level Map. It lives in a single Node.js
// instance's memory and is shared across ALL concurrent requests and ALL
// users. Data is lost on every server restart, redeploy, or scale-out to
// multiple instances. Do NOT store secrets, PII, or anything that must
// survive a restart here. Replace with a real database (Postgres, Redis,
// etc.) before production use. There is no isolation between brands or
// users — any caller can read or overwrite any entry.
// Swap for a DB/persistent store in production (multi-instance). Kept as a plain module so both /api/brands and
// /api/brand route handlers share the same Map.
export type Brand = {
  id: string
  url: string
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
