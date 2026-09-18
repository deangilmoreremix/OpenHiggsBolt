/**
 * Server-side Playwright/Chromium fallback for business asset discovery.
 *
 * This module is only invoked when the static axios+JSDOM path appears
 * insufficient. It keeps browser resources bounded and preserves the
 * existing security model.
 */

import { chromium } from 'playwright'
import { extractWebsiteIntelligence, type WebsiteIntelligence } from './websiteIntelligence'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const BROWSER_FALLBACK_MAX_PAGES = 4
export const BROWSER_FALLBACK_MAX_CANDIDATES = 60
export const BROWSER_FALLBACK_NAVIGATION_TIMEOUT = 20_000
export const BROWSER_FALLBACK_SCROLL_TIMEOUT = 4_000
export const BROWSER_FALLBACK_SCROLL_ATTEMPTS = 4
export const BROWSER_FALLBACK_SCROLL_DELAY = 600
export const BROWSER_FALLBACK_MAX_IMAGES_PER_PAGE = 40

// Resource types to block during discovery to improve performance.
const BLOCKED_RESOURCE_TYPES = [
  'media',
  'font',
  'stylesheet',
]

// Patterns for URLs that should be blocked.
const BLOCKED_URL_PATTERNS = [
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /doubleclick\.net/i,
  /facebook\.com\/tr/i,
  /twitter\.com\/i\/ads/i,
  /ads\/|advertising/i,
  /analytics/i,
  /tracking/i,
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrowserImageCandidate {
  url: string
  sourcePage: string
  altText?: string
}

export interface BrowserDiscoveryResult {
  candidates: BrowserImageCandidate[]
  staticCandidates: number
  browserCandidates: number
  pagesCrawled: number
  fallbackUsed: boolean
  websiteIntelligence?: WebsiteIntelligence
  screenshot?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isBlockedUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url))
}

