import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  SITE_USER_AGENT,
  SITE_IMAGE_HEADERS,
  SITE_PAGE_HEADERS,
  SITE_XML_HEADERS,
} from '../src/lib/siteRequestHeaders'

describe('site request headers', () => {
  it('identify the crawler honestly and never impersonate a browser', () => {
    for (const headers of [SITE_PAGE_HEADERS, SITE_IMAGE_HEADERS, SITE_XML_HEADERS]) {
      expect(headers['User-Agent']).toBe(SITE_USER_AGENT)
      expect(headers['User-Agent']).toMatch(/^Mozilla\/5\.0 \(compatible; SmartVideoGO\/[\d.]+; \+https:\/\//)
      expect(headers['User-Agent']).not.toMatch(/Chrome|Safari|AppleWebKit/)
      expect(Object.keys(headers).some((h) => /^sec-/i.test(h))).toBe(false)
      expect(headers['Accept-Language']).toBeTruthy()
    }
    expect(SITE_PAGE_HEADERS.Accept).toContain('text/html')
    expect(SITE_IMAGE_HEADERS.Accept).toContain('image/')
  })

  it('are used by every website fetcher', () => {
    const fetchers = [
      'src/server/discoverAssets.ts',
      'src/server/crawleeProvider.ts',
      'src/server/sitemapDiscovery.ts',
      'src/server/demoDiscovery.ts',
      'src/server/downloadImage.ts',
      'src/server/businessDiscovery/researchProvider.ts',
    ]
    for (const file of fetchers) {
      const code = readFileSync(file, 'utf8')
      expect(code, file).toContain('siteRequestHeaders')
      expect(code, file).not.toMatch(/'User-Agent':\s*'(SmartVideoGO|Mozilla\/5\.0 \(compatible; AssetDiscovery)/)
    }
  })

  it('keeps the identifying agent OpenStreetMap usage policy requires', () => {
    for (const file of [
      'src/server/businessDiscovery/nominatimProvider.ts',
      'src/server/businessDiscovery/overpassProvider.ts',
    ]) {
      expect(readFileSync(file, 'utf8'), file).toContain('SmartVideoGO-AI/1.0')
    }
  })

  it('the browser worker uses the same crawler agent', () => {
    const worker = readFileSync('netlify/functions/personalization-browser-discovery.js', 'utf8')
    expect(worker).toContain(SITE_USER_AGENT)
    expect(worker).not.toContain('AssetDiscovery/1.0')
  })
})
