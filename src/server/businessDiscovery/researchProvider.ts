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
 */

import axios from 'axios'
import { JSDOM } from 'jsdom'
import { sanitizeUrl } from '../discoverAssets'
import type { BusinessDiscoveryRecord } from './types'

const REQUEST_TIMEOUT = 15_000
const MAX_HTML_BYTES = 2_000_000

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

function extractSocialLinks(html: string, baseUrl: string): BusinessResearchResult['socialLinks'] {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const links: BusinessResearchResult['socialLinks'] = {}

  const anchors = doc.querySelectorAll('a[href]')
  for (const a of anchors) {
    const href = a.getAttribute('href') || ''
    const lower = href.toLowerCase()
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (lower.match(pattern)) {
        links[platform as keyof BusinessResearchResult['socialLinks']] = href
        break
      }
    }
  }

  return links
}

function extractJsonLd(html: string, baseUrl: string): Record<string, unknown>[] {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
  const results: Record<string, unknown>[] = []
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || '')
      if (Array.isArray(parsed)) {
        results.push(...parsed)
      } else {
        results.push(parsed)
      }
    } catch {
      // skip invalid JSON-LD
    }
  }
  return results
}

function extractOpenGraph(html: string, baseUrl: string): Record<string, string> {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const result: Record<string, string> = {}
  const metaTags = doc.querySelectorAll('meta[property^="og:"], meta[name^="og:"]')
  for (const meta of metaTags) {
    const property = meta.getAttribute('property') || meta.getAttribute('name') || ''
    const content = meta.getAttribute('content') || ''
    if (property && content) {
      result[property.replace(/^og:/, '')] = content
    }
  }
  return result
}

function extractTwitterCard(html: string, baseUrl: string): Record<string, string> {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const result: Record<string, string> = {}
  const metaTags = doc.querySelectorAll('meta[name^="twitter:"], meta[property^="twitter:"]')
  for (const meta of metaTags) {
    const name = meta.getAttribute('name') || meta.getAttribute('property') || ''
    const content = meta.getAttribute('content') || ''
    if (name && content) {
      result[name.replace(/^twitter:/, '')] = content
    }
  }
  return result
}

function extractContactInfo(html: string, baseUrl: string): BusinessResearchResult['contactInfo'] {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const phones = new Set<string>()
  const emails = new Set<string>()
  const addresses = new Set<string>()

  // Extract from mailto links
  const mailtos = doc.querySelectorAll('a[href^="mailto:"]')
  for (const a of mailtos) {
    const email = a.getAttribute('href')?.replace(/^mailto:/, '')?.split('?')[0]
    if (email) emails.add(email.toLowerCase())
  }

  // Extract from tel links
  const tels = doc.querySelectorAll('a[href^="tel:"]')
  for (const a of tels) {
    const phone = a.getAttribute('href')?.replace(/^tel:/, '')
    if (phone) phones.add(phone)
  }

  // Extract emails from text
  const text = doc.body?.textContent || ''
  const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  if (emailMatches) {
    for (const email of emailMatches) {
      emails.add(email.toLowerCase())
    }
  }

  // Extract from JSON-LD
  const jsonLd = extractJsonLd(html, baseUrl)
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
  const sanitized = sanitizeUrl(websiteUrl)
  const result: BusinessResearchResult = {
    canonicalUrl: sanitized,
    finalUrl: sanitized,
    reachable: false,
    socialLinks: {},
    jsonLd: [],
    openGraph: {},
    twitterCard: {},
    contactInfo: { phones: [], emails: [], addresses: [] },
  }

  try {
    const response = await axios.get(sanitized, {
      timeout: REQUEST_TIMEOUT,
      maxRedirects: 5,
      maxContentLength: MAX_HTML_BYTES,
      headers: {
        'User-Agent': 'SmartVideoGO-AI/1.0 (https://go.smartvid.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: (s) => s >= 200 && s < 400,
    })

    result.finalUrl = response.request?.res?.responseUrl || sanitized
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
        const jsonLd = extractJsonLd(html, sanitized)
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

      result.socialLinks = extractSocialLinks(html, sanitized)
      result.jsonLd = extractJsonLd(html, sanitized)
      result.openGraph = extractOpenGraph(html, sanitized)
      result.twitterCard = extractTwitterCard(html, sanitized)
      result.contactInfo = extractContactInfo(html, sanitized)
    }
  } catch (err) {
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