function isLikelyJunk(url: string): boolean {
  const lower = url.toLowerCase()
  const path = new URL(url).pathname.toLowerCase()

  const junkFragments = [
    'favicon', 'icon', 'sprite', 'pixel', 'tracking', 'analytics', 'beacon',
    '1x1', 'spacer', 'loader', 'spinner', 'placeholder', 'blank',
  ]
  if (junkFragments.some((frag) => path.includes(frag))) return true
  if (path.endsWith('.svg')) return true
  if (path.endsWith('.gif')) return true

  const socialDomains = [
    'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com',
    'youtube.com', 'tiktok.com', 'pinterest.com', 'yelp.com', 'google.com',
    'maps.google', 'goo.gl', 'bit.ly', 'tinyurl.com',
  ]
  if (socialDomains.some((d) => lower.includes(d))) return true

  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRenderedImages(page: any, pageUrl: string): BrowserImageCandidate[] {
  const candidates: BrowserImageCandidate[] = []
  const seen = new Set<string>()

  const add = (rawUrl: string, altText?: string) => {
    if (!rawUrl || rawUrl.startsWith('data:')) return
    let absolute: string
    try {
      absolute = new URL(rawUrl, pageUrl).toString()
    } catch {
      return
    }
    if (seen.has(absolute)) return
    if (isLikelyJunk(absolute)) return
    seen.add(absolute)
    candidates.push({ url: absolute, sourcePage: pageUrl, altText })
  }

  page.evaluate(() => {
    const win = window as unknown as { __discoveryCandidates: Array<{ src: string; alt?: string }> }
    if (!win.__discoveryCandidates) {
      win.__discoveryCandidates = []
    }

    const walk = (root: Document | Element) => {
      const imgs = root.querySelectorAll('img')
      for (const img of imgs) {
        const src = (img as HTMLImageElement).src || ''
        const currentSrc = (img as HTMLImageElement).currentSrc || ''
        const dataSrc = (img as HTMLImageElement).getAttribute('data-src') || ''
        const dataSrcset = (img as HTMLImageElement).getAttribute('data-srcset') || ''
        const srcset = (img as HTMLImageElement).getAttribute('srcset') || ''

        if (src) win.__discoveryCandidates.push({ src, alt: (img as HTMLImageElement).alt || '' })
        if (currentSrc && currentSrc !== src) win.__discoveryCandidates.push({ src: currentSrc, alt: (img as HTMLImageElement).alt || '' })
        if (dataSrc) win.__discoveryCandidates.push({ src: dataSrc, alt: (img as HTMLImageElement).alt || '' })
        if (dataSrcset) {
          for (const entry of dataSrcset.split(',').map((s: string) => s.trim().split(/\s+/)[0]).filter(Boolean)) {
            win.__discoveryCandidates.push({ src: entry, alt: (img as HTMLImageElement).alt || '' })
          }
        }
        if (srcset) {
          for (const entry of srcset.split(',').map((s: string) => s.trim().split(/\s+/)[0]).filter(Boolean)) {
            win.__discoveryCandidates.push({ src: entry, alt: (img as HTMLImageElement).alt || '' })
          }
        }
      }

      const pictures = root.querySelectorAll('picture')
      for (const picture of pictures) {
        const sources = picture.querySelectorAll('source[srcset]')
        for (const source of sources) {
          const srcset = (source as HTMLSourceElement).getAttribute('srcset') || ''
          for (const entry of srcset.split(',').map((s: string) => s.trim().split(/\s+/)[0]).filter(Boolean)) {
            win.__discoveryCandidates.push({ src: entry })
          }
        }
      }

      // CSS background images from inline styles
      const allElements = root.querySelectorAll('[style]')
      for (const el of allElements) {
        const bg = (el as HTMLElement).style.backgroundImage
        if (bg && bg.includes('url(')) {
          const match = bg.match(/url\(["']?([^"')]+)["']?\)/)
          if (match?.[1]) {
            win.__discoveryCandidates.push({ src: match[1] })
          }
        }
      }
    }

    walk(document)
  })

  const raw = page.evaluate(() => (window as any).__discoveryCandidates || []) // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const item of raw) {
    add(item.src, item.alt)
  }

  return candidates
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scrollPage(page: any, maxAttempts: number, delayMs: number): Promise<void> {
  let lastHeight = 0
  let attempts = 0

  await page.waitForTimeout(500)

  while (attempts < maxAttempts) {
    const currentHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    if (currentHeight === lastHeight) break

    lastHeight = currentHeight
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8))
    await page.waitForTimeout(delayMs)
    attempts++
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0))
}

async function collectBrowserCandidates(baseUrl: string, pages: string[]): Promise<BrowserDiscoveryResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any = null
  let pagesCrawled = 0
  const allCandidates: BrowserImageCandidate[] = []
  let websiteIntelligence: WebsiteIntelligence = {}
  let screenshotBuffer: Buffer | undefined

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; AssetDiscovery/1.0; +https://example.com/bot)',
      viewport: { width: 1280, height: 900 },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await context.route('**/*', async (route: any, request: any) => {
      const resourceType = request.resourceType()
      const url = request.url()

      if (isBlockedUrl(url) || BLOCKED_RESOURCE_TYPES.includes(resourceType)) {
        return route.abort()
      }

      return route.continue()
    })

    for (const pageUrl of pages) {
      if (allCandidates.length >= BROWSER_FALLBACK_MAX_CANDIDATES) break

      const page = await context.newPage()
      try {
        await page.goto(pageUrl, {
          waitUntil: 'domcontentloaded',
          timeout: BROWSER_FALLBACK_NAVIGATION_TIMEOUT,
        })

        // Reject if navigated away from allowed origin
        const currentUrl = page.url()
        const currentHostname = new URL(currentUrl).hostname
        const baseHostname = new URL(baseUrl).hostname
        if (currentHostname !== baseHostname) {
          await page.close()
          continue
        }

        await scrollPage(page, BROWSER_FALLBACK_SCROLL_ATTEMPTS, BROWSER_FALLBACK_SCROLL_DELAY)

        const pageCandidates = extractRenderedImages(page, pageUrl)
        allCandidates.push(...pageCandidates)
        pagesCrawled++

        // Capture screenshot from first successful page
        if (!screenshotBuffer) {
          try {
            screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false })
          } catch {
            // screenshot capture is best-effort
          }
        }

        // Extract website intelligence
        const pageIntelligence = extractWebsiteIntelligence(page, pageUrl)
        mergeIntelligence(websiteIntelligence, pageIntelligence)
      } catch (err) {
        console.error(`[browser-discovery] page failed: ${pageUrl}`, err instanceof Error ? err.message : err)
      } finally {
        await page.close()
      }
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  const staticCount = allCandidates.length
  const browserCount = allCandidates.length

  return {
    candidates: allCandidates.slice(0, BROWSER_FALLBACK_MAX_CANDIDATES),
    staticCandidates: staticCount,
    browserCandidates: browserCount,
    pagesCrawled,
    fallbackUsed: true,
    websiteIntelligence,
    screenshot: screenshotBuffer?.toString('base64'),
  }
}

