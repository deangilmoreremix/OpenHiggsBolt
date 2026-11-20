import { describe, expect, it } from 'vitest'
import { isAdOrTrackerHost, isAdOrTrackerUrl, isThirdPartyAdUrl } from '../src/server/adDomains'
import { extractImagesFromHtml } from '../src/server/crawleeProvider'
import {
  canonicalizePageUrl,
  extractBrandColors,
  extractEmbeddedImageUrls,
  htmlToMarkdown,
  isCrawlablePageUrl,
  looksJsRendered,
} from '../src/server/pageSignals'

const SITE = 'https://acme-plumbing.example/'

describe('ad / tracker blocklist (Scrapling v0.5.1 ad_domains)', () => {
  it('matches a listed domain and its subdomains, not lookalikes', () => {
    expect(isAdOrTrackerHost('doubleclick.net')).toBe(true)
    expect(isAdOrTrackerHost('ad.doubleclick.net')).toBe(true)
    expect(isAdOrTrackerHost('AD.DoubleClick.NET.')).toBe(true)
    expect(isAdOrTrackerHost('notdoubleclick.net')).toBe(false)
    expect(isAdOrTrackerHost('doubleclick.net.acme-plumbing.example')).toBe(false)
    expect(isAdOrTrackerHost('')).toBe(false)
    expect(isAdOrTrackerUrl('not a url')).toBe(false)
  })

  it('never blocks the site that is being discovered', () => {
    expect(isThirdPartyAdUrl('https://ad.doubleclick.net/x.jpg', SITE)).toBe(true)
    expect(isThirdPartyAdUrl('https://www.doubleclick.net/team.jpg', 'https://doubleclick.net/')).toBe(false)
    expect(isThirdPartyAdUrl('https://cdn.acme-plumbing.example/team.jpg', SITE)).toBe(false)
  })

  it('drops ad banners from discovered images and keeps real ones', () => {
    const html = `<html><body>
      <img src="https://ad.doubleclick.net/banner-300x250.jpg" alt="Sale">
      <img src="https://cdn.segment.com/pixel.png">
      <img src="https://images.squarespace-cdn.com/team/crew-photo.jpg" alt="Our crew">
      <img src="/images/van.jpg" alt="Our van">
    </body></html>`
    const urls = extractImagesFromHtml(SITE, html, SITE).map((candidate) => candidate.url)
    expect(urls.some((url) => url.includes('doubleclick'))).toBe(false)
    expect(urls.some((url) => url.includes('segment.com'))).toBe(false)
    expect(urls).toContain('https://images.squarespace-cdn.com/team/crew-photo.jpg')
    expect(urls).toContain('https://acme-plumbing.example/images/van.jpg')
  })
})

describe('link rules (Scrapling v0.5.1 LinkExtractor)', () => {
  it('skips files that are not pages', () => {
    expect(isCrawlablePageUrl('https://a.example/menu.pdf')).toBe(false)
    expect(isCrawlablePageUrl('https://a.example/files/brochure.ZIP')).toBe(false)
    expect(isCrawlablePageUrl('https://a.example/video/tour.mp4?x=1')).toBe(false)
    expect(isCrawlablePageUrl('https://a.example/about')).toBe(true)
    expect(isCrawlablePageUrl('https://a.example/about.html')).toBe(true)
    expect(isCrawlablePageUrl('https://a.example/v1.2/services')).toBe(true)
    expect(isCrawlablePageUrl('https://a.example/')).toBe(true)
    expect(isCrawlablePageUrl('http://[bad')).toBe(false)
  })

  it('gives one spelling per page', () => {
    expect(canonicalizePageUrl('https://a.example/about/#team')).toBe('https://a.example/about')
    expect(canonicalizePageUrl('https://a.example/about')).toBe('https://a.example/about')
    expect(canonicalizePageUrl('https://a.example/shop?b=2&a=1')).toBe('https://a.example/shop?a=1&b=2')
    expect(canonicalizePageUrl('https://A.example/')).toBe('https://a.example/')
    expect(canonicalizePageUrl('https://a.example/Team')).toBe('https://a.example/Team')
    expect(canonicalizePageUrl('not a url')).toBe('not a url')
  })
})

describe('empty HTML roots (Scrapling v0.5.1 #536)', () => {
  it.each(['   ', '<!-- only a comment -->', '<!doctype html>', '\n\t'])('handles %j', (html) => {
    expect(() => looksJsRendered(html)).not.toThrow()
    expect(htmlToMarkdown(html).trim()).toBe('')
    expect(extractEmbeddedImageUrls(html, SITE)).toEqual([])
    expect(() => extractBrandColors(html)).not.toThrow()
  })
})
