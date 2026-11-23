// Maps Brand Studio objects to/from the existing Supabase brand_* rows (no schema change).
import type { StudioBrand } from './prompts'

const csv = (v: unknown): string => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).join(', ') : typeof v === 'string' ? v : '')
export const splitCsv = (v: unknown): string[] => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(v) ? v.map(String) : [])

export type BrandInput = StudioBrand & { url?: string; fonts?: string[]; screenshotUrl?: string | null; siteImages?: string[]; siteVideos?: string[]; blocked?: boolean }

export function brandToRow(b: BrandInput) {
  return {
    url: String(b.url || ''),
    brand_name: String(b.brandName || ''),
    industry: String(b.industry || ''),
    tagline: String(b.tagline || ''),
    value_proposition: String(b.valueProposition || ''),
    target_audience: String(b.targetAudience || ''),
    tone_of_voice: csv(b.toneOfVoice),
    brand_personality: csv(b.brandPersonality),
    key_messages: csv(b.keyMessages),
    primary_colors: csv(b.primaryColors),
    secondary_colors: csv(b.secondaryColors),
    fonts: csv(b.fonts),
    logo_url: String(b.logoUrl || ''),
    screenshot_url: String(b.screenshotUrl || ''),
    imagery_style: String(b.imageryStyle || ''),
    layout_style: String(b.layoutStyle || ''),
    raw_json: { siteImages: b.siteImages || [], siteVideos: b.siteVideos || [], blocked: !!b.blocked },
  }
}

export function rowToBrand(r: any): BrandInput & { id: string; createdAt?: string } {
  return {
    id: r.id, url: r.url, createdAt: r.created_at,
    brandName: r.brand_name || '', industry: r.industry || '', tagline: r.tagline || '',
    valueProposition: r.value_proposition || '', targetAudience: r.target_audience || '',
    toneOfVoice: splitCsv(r.tone_of_voice), brandPersonality: splitCsv(r.brand_personality), keyMessages: splitCsv(r.key_messages),
    primaryColors: splitCsv(r.primary_colors), secondaryColors: splitCsv(r.secondary_colors), fonts: splitCsv(r.fonts),
    logoUrl: r.logo_url || '', screenshotUrl: r.screenshot_url || '',
    imageryStyle: r.imagery_style || '', layoutStyle: r.layout_style || '',
    siteImages: r.raw_json?.siteImages || [], siteVideos: r.raw_json?.siteVideos || [], blocked: !!r.raw_json?.blocked,
  }
}

/** Columns a client may write per table (owner and id are never client-controlled). */
export const WRITABLE = {
  brand_campaigns: ['brand_id', 'goal', 'direction', 'concepts'],
  brand_assets: ['brand_id', 'campaign_id', 'platform', 'concept_index', 'headline', 'body', 'cta', 'image_url', 'canvas_data'],
  brand_photoshoots: ['brand_id', 'style', 'category', 'product_url', 'image_url'],
  brand_animations: ['brand_id', 'source_url', 'video_url', 'resolution', 'duration', 'request_id'],
} as const

export function pick(table: keyof typeof WRITABLE, data: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of WRITABLE[table]) if (data?.[k] !== undefined) out[k] = data[k]
  return out
}