function mergeIntelligence(target: WebsiteIntelligence, source: WebsiteIntelligence): void {
  if (source.businessName && !target.businessName) target.businessName = source.businessName
  if (source.industry && !target.industry) target.industry = source.industry
  if (source.location && !target.location) target.location = source.location
  if (source.phones && source.phones.length > 0) {
    target.phones = [...(target.phones || []), ...source.phones]
    target.phones = [...new Set(target.phones)]
  }
  if (source.emails && source.emails.length > 0) {
    target.emails = [...(target.emails || []), ...source.emails]
    target.emails = [...new Set(target.emails)]
  }
  if (source.services && source.services.length > 0) {
    target.services = [...(target.services || []), ...source.services]
  }
  if (source.products && source.products.length > 0) {
    target.products = [...(target.products || []), ...source.products]
  }
  if (source.offers && source.offers.length > 0) {
    target.offers = [...(target.offers || []), ...source.offers]
  }
  if (source.callsToAction && source.callsToAction.length > 0) {
    target.callsToAction = [...(target.callsToAction || []), ...source.callsToAction]
  }
  if (source.keyMessages && source.keyMessages.length > 0) {
    target.keyMessages = [...(target.keyMessages || []), ...source.keyMessages]
  }
  if (source.brand) {
    target.brand = target.brand || {}
    if (source.brand.colors && source.brand.colors.length > 0) {
      target.brand.colors = [...(target.brand.colors || []), ...source.brand.colors]
      target.brand.colors = [...new Set(target.brand.colors)]
    }
    if (source.brand.fonts && source.brand.fonts.length > 0) {
      target.brand.fonts = [...(target.brand.fonts || []), ...source.brand.fonts]
      target.brand.fonts = [...new Set(target.brand.fonts)]
    }
    if (source.brand.tone && source.brand.tone.length > 0) {
      target.brand.tone = [...(target.brand.tone || []), ...source.brand.tone]
      target.brand.tone = [...new Set(target.brand.tone)]
    }
  }
  if (source.socialProfiles && source.socialProfiles.length > 0) {
    target.socialProfiles = [...(target.socialProfiles || []), ...source.socialProfiles]
    const seen = new Set(target.socialProfiles.map((p) => p.url))
    target.socialProfiles = target.socialProfiles.filter((p) => {
      if (seen.has(p.url)) return false
      seen.add(p.url)
      return true
    })
  }
  if (source.completenessScore !== undefined) {
    target.completenessScore = Math.max(target.completenessScore || 0, source.completenessScore)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function discoverRenderedAssets(
  baseUrl: string,
  pages: string[],
): Promise<BrowserDiscoveryResult> {
  if (pages.length === 0) {
    return {
      candidates: [],
      staticCandidates: 0,
      browserCandidates: 0,
      pagesCrawled: 0,
      fallbackUsed: false,
    }
  }

  const limitedPages = pages.slice(0, BROWSER_FALLBACK_MAX_PAGES)
  return collectBrowserCandidates(baseUrl, limitedPages)
}
