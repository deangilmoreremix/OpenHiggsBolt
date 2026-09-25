/**
 * Server-side Playwright/Chromium fallback for business asset discovery.
 *
 * This module is only invoked when the static axios+Cheerio path appears
 * insufficient. It keeps browser resources bounded and preserves the
 * existing security model.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const BROWSER_FALLBACK_MAX_PAGES = 4
export const BROWSER_FALLBACK_MAX_CANDIDATES = 60
export const BROWSER_FALLBACK_NAVIGATION_TIMEOUT = 5_000
export const BROWSER_FALLBACK_SCROLL_TIMEOUT = 2_000
export const BROWSER_FALLBACK_SCROLL_ATTEMPTS = 1
export const BROWSER_FALLBACK_SCROLL_DELAY = 100
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
// Runtime guard / lazy loader
// ---------------------------------------------------------------------------

let cachedChromium: Promise<any> | null = null

export function isBrowserDiscoveryAvailable(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require.resolve('playwright')
    return true
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require.resolve('playwright-core')
      return true
    } catch {
      return false
    }
  }
}

async function getChromiumExecutablePath(): Promise<string | undefined> {
  try {
    // @sparticuz/chromium provides a Linux serverless-compatible Chromium.
    // Use it only when the local platform is not macOS, because the downloaded
    // binary is Linux ELF and cannot run on Darwin.
    if (process.platform !== 'darwin') {
      const { default: chromium } = await import('@sparticuz/chromium')
      return chromium.executablePath()
    }
  } catch {
    // Fall back to Playwright-managed Chromium below.
  }
  return undefined
}

async function getChromium() {
  if (!cachedChromium) {
    cachedChromium = (async () => {
      try {
        const { chromium } = await import('playwright')
        return chromium
      } catch {
        const { chromium } = await import('playwright-core')
        return chromium
      }
    })()
  }
  return cachedChromium
}

if (!isBrowserDiscoveryAvailable()) {
  console.warn('[browserDiscovery] Playwright is not available in this runtime; browser fallback is disabled.')
}

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
async function extractRenderedImages(page: any, pageUrl: string): Promise<BrowserImageCandidate[]> {
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

  await page.evaluate(`
    (function() {
      var win = window;
      if (!win.__discoveryCandidates) {
        win.__discoveryCandidates = [];
      }

      function walk(root) {
        var imgs = root.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
          var img = imgs[i];
          var src = img.src || '';
          var currentSrc = img.currentSrc || '';
          var dataSrc = img.getAttribute('data-src') || '';
          var dataSrcset = img.getAttribute('data-srcset') || '';
          var srcset = img.getAttribute('srcset') || '';

          if (src) win.__discoveryCandidates.push({ src: src, alt: img.alt || '' });
          if (currentSrc && currentSrc !== src) win.__discoveryCandidates.push({ src: currentSrc, alt: img.alt || '' });
          if (dataSrc) win.__discoveryCandidates.push({ src: dataSrc, alt: img.alt || '' });
          if (dataSrcset) {
            var dataEntries = dataSrcset.split(',').map(function(s) { return s.trim().split(/\\s+/)[0]; }).filter(Boolean);
            for (var j = 0; j < dataEntries.length; j++) {
              win.__discoveryCandidates.push({ src: dataEntries[j], alt: img.alt || '' });
            }
          }
          if (srcset) {
            var srcEntries = srcset.split(',').map(function(s) { return s.trim().split(/\\s+/)[0]; }).filter(Boolean);
            for (var k = 0; k < srcEntries.length; k++) {
              win.__discoveryCandidates.push({ src: srcEntries[k], alt: img.alt || '' });
            }
          }
        }

        var pictures = root.querySelectorAll('picture');
        for (var p = 0; p < pictures.length; p++) {
          var sources = pictures[p].querySelectorAll('source[srcset]');
          for (var s = 0; s < sources.length; s++) {
            var sourceSrcset = sources[s].getAttribute('srcset') || '';
            var sourceEntries = sourceSrcset.split(',').map(function(x) { return x.trim().split(/\\s+/)[0]; }).filter(Boolean);
            for (var e = 0; e < sourceEntries.length; e++) {
              win.__discoveryCandidates.push({ src: sourceEntries[e] });
            }
          }
        }

        var allElements = root.querySelectorAll('[style]');
        for (var el = 0; el < allElements.length; el++) {
          var bg = allElements[el].style.backgroundImage;
          if (bg && bg.includes('url(')) {
            var match = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
            if (match && match[1]) {
              win.__discoveryCandidates.push({ src: match[1] });
            }
          }
        }
      }

      walk(document);
    })
  `)

  const raw = (await page.evaluate(`
    (function() {
      var win = window;
      if (!win.__discoveryCandidates) {
        return [];
      }
      return win.__discoveryCandidates;
    })()
  `)) as Array<{ src: string; alt?: string }>

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
    const currentHeight = await page.evaluate('document.documentElement.scrollHeight')
    if (currentHeight === lastHeight) break

    lastHeight = currentHeight
    await page.evaluate('window.scrollBy(0, window.innerHeight * 0.8)')
    await page.waitForTimeout(delayMs)
    attempts++
  }

  await page.evaluate('window.scrollTo(0, 0)')
}

let cachedBrowser: Promise<any> | null = null

async function getOrCreateBrowser() {
  // If we have a cached promise, verify the resolved browser is still alive.
  if (cachedBrowser) {
    try {
      const browser = await cachedBrowser
      if (browser && typeof browser.isConnected === 'function' && !browser.isConnected()) {
        cachedBrowser = null
      }
    } catch {
      cachedBrowser = null
    }
  }

  if (!cachedBrowser) {
    cachedBrowser = (async () => {
      const chromium = await getChromium()
      const executablePath = await getChromiumExecutablePath()
      const browser = await chromium.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      })
      return browser
    })().catch((err) => {
      cachedBrowser = null
      throw err
    })
  }
  return cachedBrowser
}

async function collectBrowserCandidates(baseUrl: string, pages: string[]): Promise<BrowserDiscoveryResult> {
  let browser: any = null
  let context: any = null
  let pagesCrawled = 0
  const allCandidates: BrowserImageCandidate[] = []

  try {
    browser = await getOrCreateBrowser()

    context = await browser.newContext({
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

        const pageCandidates = await extractRenderedImages(page, pageUrl)
        allCandidates.push(...pageCandidates)
        pagesCrawled++
      } catch (err) {
        console.error(`[browser-discovery] page failed: ${pageUrl}`, err instanceof Error ? err.message : err)
      } finally {
        await page.close()
      }
    }
  } finally {
    // Close the browser context after each discovery run so businesses do not
    // share cookies, cache, or storage between runs. The cached browser
    // process itself is kept for warm-server reuse.
    if (context) {
      try {
        await context.close()
      } catch {
        // ignore context close errors
      }
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
