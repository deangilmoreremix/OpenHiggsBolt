/**
 * Research provider for selected businesses.
 *
 * Given a business website, this module:
 * 1. Verifies the website is reachable
 * 2. Extracts structured data (JSON-LD, Open Graph, Twitter cards)
 * 3. Extracts social links
 * 4. Enriches the client profile
 *
 * Uses inexpensive static HTTP first. No browser, no Firecrawl.
 *
 * SSRF: this module backs a public, unauthenticated route that fetches a
 * user-supplied URL. Every URL — the initial one and every redirect hop — is
 * validated against the centralized `src/lib/networkSafety.ts` gate
 * (protocol allowlist, hostname literal checks for every private / metadata /
 * ULA / link-local / unspecified form, and DNS resolution that validates
 * EVERY address the host currently resolves to, so DNS rebinding is
 * rejected). The validated address is then pinned to the outbound connection
 * via `safeRequestConfig`, so a DNS answer that flips between validation and
 * connect cannot redirect the socket to a private peer. Rejected targets
 * throw a `BlockedTargetError`; the public route maps those to HTTP 400.
 *
 * A `dns_resolution_failed` reason is treated as an unreachable host rather
 * than a security violation: the fetch is allowed to attempt the connection
 * and any resulting network failure is reported as `reachable: false`. This
 * preserves the public route's contract for genuinely dead public sites
 * (the caller is not malicious; the site is just down) while every literal,
 * metadata, private, CGNAT, ULA, link-local, IPv4-mapped and unspecified
 * destination, and every hostname that resolves to one, is still rejected
 * up front.
 *
 * Redirects are followed manually so every hop pays the same validation +
 * pinning price. axios' own redirect following is disabled
 * (`maxRedirects: 0`).
 */

import axios, { type AxiosResponse } from 'axios'
import * as cheerio from 'cheerio'
import { sanitizeUrl } from '../discoverAssets'
import {
  checkDestination,
  safeRequestConfig,
  REDIRECT_STATUSES,
  MAX_REDIRECT_HOPS,
  NetworkSafetyError,
  SSRF_BLOCKED_MESSAGE,
} from '@/lib/networkSafety'
import type { BusinessDiscoveryRecord } from './types'

const REQUEST_TIMEOUT = 15_000
const MAX_HTML_BYTES = 2_000_000

/**
 * `/api/personalization/research-business` maps a thrown error message to an
 * HTTP status with `/not allowed|Private|Invalid/i` (→ 400) before it falls
 * back to 500, so every blocked target carries one of those substrings:
 * an unsafe URL is a caller mistake, never an internal failure.
 */
const BLOCKED_URL_MESSAGE = 'Blocked URL: private/unsafe target'

class BlockedTargetError extends Error {
  readonly blockedTarget = true
}

function blockedTargetError(reason: string): BlockedTargetError {
  return new BlockedTargetError(`${BLOCKED_URL_MESSAGE} (${reason}) is not allowed`)
}

function reasonOf(err: unknown): string {
  if (err instanceof NetworkSafetyError) return err.reason || 'blocked'
  return err instanceof Error ? err.message : String(err)
}

/**
 * Reasons from `checkDestination` that mean the URL points at a destination
 * a caller is never allowed to reach. They become `BlockedTargetError`
 * (→ HTTP 400). `dns_resolution_failed` is intentionally excluded: a
 * hostname that does not resolve is "unreachable", not "blocked", and the
 * public route's contract is to report it as `reachable: false` so the UI
 * can show "couldn't reach site" instead of an error.
 */
const BLOCK_REASONS = new Set(['blocked_host', 'resolved_to_blocked_ip', 'invalid_url'])

/**
 * `networkSafety` already blocks `0.0.0.0` and `::` via the IPv4 `0/8` and
 * IPv6 "unspecified" rules, but keeping this pre-check makes the intent
 * explicit and protects against any future regression in those rules.
 */
function isUnspecifiedAddress(hostname: string): boolean {
  const bare = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname
  return bare === '0.0.0.0' || bare === '::'
}

/**
 * Full SSRF validation of an already-absolute URL. Resolves the host and
 * validates every returned address so DNS-rebinding (public hostname whose
 * A-record flips to a private IP) is caught. Throws `BlockedTargetError`
 * for prohibited destinations and a plain `Error` for unreachable hosts.
 */
