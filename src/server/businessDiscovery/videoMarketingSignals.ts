/**
 * Video-marketing signal detection for a business website.
 *
 * Pure, offline helpers: they take HTML plus the URL the HTML was served from
 * and return structured evidence. No network access, no browser, no paid
 * provider, no model call — so they are directly unit-testable against inline
 * HTML fixtures.
 *
 * The contract that matters most is the one about ABSENCE. A business without
 * a video embed on its homepage is not a business without videos, and the
 * Lead Finder must never present the absence of a scraped embed as a fact.
 * Three states exist (see `VideoPresenceState`):
 *
 *   - `video_found` — a video player, embed, link or structured-data video
 *     declaration was positively identified on the scanned page.
 *   - `no_video_on_scanned_pages` — the fetched page contained no video
 *     signal. The evidence array always carries the explicit disclaimer that
 *     this does not prove the business has no videos.
 *   - `unknown` — nothing could be scanned at all (site unreachable, body was
 *     not HTML), so nothing may be said either way.
 */

import * as cheerio from 'cheerio'
import type { VideoMarketingEvidence } from './types'

/**
 * Platform identifiers used in `VideoMarketingEvidence.platforms`. They are
 * coarse on purpose: the Lead Finder only needs to know which video channel
 * a business already uses, not which player or plan.
 */
export type VideoPlatformId = 'youtube' | 'vimeo' | 'native' | 'wistia' | 'other'

/** Branding assets discovered on a page. */
export interface BrandingAssets {
  /** Best single guess at the brand logo, if one was found. */
  logoUrl?: string
  /** Every usable branding image, including the logo. */
  imageUrls: string[]
  /** Number of usable branding assets. */
  count: number
}

/**
 * Disclaimer attached to the `no_video_on_scanned_pages` state. It is a
 * contractual string: downstream scoring and the UI rely on the absence of
 * video never being stated as a proven fact.
 */
export const NO_VIDEO_EVIDENCE =
  'No video embeds found on the pages fetched; this does not prove the business has no videos.'

/** Evidence used when the website could not be fetched or parsed at all. */
export const UNREACHABLE_VIDEO_EVIDENCE =
  'Website was not reachable; video presence could not be verified.'

/**
 * Video hosts the detector recognises. A host that is not listed is not
 * treated as a video signal at all — guessing would turn ordinary iframes
 * (payment forms, chat widgets, maps) into false "video found" verdicts.
 */
const PLATFORM_HOST_RULES: Array<{ id: VideoPlatformId; hosts: string[] }> = [
  { id: 'youtube', hosts: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
  { id: 'vimeo', hosts: ['vimeo.com'] },
  { id: 'wistia', hosts: ['wistia.com', 'wistia.net'] },
  { id: 'other', hosts: ['vidyard.com', 'loom.com', 'wideo.com'] },
]

/**
 * Hosts that a plain link to is meaningful evidence of a video presence.
 * A link to a YouTube or Vimeo channel shows the business publishes videos
 * there, even when the page embeds no player.
 */
const LINKABLE_PLATFORMS = new Set<VideoPlatformId>(['youtube', 'vimeo'])

const PLATFORM_LABELS: Record<VideoPlatformId, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  wistia: 'Wistia',
  native: 'Native',
  other: 'Third-party',
}

/** Meta keys that declare a video player for the page. */
const VIDEO_META_KEYS = new Set([
  'og:video',
  'og:video:url',
  'og:video:secure_url',
  'twitter:player',
  'twitter:player:stream',
  'twitter:player:iframe',
])

/** JSON-LD `@type` values that declare a video. */
const VIDEO_JSONLD_TYPES = new Set(['videoobject', 'video', 'clip'])

/** File extensions that identify a self-hosted video file. */
const VIDEO_FILE_EXTENSIONS = ['.mp4', '.webm', '.m4v', '.mov', '.ogv', '.ogg', '.mpg', '.mpeg']

/**
 * Heuristic for "this image is probably the logo": the file name, alt text
 * or class name mentions the logo, the brand or the business name.
 */
const LOGO_HINT = /(^|[\W_])(logo|brand|name)([\W_]|$)/i

