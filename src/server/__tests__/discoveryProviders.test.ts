/**
 * Tests for Firecrawl discovery provider and orchestrator.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('studio/src/muapi', () => ({
  uploadFile: vi.fn(),
}))

import axios from 'axios'
import { FirecrawlDiscoveryProvider } from '../firecrawlDiscovery'
import { StaticDiscoveryProvider } from '../staticDiscovery'
import { orchestrateDiscovery } from '../discoveryOrchestrator'
import { getBusinessAssetClassificationModel } from '../discoveryClassificationConfig'

// ---------------------------------------------------------------------------
// Classification model config
// ---------------------------------------------------------------------------

describe('getBusinessAssetClassificationModel', () => {
  it('defaults to gpt-4o-mini when env is unset', () => {
    const result = getBusinessAssetClassificationModel()
    expect(result).toBe('gpt-4o-mini')
  })
})

// ---------------------------------------------------------------------------
// FirecrawlDiscoveryProvider
// ---------------------------------------------------------------------------

describe('FirecrawlDiscoveryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires API key on construction', () => {
    expect(() => new FirecrawlDiscoveryProvider('')).toThrow('Firecrawl API key is required')
  })

  it('returns provider name FIRECRAWL', () => {
    const provider = new FirecrawlDiscoveryProvider('fc-test')
    expect(provider.name).toBe('FIRECRAWL')
  })

  it('throws when Firecrawl request fails after retries', async () => {
    const provider = new FirecrawlDiscoveryProvider('fc-test')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'))

    await expect(
      provider.discover({
        websiteUrl: 'https://example.com',
        maxPages: 5,
        maxImages: 20,
      }),
    ).rejects.toThrow('network error')
  })

  it('filters junk image URLs from Firecrawl results', async () => {
    const provider = new FirecrawlDiscoveryProvider('fc-test')
    const firecrawlResponse = {
      data: [
        {
          url: 'https://example.com/page1',
          html: `
            <html>
              <body>
                <img src="https://example.com/logo.png" />
                <img src="https://example.com/favicon.ico" />
                <img src="https://example.com/analytics/pixel.png" />
                <img src="https://facebook.com/tr" />
              </body>
            </html>
          `,
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => firecrawlResponse,
    } as Response)

    const result = await provider.discover({
      websiteUrl: 'https://example.com',
      maxPages: 5,
      maxImages: 20,
    })

    expect(result.provider).toBe('FIRECRAWL')
    expect(result.pagesCrawled).toBe(1)
    const urls = result.candidates.map((c) => c.url)
    expect(urls).toContain('https://example.com/logo.png')
    expect(urls).not.toContain('https://example.com/favicon.ico')
    expect(urls).not.toContain('https://example.com/analytics/pixel.png')
    expect(urls).not.toContain('https://facebook.com/tr')
  })
})

// ---------------------------------------------------------------------------
// StaticDiscoveryProvider
// ---------------------------------------------------------------------------

describe('StaticDiscoveryProvider', () => {
  it('returns provider name STATIC_FALLBACK', () => {
    const provider = new StaticDiscoveryProvider()
    expect(provider.name).toBe('STATIC_FALLBACK')
  })

  it('delegates to discoverBusinessAssets', async () => {
    const provider = new StaticDiscoveryProvider()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, discoveredAssets: [], count: 0 }),
    } as Response)

    const result = await provider.discover({
      websiteUrl: 'https://example.com',
      maxPages: 2,
      maxImages: 10,
    })

    expect(result.provider).toBe('STATIC_FALLBACK')
  })
})

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

describe('orchestrateDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses static first when API key is provided', async () => {
    // Mock axios for static provider
    vi.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html' },
      data: '<html><body><img src="https://example.com/logo.png" /></body></html>',
    } as any)

    const result = await orchestrateDiscovery({
      websiteUrl: 'https://example.com',
      maxPages: 5,
      maxImages: 20,
      firecrawlApiKey: 'fc-test',
    })

    // Static is now the primary provider; Firecrawl is optional fallback
    expect(result.providerAttempted).toBe('SMARTVIDEO_STATIC')
    expect(result.providerUsed).toBe('SMARTVIDEO_STATIC')
  })

  it('falls back to static when Firecrawl key is missing', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html' },
      data: '<html><body><img src="https://example.com/logo.png" /></body></html>',
    } as any)

    const result = await orchestrateDiscovery({
      websiteUrl: 'https://example.com',
      maxPages: 5,
      maxImages: 20,
      firecrawlApiKey: undefined,
    })

    expect(result.providerAttempted).toBe('SMARTVIDEO_STATIC')
    expect(result.providerUsed).toBe('SMARTVIDEO_STATIC')
  })

  it('falls back to browser/Firecrawl when static fails and fallbacks enabled', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('Static down'))
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('All providers down'))

    const result = await orchestrateDiscovery({
      websiteUrl: 'https://example.com',
      maxPages: 5,
      maxImages: 20,
      firecrawlApiKey: 'fc-test',
      enableFirecrawlFallback: true,
      enableBrowserFallback: false,
    })

    // Static attempted first, then Firecrawl fallback attempted
    expect(result.providerAttempts).toContain('SMARTVIDEO_STATIC')
    expect(result.providerAttempts).toContain('FIRECRAWL')
    // Firecrawl failed so it was not used as the final provider
    expect(result.firecrawlUsed).toBe(false)
  })

  it('rejects unsafe URLs before provider call', async () => {
    await expect(
      orchestrateDiscovery({
        websiteUrl: 'http://localhost:3000',
        maxPages: 5,
        maxImages: 20,
        firecrawlApiKey: 'fc-test',
      }),
    ).rejects.toThrow('Private network addresses are not allowed')
  })
})