async function assertUrlSafe(rawUrl: string): Promise<void> {
  const result = await checkDestination(rawUrl, {})
  if (!result.ok) {
    const reason = result.reason || 'blocked'
    if (BLOCK_REASONS.has(reason)) {
      throw blockedTargetError(reason)
    }
    // Unresolvable hostnames and other "unreachable" outcomes propagate as
    // plain errors so the fetch's try/catch surfaces `reachable: false`.
    throw new Error(`Unreachable: ${reason}`)
  }
  if (isUnspecifiedAddress(result.hostname)) {
    throw new Error(`${SSRF_BLOCKED_MESSAGE} (unspecified address 0.0.0.0/[::]) is not allowed`)
  }
}

/**
 * Re-throws a `BlockedTargetError` unchanged (→ HTTP 400 via the public
 * route). A plain `Error` (unreachable host, etc.) is allowed to propagate
 * so the caller's outer try/catch downgrades it to `reachable: false`.
 */
async function guardUrl(rawUrl: string): Promise<string> {
  await assertUrlSafe(rawUrl)
  return rawUrl
}

/**
 * Normalises the caller-supplied URL and validates it before any network
 * call. Throws (BlockedTargetError) for unsafe targets.
 */
async function validateResearchTarget(websiteUrl: string): Promise<string> {
  let normalized: string
  try {
    normalized = sanitizeUrl(websiteUrl)
  } catch (err) {
    throw blockedTargetError(reasonOf(err))
  }
  return guardUrl(normalized)
}

function redirectLocationOf(response: AxiosResponse): string {
  if (!response || !REDIRECT_STATUSES.includes(response.status)) return ''
  const rawLocation: unknown = response.headers?.location
  return typeof rawLocation === 'string' ? rawLocation.trim() : ''
}

/**
 * Fetches `startUrl` with axios' redirect following disabled and each hop
 * re-validated. Only blocked redirect targets throw; every fetch-level
 * failure (DNS, connect, timeout, non-2xx/3xx status) propagates as an axios
 * error for the caller to downgrade to `reachable: false`.
 *
 * The connection is pinned to the address the gate validated, so a DNS
 * answer that changes between the check and the connect (the rebinding
 * window) cannot move the socket to a private peer.
 */
async function fetchWithValidatedRedirects(startUrl: string): Promise<{
  response: AxiosResponse
  finalUrl: string
}> {
  let currentUrl = startUrl

  for (let redirects = 0; redirects <= MAX_REDIRECT_HOPS; redirects++) {
    // Re-validate every hop and pin the connection to the validated address.
    const destination = await checkDestination(currentUrl, {})
    if (!destination.ok) {
      const reason = destination.reason || 'blocked'
      if (BLOCK_REASONS.has(reason)) {
        throw blockedTargetError(`redirect to ${reason}`)
      }
      // Unreachable redirect target: let the caller's try/catch surface
      // reachable: false rather than a 400.
      throw new Error(`Unreachable redirect: ${reason}`)
    }
    if (isUnspecifiedAddress(destination.hostname)) {
      throw new Error(`${SSRF_BLOCKED_MESSAGE} (unspecified address 0.0.0.0/[::]) is not allowed`)
    }
    const pin = safeRequestConfig(destination)

    const response = await axios.get(currentUrl, {
      timeout: REQUEST_TIMEOUT,
      maxContentLength: MAX_HTML_BYTES,
      headers: {
        'User-Agent': 'SmartVideoGO-AI/1.0 (https://go.smartvid.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: (s) => s >= 200 && s < 400,
      ...pin,
    })

    const location = redirectLocationOf(response)
    if (!location) {
      return { response, finalUrl: currentUrl }
    }
    if (redirects === MAX_REDIRECT_HOPS) {
      throw blockedTargetError('too many redirects')
    }

    let nextUrl: string
    try {
      nextUrl = new URL(location, currentUrl).toString()
    } catch {
      throw blockedTargetError('malformed redirect Location header')
    }
    // guardUrl re-validates the next hop up front and pins the next request.
    currentUrl = await guardUrl(nextUrl)
  }

  throw blockedTargetError('too many redirects')
}

interface BusinessResearchResult {
  canonicalUrl: string
  finalUrl: string
  reachable: boolean
  statusCode?: number
  contentType?: string
  title?: string
  description?: string
  logoUrl?: string
  socialLinks: {
    facebook?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
    x?: string
    pinterest?: string
  }
  jsonLd: Record<string, unknown>[]
  openGraph: Record<string, string>
  twitterCard: Record<string, string>
  contactInfo: {
    phones: string[]
    emails: string[]
    addresses: string[]
  }
}

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  facebook: /facebook\.com\/([A-Za-z0-9._-]+)/i,
  instagram: /instagram\.com\/([A-Za-z0-9._-]+)/i,
  linkedin: /linkedin\.com\/(company|school|in)\/([A-Za-z0-9._-]+)/i,
  youtube: /youtube\.com\/(channel|c|user)\/([A-Za-z0-9._-]+)/i,
  tiktok: /tiktok\.com\/@([A-Za-z0-9._-]+)/i,
  x: /(?:twitter\.com|x\.com)\/([A-Za-z0-9._-]+)/i,
  pinterest: /pinterest\.com\/([A-Za-z0-9._-]+)/i,
}