/**
 * Host labels that describe a delivery subdomain rather than the vendor, so
 * the vendor name can be used in human-readable evidence.
 */
const SUBDOMAIN_WORDS = new Set([
  'www',
  'player',
  'embed',
  'fast',
  'cdn',
  'media',
  'static',
  'watch',
  'videos',
])

/**
 * Parses a URL reference against the page URL. Returns undefined for values
 * that must never become absolute asset URLs (`data:`, `javascript:`, …) and
 * for values that cannot be resolved.
 */
function parseReference(raw: string | undefined, baseUrl: string): URL | undefined {
  const value = (raw || '').trim()
  if (!value) return undefined
  if (/^(data|javascript|blob|mailto|tel|about):/i.test(value)) return undefined
  try {
    return new URL(value, baseUrl)
  } catch {
    return undefined
  }
}

/** Resolves a candidate asset URL to an absolute http(s) URL. */
function resolveAssetUrl(raw: string | undefined, baseUrl: string): string | undefined {
  const url = parseReference(raw, baseUrl)
  if (!url) return undefined
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
  return url.toString()
}

/** Maps a hostname onto a known video platform, if it is one. */
function platformForHost(hostname: string): VideoPlatformId | undefined {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (!host) return undefined
  for (const rule of PLATFORM_HOST_RULES) {
    for (const base of rule.hosts) {
      if (host === base || host.endsWith(`.${base}`)) return rule.id
    }
  }
  return undefined
}

/** True when the URL path points at a self-hosted video file. */
function looksLikeVideoFile(url: URL): boolean {
  const path = url.pathname.toLowerCase()
  return VIDEO_FILE_EXTENSIONS.some((ext) => path.endsWith(ext))
}

/** Human-readable vendor name for evidence strings. */
function displayLabel(platform: VideoPlatformId, url?: URL): string {
  if (platform !== 'other') return PLATFORM_LABELS[platform]
  if (!url) return PLATFORM_LABELS.other
  const labels = url.hostname.toLowerCase().split('.').filter(Boolean)
  const meaningful = labels.filter((label) => !SUBDOMAIN_WORDS.has(label))
  const base = meaningful[0] || labels[0] || url.hostname
  return base.charAt(0).toUpperCase() + base.slice(1)
}

/** Collects the `url` / `contentUrl` of a JSON-LD image-ish value. */
function collectJsonLdAssetUrls(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    if (value.trim()) out.push(value.trim())
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdAssetUrls(item, out)
    return
  }
  if (!value || typeof value !== 'object') return
  const record = value as Record<string, unknown>
  for (const key of ['url', 'contentUrl', '@id']) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim()) {
      out.push(candidate.trim())
      break
    }
  }
}

/** Parses every JSON-LD block, tolerating invalid JSON in any single block. */
function parseJsonLdBlocks($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = []
  $('script[type="application/ld+json"]').each((_i, elem) => {
    try {
      const parsed = JSON.parse($(elem).text() || '')
      if (Array.isArray(parsed)) {
        blocks.push(...(parsed as Record<string, unknown>[]))
      } else if (parsed && typeof parsed === 'object') {
        blocks.push(parsed as Record<string, unknown>)
      }
    } catch {
      // A malformed JSON-LD block says nothing about the page's videos.
    }
  })
  return blocks
}

/**
 * Walks parsed JSON-LD and collects every video object. Nested video objects
 * are not re-walked once found, so one video is never counted twice.
 */
function collectJsonLdVideoObjects(nodes: unknown[], out: Record<string, unknown>[]): void {
  for (const node of nodes) {
    if (Array.isArray(node)) {
      collectJsonLdVideoObjects(node, out)
      continue
    }
    if (!node || typeof node !== 'object') continue
    const record = node as Record<string, unknown>
    const rawType = record['@type']
    const types = Array.isArray(rawType) ? rawType : [rawType]
    const isVideo = types.some(
      (type) => typeof type === 'string' && VIDEO_JSONLD_TYPES.has(type.toLowerCase()),
    )
    if (isVideo) {
      out.push(record)
      continue
    }
    for (const value of Object.values(record)) {
      if (value && typeof value === 'object') collectJsonLdVideoObjects([value], out)
    }
  }
}

