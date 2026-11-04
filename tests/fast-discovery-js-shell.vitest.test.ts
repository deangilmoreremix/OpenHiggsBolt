/**
 * A JS-rendered homepage escalates to the browser layer even when the free
 * layers found the bare minimum, and a healthy result does not.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

const homeHtml = vi.hoisted(() => ({ value: '' }))
const staticCandidates = vi.hoisted(() => ({ value: [] as any[] }))

vi.mock('../src/server/staticDiscovery', () => ({
  StaticDiscoveryProvider: class {
    readonly name = 'STATIC_FALLBACK'
    async discover(options: { onHomeHtml?: (html: string) => void }) {
      options.onHomeHtml?.(homeHtml.value)
      return {
        candidates: staticCandidates.value,
        provider: 'STATIC_FALLBACK',
        pagesCrawled: 1,
        rawCandidates: staticCandidates.value.length,
        socialProfiles: [],
      }
    }
  },
}))
vi.mock('../src/server/sitemapDiscovery', () => ({
  discoverSitemap: async () => ({ pageUrls: [], imageUrls: [] }),
}))
vi.mock('../src/server/crawleeProvider', () => ({
  discoverWithCrawlee: async () => ({ candidates: [], pagesCrawled: 0, rawCandidates: 0, socialProfiles: [] }),
}))

import { runFastDiscovery } from '../src/server/fastDiscovery'

function products(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://cdn.example/products/item-${i}.jpg`,
    sourcePage: 'https://shop.example/',
    category: 'product',
    confidence: 80,
    recommended: true,
  }))
}

const SHELL = '<html><body><div id="root"></div><script src="/app.js"></script></body></html>'
const CONTENT = `<html><body><p>${'Real business text. '.repeat(60)}</p>${'<img src="/a.jpg">'.repeat(6)}</body></html>`

describe('runFastDiscovery JS-shell escalation', () => {
  beforeEach(() => {
    homeHtml.value = ''
    staticCandidates.value = []
  })

  it('escalates a JS shell that only yielded the minimum', async () => {
    homeHtml.value = SHELL
    staticCandidates.value = [
      { url: 'https://cdn.example/logo.png', sourcePage: 'https://shop.example/', category: 'logo', confidence: 85, recommended: true },
      ...products(4),
    ]
    const result = await runFastDiscovery({ websiteUrl: 'https://shop.example', maxPages: 1, maxImages: 20 })
    expect(result.jsRender?.jsRendered).toBe(true)
    expect(result.needsBrowser).toBe(true)
    expect(result.providerAttempts).toContain('JS_SHELL_DETECTED')
  })

  it('does not escalate a normal page with enough assets', async () => {
    homeHtml.value = CONTENT
    staticCandidates.value = [
      { url: 'https://cdn.example/logo.png', sourcePage: 'https://shop.example/', category: 'logo', confidence: 85, recommended: true },
      ...products(4),
    ]
    const result = await runFastDiscovery({ websiteUrl: 'https://shop.example', maxPages: 1, maxImages: 20 })
    expect(result.jsRender?.jsRendered).toBe(false)
    expect(result.needsBrowser).toBe(false)
  })

  it('does not escalate a JS shell whose embedded data already gave plenty', async () => {
    homeHtml.value = SHELL
    staticCandidates.value = [
      { url: 'https://cdn.example/logo.png', sourcePage: 'https://shop.example/', category: 'logo', confidence: 85, recommended: true },
      ...products(10),
    ]
    const result = await runFastDiscovery({ websiteUrl: 'https://shop.example', maxPages: 1, maxImages: 20 })
    expect(result.needsBrowser).toBe(false)
  })
})
