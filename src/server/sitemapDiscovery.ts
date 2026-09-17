/**
 * Sitemap discovery for personalization asset crawler.
 *
 * Discovers high-value personalization pages from:
 * - /sitemap.xml
 * - /sitemap_index.xml
 * - robots.txt sitemap declarations
 */

import axios from 'axios'
import { JSDOM } from 'jsdom'
import { sanitizeUrl } from './discoverAssets'
import {
  MAX_PAGES,
  USEFUL_CATEGORIES,
} from './discoveryPolicy'

const REQUEST_TIMEOUT = 10_000
const USER_AGENT = 'SmartVideoGO-AI/1.0 (https://go.smartvid.app)'

const PERSONALIZATION_SLUG_PATTERNS = [
  'about',
  'about-us',
  'our-story',
  'team',
  'our-team',
  'staff',
  'services',
  'products',
  'product',
  'gallery',
  'portfolio',
  'projects',
  'work',
  'contact',
  'locations',
  'store',
  'shop',
]

const EXCLUDED_PATH_FRAGMENTS = [
  'blog',
  'news',
  'press',
  'careers',
  'jobs',
  'privacy',
  'terms',
  'legal',
  'login',
  'account',
  'cart',
  'checkout',
  'search',
  'tag',
  'author',
  'category',
  'feed',
  'wp-json',
]

function scoreUrl(url: string): number {
  const parsed = new URL(url)
  const path = parsed.pathname.toLowerCase()
  let score = 0

  for (const pattern of PERSONALIZATION_SLUG_PATTERNS) {
    if (path.includes(pattern)) {
      score += pattern.length
    }
  }

  for (const excluded of EXCLUDED_PATH_FRAGMENTS) {
    if (path.includes(excluded)) {
      return -1
    }
  }

  return score
}

function extractSitemapUrls(xml: string, baseUrl: string): { urls: string[]; sitemapIndexUrls: string[] } {
  const urls: string[] = []
  const dom = new JSDOM(xml, { url: baseUrl })
  const doc = dom.window.document

  // Standard sitemap URL set
  const urlTags = doc.querySelectorAll('url > loc')
  for (const tag of urlTags) {
    const loc = tag.textContent?.trim()
    if (loc) urls.push(loc)
  }

  // Sitemap index
  const sitemapTags = doc.querySelectorAll('sitemap > loc')
  const sitemapIndexUrls: string[] = []
  for (const tag of sitemapTags) {
    const loc = tag.textContent?.trim()
    if (loc) sitemapIndexUrls.push(loc)
  }

  return { urls, sitemapIndexUrls }
}

async function fetchSitemap(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      maxRedirects: 3,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: (s) => s >= 200 && s < 300,
    })
    return Buffer.isBuffer(response.data)
      ? response.data.toString('utf-8')
      : String(response.data)
  } catch {
    return null
  }
}

export async function discoverSitemapUrls(baseUrl: string): Promise<string[]> {
  const sanitized = sanitizeUrl(baseUrl)
  const parsed = new URL(sanitized)
  const origin = `${parsed.protocol}//${parsed.host}`

  const sitemapPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
  ]

  let sitemapXml: string | null = null
  let sitemapUrl = ''

  for (const path of sitemapPaths) {
    const url = `${origin}${path}`
    sitemapXml = await fetchSitemap(url)
    if (sitemapXml) {
      sitemapUrl = url
      break
    }
  }

  if (!sitemapXml) {
    return []
  }

  const { urls, sitemapIndexUrls } = extractSitemapUrls(sitemapXml, origin)

  // If this is a sitemap index, fetch child sitemaps
  if (sitemapIndexUrls.length > 0) {
    const childUrls: string[] = []
    for (const indexUrl of sitemapIndexUrls.slice(0, 3)) {
      const childXml = await fetchSitemap(indexUrl)
      if (childXml) {
        const childResult = extractSitemapUrls(childXml, origin)
        childUrls.push(...childResult.urls)
      }
    }
    urls.push(...childUrls)
  }

  // Filter same-origin, dedupe, score, and limit
  const seen = new Set<string>()
  const scored = urls
    .filter((url) => {
      try {
        const parsedUrl = new URL(url)
        return parsedUrl.origin === origin
      } catch {
        return false
      }
    })
    .map((url) => ({ url, score: scoreUrl(url) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PAGES - 1)
    .map((item) => {
      const normalized = item.url.replace(/\/$/, '')
      if (seen.has(normalized)) return null
      seen.add(normalized)
      return normalized
    })
    .filter((url): url is string => url !== null)

  return scored
}