function extractSocialLinks(html: string, _baseUrl: string): BusinessResearchResult['socialLinks'] {
  const $ = cheerio.load(html)
  const links: BusinessResearchResult['socialLinks'] = {}

  $('a[href]').each((_i, elem) => {
    const href = $(elem).attr('href') || ''
    const lower = href.toLowerCase()
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (lower.match(pattern)) {
        links[platform as keyof BusinessResearchResult['socialLinks']] = href
        break
      }
    }
  })

  return links
}

function extractJsonLd(html: string, _baseUrl: string): Record<string, unknown>[] {
  const $ = cheerio.load(html)
  const results: Record<string, unknown>[] = []
  $('script[type="application/ld+json"]').each((_i, elem) => {
    try {
      const parsed = JSON.parse($(elem).text() || '')
      if (Array.isArray(parsed)) {
        results.push(...parsed)
      } else {
        results.push(parsed)
      }
    } catch {
      // skip invalid JSON-LD
    }
  })
  return results
}

function extractOpenGraph(html: string, _baseUrl: string): Record<string, string> {
  const $ = cheerio.load(html)
  const result: Record<string, string> = {}
  $('meta[property^="og:"], meta[name^="og:"]').each((_i, elem) => {
    const property = $(elem).attr('property') || $(elem).attr('name') || ''
    const content = $(elem).attr('content') || ''
    if (property && content) {
      result[property.replace(/^og:/, '')] = content
    }
  })
  return result
}

function extractTwitterCard(html: string, _baseUrl: string): Record<string, string> {
  const $ = cheerio.load(html)
  const result: Record<string, string> = {}
  $('meta[name^="twitter:"], meta[property^="twitter:"]').each((_i, elem) => {
    const name = $(elem).attr('name') || $(elem).attr('property') || ''
    const content = $(elem).attr('content') || ''
    if (name && content) {
      result[name.replace(/^twitter:/, '')] = content
    }
  })
  return result
}

function extractContactInfo(html: string, _baseUrl: string): BusinessResearchResult['contactInfo'] {
  const $ = cheerio.load(html)
  const phones = new Set<string>()
  const emails = new Set<string>()
  const addresses = new Set<string>()

  // Extract from mailto links
  $('a[href^="mailto:"]').each((_i, elem) => {
    const email = $(elem).attr('href')?.replace(/^mailto:/, '')?.split('?')[0]
    if (email) emails.add(email.toLowerCase())
  })

  // Extract from tel links
  $('a[href^="tel:"]').each((_i, elem) => {
    const phone = $(elem).attr('href')?.replace(/^tel:/, '')
    if (phone) phones.add(phone)
  })

  // Extract emails from text
  const text = $('body').text() || ''
  const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  if (emailMatches) {
    for (const email of emailMatches) {
      emails.add(email.toLowerCase())
    }
  }

  // Extract from JSON-LD
  const jsonLd = extractJsonLd(html, _baseUrl)
  for (const item of jsonLd) {
    if (item.telephone && typeof item.telephone === 'string') phones.add(item.telephone)
    if (item.email && typeof item.email === 'string') emails.add(item.email.toLowerCase())
    if (item.address && typeof item.address === 'object') {
      const addr = item.address as Record<string, string>
      const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry].filter(Boolean)
      if (parts.length > 0) addresses.add(parts.join(', '))
    }
  }

  return {
    phones: Array.from(phones),
    emails: Array.from(emails),
    addresses: Array.from(addresses),
  }
}

