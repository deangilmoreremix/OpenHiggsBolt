/**
 * Crawlee-based free HTTP discovery provider.
 *
 * Uses CheerioCrawler for inexpensive HTTP-only crawling.
 * No browser, no Playwright, no Puppeteer.
 *
 * This is a FREE fallback layer, NOT a replacement for the existing
 * static crawler. It runs only when static discovery is insufficient.
 */

import { CheerioCrawler } from '@crawlee/cheerio'
import { JSDOM } from 'jsdom'
import { sanitizeUrl } from './discoverAssets'
import {
  MAX_PAGES,
  MAX_RAW_CANDIDATES,
  USEFUL_CATEGORIES,
} from './discoveryPolicy'
import type { ImageCandidate, DiscoveryResult } from './discoveryProvider'

const REQUEST_TIMEOUT = 15_000
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
  return score
}

function isExcluded(url: string): boolean {
  const parsed = new URL(url)
  const path = parsed.pathname.toLowerCase()
  return EXCLUDED_PATH_FRAGMENTS.some((frag) => path.includes(frag))
}

function extractImagesFromHtml(baseUrl: string, html: string, pageUrl: string): ImageCandidate[] {
  const dom = new JSDOM(html, { url: baseUrl })
  const doc = dom.window.document
  const candidates: ImageCandidate[] = []
  const seen = new Set<string>()

  const add = (rawUrl: string, altText?: string, ogContext?: string) => {
    if (!rawUrl || rawUrl.startsWith('data:')) return
    try {
      const absolute = new URL(rawUrl, baseUrl).toString()
      if (seen.has(absolute)) return
      seen.add(absolute)
      candidates.push({ url: absolute, sourcePage: pageUrl, altText, ogContext })
    } catch {
      // skip invalid URLs
    }
  }

  doc.querySelectorAll('img[src]').forEach((img) => {
    add(img.getAttribute('src') || '', img.getAttribute('alt') || undefined)
  })

  doc.querySelectorAll('img[srcset]').forEach((img) => {
    const srcset = img.getAttribute('srcset') || ''
    const entries = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)
    for (const entry of entries) {
      add(entry, img.getAttribute('alt') || undefined)
    }
  })

  doc.querySelectorAll('picture source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset') || ''
    const entries = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)
    for (const entry of entries) {
      add(entry)
    }
  })

  const metaTags = [
    { attr: 'property', values: ['og:image', 'og:image:url'] },
    { attr: 'name', values: ['twitter:image', 'twitter:image:src'] },
  ]
  for (const { attr, values } of metaTags) {
    for (const val of values) {
      doc.querySelectorAll(`meta[${attr}="${val}"]`).forEach((meta) => {
        const content = meta.getAttribute('content') || ''
        add(content, undefined, val)
      })
    }
  }

  return candidates
}

export async function discoverWithCrawlee(baseUrl: string): Promise<DiscoveryResult> {
  const sanitized = sanitizeUrl(baseUrl)
  const origin = new URL(sanitized).origin

  const allCandidates: ImageCandidate[] = []
  const seenUrls = new Set<string>()
  let pagesCrawled = 0

  const addCandidate = (candidate: ImageCandidate) => {
    if (allCandidates.length >= MAX_RAW_CANDIDATES) return
    if (seenUrls.has(candidate.url)) return
    seenUrls.add(candidate.url)
    allCandidates.push(candidate)
  }

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: MAX_PAGES,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: REQUEST_TIMEOUT / 1000,
    ignoreHttpErrorStatusCodes: [404, 403],
    preNavigationHooks: [
      async ({ request }, gotOptions) => {
        if (isExcluded(request.url)) {
          throw new Error('Excluded by personalization policy')
        }
        try {
          const parsed = new URL(request.url)
          if (parsed.origin !== origin) {
            throw new Error('Excluded by personalization policy')
          }
        } catch {
          // allow if URL parsing fails (shouldn't happen)
        }
        gotOptions.headers = {
          ...(gotOptions.headers || {}),
          'User-Agent': USER_AGENT,
        }
      },
    ],
    async requestHandler({ request, enqueueLinks, $, log }) {
      pagesCrawled++
      const html = $.html()
      const candidates = extractImagesFromHtml(sanitized, html, request.url)
      for (const candidate of candidates) {
        addCandidate(candidate)
      }

      // Enqueue only high-value personalization links
      const outgoing = request.loadedUrl
      if (outgoing) {
        try {
          const dom = new JSDOM(html, { url: sanitized })
          const doc = dom.window.document
          const base = new URL(outgoing)
          const links: string[] = []

          doc.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href') || ''
            try {
              const absolute = new URL(href, base).toString()
              if (new URL(absolute).origin !== origin) return
              if (isExcluded(absolute)) return
              if (scoreUrl(absolute) <= 0) return
              links.push(absolute)
            } catch {
              // skip
            }
          })

          const uniqueLinks = Array.from(new Set(links))
          await enqueueLinks({
            urls: uniqueLinks.slice(0, MAX_PAGES - 1),
            strategy: 'all',
          })
        } catch {
          // skip enqueue on parse errors
        }
      }
    },
  })

  await crawler.run([sanitized])

  return {
    candidates: allCandidates,
    provider: 'CRAWLEE_CHEERIO',
    pagesCrawled,
    rawCandidates: allCandidates.length,
    socialProfiles: [],
  }
}
