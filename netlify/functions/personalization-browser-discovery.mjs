const { createClient } = require('@supabase/supabase-js')
const { chromium } = require('playwright-core')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRole)

async function getChromiumExecutablePath() {
  try {
    const { default: chromiumMin } = await import('@sparticuz/chromium-min')
    if (process.platform !== 'darwin') {
      return chromiumMin.executablePath()
    }
  } catch {
    // ignore
  }
  return undefined
}

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-first-run',
  '--safebrowsing-disable-auto-update',
  '--disable-default-apps',
  '--disable-features=site-per-process',
]

const BLOCKED_RESOURCE_TYPES = ['media', 'font', 'stylesheet']

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

function isBlockedUrl(url) {
  return BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url))
}

function isLikelyJunk(url) {
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

async function collectBrowserCandidates(baseUrl, pages, pageTelemetry) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: await getChromiumExecutablePath(),
    args: BROWSER_ARGS,
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; AssetDiscovery/1.0; +https://example.com/bot)',
    viewport: { width: 1280, height: 900 },
  })

  let pagesCrawled = 0
  const allCandidates = []

  try {
    await context.route('**/*', async (route, request) => {
      const resourceType = request.resourceType()
      const url = request.url()
      if (isBlockedUrl(url) || BLOCKED_RESOURCE_TYPES.includes(resourceType)) {
        return route.abort()
      }
      return route.continue()
    })

    for (const pageUrl of pages) {
      if (allCandidates.length >= 60) break

      const navStartedAt = new Date().toISOString()
      let navCompletedAt = null
      let navError = null
      let pageCandidates = []
      let candidateCount = 0

      const page = await context.newPage()
      try {
        await page.goto(pageUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 5000,
        })
        navCompletedAt = new Date().toISOString()

        const currentUrl = page.url()
        const currentHostname = new URL(currentUrl).hostname
        const baseHostname = new URL(baseUrl).hostname
        if (currentHostname !== baseHostname) {
          await page.close()
          continue
        }

        await page.waitForTimeout(500)
        let lastHeight = 0
        let attempts = 0
        while (attempts < 1) {
          const currentHeight = await page.evaluate('document.documentElement.scrollHeight')
          if (currentHeight === lastHeight) break
          lastHeight = currentHeight
          await page.evaluate('window.scrollBy(0, window.innerHeight * 0.8)')
          await page.waitForTimeout(100)
          attempts++
        }
        await page.evaluate('window.scrollTo(0, 0)')

        await page.evaluate(`
          (function() {
            var win = window;
            if (!win.__discoveryCandidates) { win.__discoveryCandidates = []; }
            function walk(root) {
              var imgs = root.querySelectorAll('img');
              for (var i = 0; i < imgs.length; i++) {
                var img = imgs[i];
                var src = img.src || '', currentSrc = img.currentSrc || '';
                var dataSrc = img.getAttribute('data-src') || '';
                var dataSrcset = img.getAttribute('data-srcset') || '';
                var srcset = img.getAttribute('srcset') || '';
                if (src) win.__discoveryCandidates.push({ src: src, alt: img.alt || '' });
                if (currentSrc && currentSrc !== src) win.__discoveryCandidates.push({ src: currentSrc, alt: img.alt || '' });
                if (dataSrc) win.__discoveryCandidates.push({ src: dataSrc, alt: img.alt || '' });
                if (dataSrcset) {
                  var entries = dataSrcset.split(',').map(function(s) { return s.trim().split(/\\s+/)[0]; }).filter(Boolean);
                  for (var j = 0; j < entries.length; j++) win.__discoveryCandidates.push({ src: entries[j], alt: img.alt || '' });
                }
                if (srcset) {
                  var srcEntries = srcset.split(',').map(function(s) { return s.trim().split(/\\s+/)[0]; }).filter(Boolean);
                  for (var k = 0; k < srcEntries.length; k++) win.__discoveryCandidates.push({ src: srcEntries[k], alt: img.alt || '' });
                }
              }
              var pictures = root.querySelectorAll('picture');
              for (var p = 0; p < pictures.length; p++) {
                var sources = pictures[p].querySelectorAll('source[srcset]');
                for (var s = 0; s < sources.length; s++) {
                  var sourceSrcset = sources[s].getAttribute('srcset') || '';
                  var sourceEntries = sourceSrcset.split(',').map(function(x) { return x.trim().split(/\\s+/)[0]; }).filter(Boolean);
                  for (var e = 0; e < sourceEntries.length; e++) win.__discoveryCandidates.push({ src: sourceEntries[e] });
                }
              }
              var allElements = root.querySelectorAll('[style]');
              for (var el = 0; el < allElements.length; el++) {
                var bg = allElements[el].style.backgroundImage;
                if (bg && bg.includes('url(')) {
                  var match = bg.match(/\\(["']?([^"')]+)["']?\\)/);
                  if (match && match[1]) win.__discoveryCandidates.push({ src: match[1] });
                }
              }
            }
            walk(document);
          })
        `)

        const raw = await page.evaluate(`
          (function() {
            var win = window;
            return win.__discoveryCandidates || [];
          })
        `)

        const seen = new Set()
        for (const item of raw) {
          if (!item.src || item.src.startsWith('data:')) continue
          let absolute
          try {
            absolute = new URL(item.src, pageUrl).toString()
          } catch {
            continue
          }
          if (seen.has(absolute)) continue
          if (isLikelyJunk(absolute)) continue
          seen.add(absolute)
          pageCandidates.push({ url: absolute, sourcePage: pageUrl, altText: item.alt })
        }
        candidateCount = pageCandidates.length
        allCandidates.push(...pageCandidates)
        pagesCrawled++
      } catch (err) {
        navError = err instanceof Error ? err.message : String(err)
      } finally {
        await page.close()
      }

      const navDurationMs = navCompletedAt
        ? new Date(navCompletedAt).getTime() - new Date(navStartedAt).getTime()
        : null

      pageTelemetry.push({
        url: pageUrl,
        navigationStartedAt: navStartedAt,
        navigationCompletedAt: navCompletedAt,
        navigationDurationMs: navDurationMs,
        candidateCount,
        error: navError,
      })
    }
  } finally {
    try {
      await context.close()
    } catch {
      // ignore context close errors
    }
  }

  return {
    candidates: allCandidates.slice(0, 60),
    pagesCrawled,
  }
}

