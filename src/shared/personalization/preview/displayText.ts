/**
 * Clean, deterministic text for the Personalization CTA.
 *
 * A raw tracking URL must never be rendered as button text. A URL is never
 * shown as the clickable label; at most it appears as a small secondary
 * domain line, and only when the customer supplied one.
 */

/** Extract the registrable domain from a URL, e.g. https://www.kreindler.com/practices/x → kreindler.com. */
export function displayDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    // Strip a leading www.
    return hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

/** True when the string looks like a URL (has a scheme or a bare host with a dot). */
export function isUrlLike(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (/^https?:\/\//i.test(trimmed)) return true
  // Bare host: something like kreindler.com/path or www.kreindler.com
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+/.test(trimmed)
}

/** Sensible CTA button text derived from what the customer actually provided. */
export function defaultCtaLabel(opts: {
  industry?: string | null
  phone?: string | null
  website?: string | null
}): string {
  const { phone, website } = opts
  if (phone) return 'Call now'
  if (website) return 'Learn more'
  return 'Get in touch'
}
