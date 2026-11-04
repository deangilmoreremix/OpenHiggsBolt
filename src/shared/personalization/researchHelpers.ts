/**
 * Pure helpers that turn a business research result into modal state.
 * Kept out of DemoPersonalizeProvider.tsx so they can be unit-tested without
 * loading the provider (and its Supabase client).
 */
import { DEFAULT_PREVIEW_BRAND_COLORS } from './preview/types'

/**
 * The first prose paragraph of page Markdown (not a heading, list item or
 * quote), with Markdown emphasis and links reduced to plain text, at most
 * 300 characters. Undefined when there is none.
 */
export function firstParagraphOf(markdown: string | undefined): string | undefined {
  if (!markdown) return undefined
  for (const block of markdown.split(/\n+/)) {
    const line = block.trim()
    if (!line || /^(#|-|>|\*\s)/.test(line)) continue
    const plain = line
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*|\*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (plain.length < 40) continue
    return plain.length > 300 ? `${plain.slice(0, 297).replace(/\s+\S*$/, '')}…` : plain
  }
  return undefined
}

const HEX_BRAND_COLOR = /^#[0-9a-f]{6}$/i

/** Only well-formed `#rrggbb` primary / accent colours, or null. */
export function researchBrandColors(value: unknown): { primary?: string; accent?: string } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const colors: { primary?: string; accent?: string } = {}
  for (const key of ['primary', 'accent'] as const) {
    const color = record[key]
    if (typeof color === 'string' && HEX_BRAND_COLOR.test(color)) colors[key] = color.toLowerCase()
  }
  return colors.primary || colors.accent ? colors : null
}

/**
 * The preview brand colours with the researched ones applied — only while the
 * visitor has not changed them from the defaults. A colour the visitor picked
 * is never overwritten.
 */
export function applyResearchedBrandColors<T extends { primary: string; accent: string }>(
  current: T,
  researched: { primary?: string; accent?: string } | null,
): T {
  if (!researched) return current
  const untouched =
    current.primary.toLowerCase() === DEFAULT_PREVIEW_BRAND_COLORS.primary.toLowerCase() &&
    current.accent.toLowerCase() === DEFAULT_PREVIEW_BRAND_COLORS.accent.toLowerCase()
  if (!untouched) return current
  return {
    ...current,
    ...(researched.primary ? { primary: researched.primary } : {}),
    ...(researched.accent ? { accent: researched.accent } : {}),
  }
}
