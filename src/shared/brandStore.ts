// Shared in-memory store for Brand Studio. Swap for a DB/persistent store in
// production (multi-instance). Kept as a plain module so both /api/brands and
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