export async function researchBusiness(websiteUrl: string): Promise<BusinessResearchResult> {
  // Normalise up front so an unreachable or blocked caller still gets a
  // well-formed `canonicalUrl` back (the public route's contract is to
  // report `reachable: false` with the normalised URL for unreachable
  // sites and a 400 for unsafe destinations).
  let normalized: string
  try {
    normalized = sanitizeUrl(websiteUrl)
  } catch (err) {
    throw blockedTargetError(reasonOf(err))
  }

  const result: BusinessResearchResult = {
    canonicalUrl: normalized,
    finalUrl: normalized,
    reachable: false,
    socialLinks: {},
    jsonLd: [],
    openGraph: {},
    twitterCard: {},
    contactInfo: { phones: [], emails: [], addresses: [] },
  }

  try {
    // SSRF validation: rejects unsafe targets with a BlockedTargetError
    // (→ HTTP 400 via the public route). Unreachable hosts raise a plain
    // Error which the catch below downgrades to `reachable: false`.
    const canonicalUrl = await guardUrl(normalized)

    const { response, finalUrl } = await fetchWithValidatedRedirects(canonicalUrl)

    // finalUrl is always the last URL this module validated and requested, so
    // it is never a value reported by the server/adapter.
    result.finalUrl = finalUrl
    result.reachable = true
    result.statusCode = response.status
    result.contentType = String(response.headers['content-type'] || '')

    const html = Buffer.isBuffer(response.data)
      ? response.data.toString('utf-8')
      : String(response.data)

    if (html && result.contentType?.includes('text/html')) {
      // Title and description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) result.title = titleMatch[1].trim()

      const metaDescMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i)
      if (metaDescMatch) result.description = metaDescMatch[1].trim()

      // Logo from Open Graph or JSON-LD
      const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      if (ogImage) result.logoUrl = ogImage[1]

      if (!result.logoUrl) {
        const jsonLd = extractJsonLd(html, canonicalUrl)
        for (const item of jsonLd) {
          if (item.logo && typeof item.logo === 'string') {
            result.logoUrl = item.logo
            break
          }
          if (item.image && typeof item.image === 'string') {
            result.logoUrl = item.image
            break
          }
        }
      }

      result.socialLinks = extractSocialLinks(html, canonicalUrl)
      result.jsonLd = extractJsonLd(html, canonicalUrl)
      result.openGraph = extractOpenGraph(html, canonicalUrl)
      result.twitterCard = extractTwitterCard(html, canonicalUrl)
      result.contactInfo = extractContactInfo(html, canonicalUrl)
    }
  } catch (err) {
    // A blocked redirect target is a rejected request, not an upstream
    // failure — it must stay a throw so the route can answer 400.
    if (err instanceof BlockedTargetError) throw err

    result.reachable = false
    result.statusCode = err instanceof Error && 'response' in err && (err as any).response?.status
      ? (err as any).response.status
      : undefined
  }

  return result
}

export function enrichClientProfileFromResearch(
  profile: Partial<BusinessDiscoveryRecord>,
  research: BusinessResearchResult,
): Partial<BusinessDiscoveryRecord> {
  const enriched = { ...profile }

  // Use research data to fill gaps in the OSM record
  if (!enriched.website && research.finalUrl) {
    enriched.website = research.finalUrl
  }

  // Social links from website override/extend OSM data
  if (!enriched.facebook && research.socialLinks.facebook) enriched.facebook = research.socialLinks.facebook
  if (!enriched.instagram && research.socialLinks.instagram) enriched.instagram = research.socialLinks.instagram
  if (!enriched.linkedin && research.socialLinks.linkedin) enriched.linkedin = research.socialLinks.linkedin
  if (!enriched.youtube && research.socialLinks.youtube) enriched.youtube = research.socialLinks.youtube
  if (!enriched.whatsapp && research.socialLinks.tiktok) enriched.whatsapp = research.socialLinks.tiktok

  // Contact info from website
  if (!enriched.phone && research.contactInfo.phones.length > 0) {
    enriched.phone = research.contactInfo.phones[0]
  }
  if (!enriched.email && research.contactInfo.emails.length > 0) {
    enriched.email = research.contactInfo.emails[0]
  }

  return enriched
}