/**
 * Detects every video signal on a fetched page.
 *
 * `embedCount` counts embed-level references (native video elements, player
 * iframes, og:video / twitter:player meta declarations and JSON-LD video
 * objects). A plain link to a YouTube or Vimeo channel is recorded as
 * evidence and sets the state, but is not an embed and is not counted.
 */
export function detectVideoSignals(html: string, finalUrl: string): VideoMarketingEvidence {
  const $ = cheerio.load(html || '')
  const platforms = new Set<VideoPlatformId>()
  const evidence: string[] = []
  const seenEvidence = new Set<string>()
  let embedCount = 0
  let signalCount = 0

  const addEvidence = (message: string): void => {
    if (seenEvidence.has(message)) return
    seenEvidence.add(message)
    evidence.push(message)
  }

  // Native <video> elements.
  $('video').each((_i, elem) => {
    platforms.add('native')
    embedCount += 1
    signalCount += 1
    const src = $(elem).attr('src') || $(elem).attr('data-src') || ''
    addEvidence(
      src
        ? `Native <video> element found on the page (${src})`
        : 'Native <video> element found on the page',
    )
  })

  // Standalone <source> elements pointing at a video file. Sources nested in
  // a <video> are already represented by that element.
  $('source').each((_i, elem) => {
    if ($(elem).closest('video').length > 0) return
    const raw = $(elem).attr('src') || $(elem).attr('srcset') || ''
    const first = raw.split(',')[0]?.trim().split(/\s+/)[0] || ''
    const url = parseReference(first, finalUrl)
    if (!url || !looksLikeVideoFile(url)) return
    platforms.add('native')
    embedCount += 1
    signalCount += 1
    addEvidence(`Native <source> video file found on the page (${url.pathname})`)
  })

  // Player iframes.
  $('iframe').each((_i, elem) => {
    const raw = $(elem).attr('src') || $(elem).attr('data-src') || ''
    const url = parseReference(raw, finalUrl)
    if (!url) return
    const platform = platformForHost(url.hostname)
    if (!platform) return
    platforms.add(platform)
    embedCount += 1
    signalCount += 1
    addEvidence(`${displayLabel(platform, url)} iframe embed found on the page`)
  })

  // Links to a YouTube / Vimeo channel or video.
  $('a[href]').each((_i, elem) => {
    const url = parseReference($(elem).attr('href'), finalUrl)
    if (!url) return
    const platform = platformForHost(url.hostname)
    if (!platform || !LINKABLE_PLATFORMS.has(platform)) return
    platforms.add(platform)
    signalCount += 1
    addEvidence(`${displayLabel(platform, url)} video link found on the page (${url.href})`)
  })

  // og:video / twitter:player declarations.
  $('meta').each((_i, elem) => {
    const key = ($(elem).attr('property') || $(elem).attr('name') || '').toLowerCase()
    if (!VIDEO_META_KEYS.has(key)) return
    const content = $(elem).attr('content') || ''
    const url = parseReference(content, finalUrl)
    if (!url) return
    const platform = platformForHost(url.hostname) || (looksLikeVideoFile(url) ? 'native' : 'other')
    platforms.add(platform)
    embedCount += 1
    signalCount += 1
    addEvidence(`${key} meta tag found on the page (${url.href})`)
  })

  // JSON-LD video declarations.
  const videoObjects: Record<string, unknown>[] = []
  collectJsonLdVideoObjects(parseJsonLdBlocks($), videoObjects)
  for (const videoObject of videoObjects) {
    const candidates: string[] = []
    for (const key of ['embedUrl', 'contentUrl', 'url']) {
      collectJsonLdAssetUrls(videoObject[key], candidates)
    }
    let platform: VideoPlatformId = 'other'
    for (const candidate of candidates) {
      const url = parseReference(candidate, finalUrl)
      if (!url) continue
      const resolved = platformForHost(url.hostname)
      if (resolved) {
        platform = resolved
        break
      }
      if (looksLikeVideoFile(url)) {
        platform = 'native'
        break
      }
    }
    platforms.add(platform)
    embedCount += 1
    signalCount += 1
    addEvidence(`JSON-LD video object found on the page (${displayLabel(platform)})`)
  }

  if (signalCount === 0) {
    return {
      state: 'no_video_on_scanned_pages',
      platforms: [],
      embedCount: 0,
      evidence: [NO_VIDEO_EVIDENCE],
      brandingAssetCount: detectBrandingAssets(html || '', finalUrl).count,
      sourceUrl: finalUrl,
    }
  }

  return {
    state: 'video_found',
    platforms: Array.from(platforms),
    embedCount,
    evidence,
    brandingAssetCount: detectBrandingAssets(html || '', finalUrl).count,
    sourceUrl: finalUrl,
  }
}