module.exports = { handler: async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const corsHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  try {
    const body = JSON.parse(event.body || '{}')
    const { jobId, websiteUrl, priorityPages } = body

    if (!jobId || !websiteUrl) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'jobId and websiteUrl are required' }) }
    }

    const { data: job, error: fetchError } = await supabase
      .from('personalization_discovery_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (fetchError || !job) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Job not found' }) }
    }

    const startedAt = new Date().toISOString()
    await supabase
      .from('personalization_discovery_jobs')
      .update({ status: 'running', started_at: startedAt })
      .eq('id', jobId)

    const browserRuntimeMode = process.platform === 'darwin' ? 'local-mac' : 'netlify-linux'
    const browserAvailable = true
    const browserExecutableResolved = await getChromiumExecutablePath() || 'playwright-managed'
    const browserLaunchStartedAt = new Date().toISOString()

    let browserLaunchedAt = null
    let browserCandidates = 0
    let browserOnlyCandidates = 0
    let browserDurationMs = 0
    let browserErrorCode = null
    let browserErrorMessage = null
    let finalResult = null
    const pageTelemetry = []

    try {
      const browser = await chromium.launch({
        headless: true,
        executablePath: browserExecutableResolved !== 'playwright-managed' ? browserExecutableResolved : undefined,
        args: BROWSER_ARGS,
      })
      browserLaunchedAt = new Date().toISOString()

      const pages = Array.isArray(priorityPages) && priorityPages.length > 0
        ? priorityPages.slice(0, 4)
        : [websiteUrl]

      const { candidates, pagesCrawled } = await collectBrowserCandidates(websiteUrl, pages, pageTelemetry)

      browserCandidates = candidates.length
      browserOnlyCandidates = candidates.length
      const browserCompletedAt = new Date().toISOString()
      browserDurationMs = new Date(browserCompletedAt).getTime() - new Date(browserLaunchStartedAt).getTime()

      finalResult = {
        provider: 'SMARTVIDEO_BROWSER',
        candidates,
        pagesCrawled,
        rawCandidates: candidates.length,
        socialProfiles: [],
      }

      await supabase
        .from('personalization_discovery_jobs')
        .update({
          status: 'complete',
          completed_at: browserCompletedAt,
          browser_result_json: finalResult,
          final_result_json: finalResult,
          telemetry_json: {
            browserRuntimeMode,
            browserAvailable,
            browserExecutableResolved,
            browserLaunchStartedAt,
            browserLaunchedAt,
            pagesRequested: pages.length,
            pagesCrawled,
            perPage: pageTelemetry,
            browserCandidates,
            browserOnlyCandidates,
            browserDurationMs,
            browserErrorCode: null,
            browserErrorMessage: null,
          },
        })
        .eq('id', jobId)
    } catch (err) {
      const errorCompletedAt = new Date().toISOString()
      browserDurationMs = new Date(errorCompletedAt).getTime() - new Date(browserLaunchStartedAt).getTime()
      browserErrorCode = err?.code || 'BROWSER_LAUNCH_FAILED'
      browserErrorMessage = err instanceof Error ? err.message : String(err)

      await supabase
        .from('personalization_discovery_jobs')
        .update({
          status: 'error',
          completed_at: errorCompletedAt,
          error_code: browserErrorCode,
          error_message: browserErrorMessage,
          telemetry_json: {
            browserRuntimeMode,
            browserAvailable,
            browserExecutableResolved,
            browserLaunchStartedAt,
            browserLaunchedAt,
            pagesRequested: (priorityPages || []).length || 1,
            pagesCrawled: 0,
            perPage: pageTelemetry,
            browserCandidates: 0,
            browserOnlyCandidates: 0,
            browserDurationMs,
            browserErrorCode,
            browserErrorMessage,
          },
        })
        .eq('id', jobId)
    } finally {
      try {
        if (typeof browser !== 'undefined' && browser !== null) {
          await browser.close()
        }
      } catch {
        // ignore
      }
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, jobId }) }
  } catch (err) {
    const errorCode = err?.code || 'BACKGROUND_FUNCTION_ERROR'
    const errorMessage = err instanceof Error ? err.message : String(err)

    try {
      await supabase
        .from('personalization_discovery_jobs')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          error_code: errorCode,
          error_message: errorMessage,
        })
        .eq('id', JSON.parse(event.body || '{}').jobId)
    } catch {
      // ignore supabase update error
    }

    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: errorMessage, code: errorCode }) }
  }
}}
