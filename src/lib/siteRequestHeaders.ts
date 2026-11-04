/**
 * Browser-like request headers for fetching business WEBSITES.
 *
 * Many small-business sites sit behind a CDN or host (Cloudflare, Wix,
 * Squarespace, Shopify) that answers an unusual bot User-Agent such as
 * `SmartVideoGO-AI/1.0` with a 403 or an empty shell. A request that carries
 * the same headers a current desktop Chrome sends gets the normal public page.
 *
 * This only changes how the request LOOKS; it does not solve challenges,
 * rotate identities or bypass any access control. A site that actively
 * challenges the request still fails, and the caller degrades as before.
 *
 * Do NOT use these for OpenStreetMap services (Nominatim / Overpass): their
 * usage policies require an identifying User-Agent, so those providers keep
 * their own `SmartVideoGO-AI/1.0` agent.
 */

/** A current, common desktop Chrome on Windows. */
export const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const CLIENT_HINTS = {
  'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
} as const

/** Headers for a top-level HTML page navigation. */
export const SITE_PAGE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent': DESKTOP_USER_AGENT,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  ...CLIENT_HINTS,
})

/** Headers for an image sub-resource request. */
export const SITE_IMAGE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent': DESKTOP_USER_AGENT,
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'same-site',
  ...CLIENT_HINTS,
})

/** Headers for a stylesheet sub-resource request. */
export const SITE_STYLESHEET_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent': DESKTOP_USER_AGENT,
  Accept: 'text/css,*/*;q=0.1',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'style',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'same-origin',
  ...CLIENT_HINTS,
})

/** Headers for an XML document (sitemap) request. */
export const SITE_XML_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent': DESKTOP_USER_AGENT,
  Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  ...CLIENT_HINTS,
})