/**
 * Builds the `unknown` video state. Used when the website could not be
 * fetched or the body was not HTML: nothing was scanned, so nothing may be
 * claimed in either direction.
 */
export function buildUnknownVideoMarketing(
  sourceUrl?: string,
  evidenceMessage: string = UNREACHABLE_VIDEO_EVIDENCE,
): VideoMarketingEvidence {
  return {
    state: 'unknown',
    platforms: [],
    embedCount: 0,
    evidence: [evidenceMessage],
    brandingAssetCount: 0,
    sourceUrl,
  }
}

/**
 * Finds usable branding assets on a page: social preview images, structured
 * data logos, touch icons, favicons and logo-looking `<img>` elements.
 *
 * Every asset is returned as an absolute URL resolved against `finalUrl`;
 * unusable references (`data:`, `javascript:`, unresolvable) are dropped.
 */
export function detectBrandingAssets(html: string, finalUrl: string): BrandingAssets {
  const $ = cheerio.load(html || '')
  const imageUrls: string[] = []
  const seen = new Set<string>()
  const logoCandidates: Array<{ url: string; priority: number }> = []

  const addAsset = (raw: string | undefined, priority: number): string | undefined => {
    const url = resolveAssetUrl(raw, finalUrl)
    if (!url) return undefined
    if (!seen.has(url)) {
      seen.add(url)
      imageUrls.push(url)
    }
    logoCandidates.push({ url, priority })
    return url
  }

  // Priority order for the single "best logo" slot: the social preview image
  // first (it matches the logo the site itself advertises), then structured
  // data, then icon rels, then logo-looking images.
  $('meta').each((_i, elem) => {
    const key = ($(elem).attr('property') || $(elem).attr('name') || '').toLowerCase()
    if (key === 'og:image' || key === 'og:image:url' || key === 'og:image:secure_url') {
      addAsset($(elem).attr('content'), 0)
    } else if (key === 'og:logo') {
      addAsset($(elem).attr('content'), 5)
    }
  })

  const jsonLdBlocks = parseJsonLdBlocks($)
  for (const block of jsonLdBlocks) {
    const logoUrls: string[] = []
    collectJsonLdAssetUrls(block.logo, logoUrls)
    for (const candidate of logoUrls) addAsset(candidate, 1)
    const imageUrlsFromLd: string[] = []
    collectJsonLdAssetUrls(block.image, imageUrlsFromLd)
    for (const candidate of imageUrlsFromLd) addAsset(candidate, 2)
  }

  $('link[rel]').each((_i, elem) => {
    const rel = ($(elem).attr('rel') || '').toLowerCase()
    const href = $(elem).attr('href')
    if (!href) return
    if (rel.includes('apple-touch-icon')) addAsset(href, 3)
    else if (rel.includes('icon')) addAsset(href, 4)
  })

  $('img').each((_i, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src') || ''
    const alt = $(elem).attr('alt') || ''
    const className = $(elem).attr('class') || ''
    const haystack = `${src} ${alt} ${className}`.toLowerCase()
    if (!LOGO_HINT.test(haystack)) return
    addAsset(src, 6)
  })

  const logoUrl = logoCandidates
    .slice()
    .sort((a, b) => a.priority - b.priority)[0]?.url

  return {
    logoUrl,
    imageUrls,
    count: imageUrls.length,
  }
}
