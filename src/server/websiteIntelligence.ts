/**
 * Website intelligence extraction from rendered pages.
 *
 * Extracts business information, services, products, offers, CTAs,
 * brand colors, fonts, and screenshots from Playwright-rendered pages.
 */

export interface WebsiteIntelligence {
  businessName?: string
  industry?: string
  location?: string
  phones?: string[]
  emails?: string[]
  services?: Array<{ name: string; description?: string; sourcePage?: string }>
  products?: Array<{ name: string; description?: string; sourcePage?: string }>
  offers?: Array<{ text: string; sourcePage?: string }>
  callsToAction?: Array<{ text: string; sourcePage?: string }>
  keyMessages?: string[]
  brand?: {
    colors?: string[]
    fonts?: string[]
    tone?: string[]
    imageryStyle?: string
  }
  socialProfiles?: Array<{ platform: string; url: string }>
  screenshot?: string
  completenessScore?: number
}

const PHONE_REGEX = /(?:(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const SERVICE_KEYWORDS = [
  'service', 'services', 'solution', 'solutions', 'treatment', 'treatments',
  'repair', 'installation', 'maintenance', 'consultation', 'estimate', 'inspection',
]
const PRODUCT_KEYWORDS = [
  'product', 'products', 'item', 'items', 'shop', 'store', 'menu', 'inventory',
]
const OFFER_KEYWORDS = [
  'free', 'discount', 'offer', 'special', 'deal', 'promotion', 'coupon', 'save',
  '% off', 'limited time', 'sale',
]
const CTA_KEYWORDS = [
  'call now', 'contact us', 'get a quote', 'book now', 'schedule', 'request',
  'learn more', 'sign up', 'subscribe', 'get started', 'free estimate',
]
const COLOR_REGEX = /#(?:[0-9a-fA-F]{3}){1,2}/g
const FONT_REGEX = /font-family:\s*([^;]+)/gi

export function extractWebsiteIntelligence(page: any, pageUrl: string): WebsiteIntelligence {
  const intelligence: WebsiteIntelligence = {
    phones: [],
    emails: [],
    services: [],
    products: [],
    offers: [],
    callsToAction: [],
    keyMessages: [],
    brand: {
      colors: [],
      fonts: [],
      tone: [],
      imageryStyle: undefined,
    },
    socialProfiles: [],
  }

  try {
    const pageInfo = page.evaluate(() => {
      const info: any = {
        title: document.title,
        metaDescription: '',
        businessName: '',
        location: '',
        headings: [],
        bodyText: '',
        links: [],
        images: [],
        styles: [],
      }

      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) info.metaDescription = (metaDesc as HTMLMetaElement).content || ''

      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle && !info.businessName) {
        info.businessName = (ogTitle as HTMLMetaElement).content || ''
      }

      const h1 = document.querySelector('h1')
      if (h1 && !info.businessName) {
        info.businessName = h1.textContent?.trim() || ''
      }

      document.querySelectorAll('h1, h2, h3').forEach((heading) => {
        info.headings.push(heading.textContent?.trim() || '')
      })

      info.bodyText = document.body?.textContent?.trim().slice(0, 5000) || ''

      document.querySelectorAll('a[href]').forEach((link) => {
        const href = (link as HTMLAnchorElement).href || ''
        const text = link.textContent?.trim() || ''
        if (href && text) {
          info.links.push({ href, text })
        }
      })

      document.querySelectorAll('img').forEach((img) => {
        info.images.push({
          src: (img as HTMLImageElement).src || '',
          alt: (img as HTMLImageElement).alt || '',
        })
      })

      const styles = Array.from(document.styleSheets)
        .slice(0, 5)
        .map((sheet) => {
          try {
            const rules = Array.from(sheet.cssRules || [])
            return rules
              .slice(0, 20)
              .map((rule: any) => rule.cssText || '')
              .join('\n')
          } catch {
            return ''
          }
        })
        .filter(Boolean)
        .join('\n')
      info.styles = styles

      return info
    })

    if (pageInfo.title) {
      intelligence.businessName = intelligence.businessName || pageInfo.title.split(/[-|]/)[0].trim()
    }

    const bodyText = pageInfo.bodyText || ''
    const phones = (bodyText.match(PHONE_REGEX) || []) as string[]
    const emails = (bodyText.match(EMAIL_REGEX) || []) as string[]

    intelligence.phones = [...new Set(phones)].slice(0, 5)
    intelligence.emails = [...new Set(emails)].slice(0, 5)

    const lowerBody = bodyText.toLowerCase()
    const lowerHeadings = pageInfo.headings.join(' ').toLowerCase()

    for (const keyword of SERVICE_KEYWORDS) {
      if (lowerBody.includes(keyword) || lowerHeadings.includes(keyword)) {
        const match = bodyText.match(new RegExp(`[^.]*${keyword}[^.]*\\.`, 'gi'))
        if (match) {
          intelligence.services!.push({
            name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            description: (match[0] as string).slice(0, 100),
            sourcePage: pageUrl,
          })
        }
      }
    }

    for (const keyword of PRODUCT_KEYWORDS) {
      if (lowerBody.includes(keyword) || lowerHeadings.includes(keyword)) {
        const match = bodyText.match(new RegExp(`[^.]*${keyword}[^.]*\\.`, 'gi'))
        if (match) {
          intelligence.products!.push({
            name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            description: (match[0] as string).slice(0, 100),
            sourcePage: pageUrl,
          })
        }
      }
    }

    for (const keyword of OFFER_KEYWORDS) {
      if (lowerBody.includes(keyword)) {
        const match = bodyText.match(new RegExp(`[^.]*${keyword}[^.]*\\.`, 'gi'))
        if (match) {
          intelligence.offers!.push({
            text: (match[0] as string).slice(0, 150),
            sourcePage: pageUrl,
          })
        }
      }
    }

    for (const keyword of CTA_KEYWORDS) {
      if (lowerBody.includes(keyword)) {
        const match = bodyText.match(new RegExp(`[^.]*${keyword}[^.]*\\.?`, 'gi'))
        if (match) {
          intelligence.callsToAction!.push({
            text: (match[0] as string).slice(0, 100),
            sourcePage: pageUrl,
          })
        }
      }
    }

    const styleText = pageInfo.styles || ''
    const colors = (styleText.match(COLOR_REGEX) || []) as string[]
    intelligence.brand!.colors = [...new Set(colors)].slice(0, 10)

    const fonts = (styleText.match(FONT_REGEX) || []) as string[]
    intelligence.brand!.fonts = [...new Set(fonts.map((f) => f.replace('font-family:', '').trim()))].slice(0, 5)

    for (const link of pageInfo.links) {
      const href = link.href.toLowerCase()
      if (href.includes('facebook.com')) intelligence.socialProfiles!.push({ platform: 'facebook', url: link.href })
      else if (href.includes('twitter.com') || href.includes('x.com')) intelligence.socialProfiles!.push({ platform: 'x', url: link.href })
      else if (href.includes('instagram.com')) intelligence.socialProfiles!.push({ platform: 'instagram', url: link.href })
      else if (href.includes('linkedin.com')) intelligence.socialProfiles!.push({ platform: 'linkedin', url: link.href })
      else if (href.includes('youtube.com')) intelligence.socialProfiles!.push({ platform: 'youtube', url: link.href })
    }

    intelligence.completenessScore = calculateCompletenessScore(intelligence)
  } catch {
    // If extraction fails, return partial intelligence
    intelligence.completenessScore = 0
  }

  return intelligence
}

function calculateCompletenessScore(intelligence: WebsiteIntelligence): number {
  let score = 0

  if (intelligence.businessName) score += 10
  if (intelligence.industry) score += 8
  if (intelligence.location) score += 8
  if (intelligence.phones && intelligence.phones.length > 0) score += 5

  if (intelligence.services && intelligence.services.length > 0) score += 10
  if (intelligence.offers && intelligence.offers.length > 0) score += 8
  if (intelligence.callsToAction && intelligence.callsToAction.length > 0) score += 8

  return Math.min(score, 100)
}
