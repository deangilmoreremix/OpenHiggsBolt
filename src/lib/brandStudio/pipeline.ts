// Brand Studio pipeline (Open-Pomelli parity): DNA analysis, campaign concepts, asset copy+image, product photos.
import type { Muapi } from './muapiServer'
import { renderCampaignImage } from './muapiServer'
import { buildBrandTextPrompt, BRAND_VISION_PROMPT, buildConceptsPrompt, buildCopyPrompt, buildImagePrompt, buildPhotoshootPrompt, type StudioBrand, type StudioConcept } from './prompts'
import { asString, asStringArray, dedupHex, parseConceptList, parseJSONObject, truncateWords } from './parse'
import { findPlatform } from './platforms'
import { findPhotoStyle, ALL_PHOTO_PRESETS } from './photoPresets'
import type { SiteScrape } from './staticScrape'

/** Picks primary/secondary hex colours out of raw CSS colours: frequency-ordered, near-greys last. */
export function pickPalette(raw: string[]): { primary: string[]; secondary: string[] } {
  const hex = dedupHex((raw || []).filter((c) => /^#[0-9a-f]{6}$/i.test(c)))
  const sat = (c: string) => { const n = parseInt(c.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return Math.max(r, g, b) - Math.min(r, g, b) }
  const colourful = hex.filter((c) => sat(c) > 30)
  const neutral = hex.filter((c) => sat(c) <= 30)
  const ordered = [...colourful, ...neutral]
  return { primary: ordered.slice(0, 3), secondary: ordered.slice(3, 6) }
}

export async function analyzeSite(mu: Muapi, site: SiteScrape, pageUrl: string) {
  const host = new URL(pageUrl).hostname.replace(/^www\./, '')
  const s = { ...site }
  if (!(s.title || s.bodyText)) {
    s.title = host
    s.description = `Website: ${pageUrl}`
    s.bodyText = `The page content could not be fetched. Infer the brand DNA for ${pageUrl} (${host}) from the domain name and anything you know about this company. Keep answers plausible and specific.`
  }

  let screenshotUrl: string | null = null
  if (s.screenshot) {
    try { screenshotUrl = await mu.upload(s.screenshot, `screenshot-${Date.now()}.png`) } catch { /* vision is optional */ }
  }
  const [textRaw, visionRaw] = await Promise.all([
    mu.text(buildBrandTextPrompt(s)),
    screenshotUrl ? mu.vision(BRAND_VISION_PROMPT, screenshotUrl) : Promise.resolve('{}'),
  ])
  const text = parseJSONObject(textRaw)
  const vision = parseJSONObject(visionRaw)
  const palette = pickPalette(s.rawColors)

  return {
    url: pageUrl,
    brandName: asString(text.brand_name) || host,
    industry: asString(text.industry),
    tagline: asString(text.tagline),
    valueProposition: asString(text.value_proposition),
    toneOfVoice: asStringArray(text.tone_of_voice),
    brandPersonality: [...new Set([...asStringArray(text.brand_personality), ...asStringArray(vision.brand_vibe)])],
    targetAudience: asString(text.target_audience),
    keyMessages: asStringArray(text.key_messages),
    // Same order as upstream: the model's reading of the screenshot first, then the page's own CSS colours.
    primaryColors: dedupHex(asStringArray(vision.primary_colors), palette.primary).slice(0, 5),
    secondaryColors: dedupHex(asStringArray(vision.secondary_colors), palette.secondary).slice(0, 5),
    fonts: s.fonts,
    logoUrl: s.logoCandidates[0] || s.ogImage || s.favicon || '',
    screenshotUrl,
    siteImages: s.images,
    siteVideos: s.videos,
    blocked: s.blocked,
    imageryStyle: asString(vision.imagery_style) || asString(text.imagery_style),
    layoutStyle: asString(vision.layout_style) || asString(text.layout_style),
  }
}

export async function generateConcepts(mu: Muapi, brand: StudioBrand, goal: string, direction = ''): Promise<StudioConcept[]> {
  const concepts = parseConceptList(await mu.text(buildConceptsPrompt(brand, goal, direction)))
  if (!concepts.length) throw new Error('Concepts response had no concepts')
  return concepts.slice(0, 4).map((c) => ({
    title: String(c.title ?? c.headline ?? ''),
    theme: String(c.theme ?? ''),
    key_message: String(c.key_message ?? c.body ?? ''),
    hook: String(c.hook ?? ''),
    cta: String(c.cta ?? ''),
    recommended_platforms: asStringArray(c.recommended_platforms),
    tone_notes: String(c.tone_notes ?? ''),
    visual_direction: String(c.visual_direction ?? c.visual_prompt ?? ''),
  }))
}

export async function generateAsset(mu: Muapi, brand: StudioBrand, concept: StudioConcept, platformId: string, opts: { noText?: boolean } = {}) {
  const platform = findPlatform(platformId)
  const copy = parseJSONObject(await mu.text(buildCopyPrompt(brand, concept, platform.id)))
  const headline = truncateWords(String(copy.headline ?? ''), platform.copy.headlineMaxWords)
  const body = truncateWords(String(copy.body ?? ''), platform.copy.bodyMaxWords)
  const cta = truncateWords(String(copy.cta ?? ''), platform.copy.ctaMaxWords)
  // Copy is overlaid by the editor, so the picture itself carries no text by default.
  const imageUrl = await renderCampaignImage(mu, brand.logoUrl, buildImagePrompt(brand, concept, platform.id, headline, { noText: opts.noText ?? true }), platform.aspect)
  return { platform: platform.id, format: platform.label, imageUrl, headline, body, cta }
}

export async function regenerateAssetImage(mu: Muapi, brand: StudioBrand, concept: StudioConcept, platformId: string, headline: string, opts: { noText?: boolean } = {}) {
  const platform = findPlatform(platformId)
  return renderCampaignImage(mu, brand.logoUrl, buildImagePrompt(brand, concept, platform.id, headline, opts), platform.aspect)
}

export async function generateProductPhoto(mu: Muapi, o: { productImageUrl: string; logoUrl?: string; brand?: StudioBrand | null; category: string; style: string; direction?: string; resolution?: string; aspect?: string }) {
  const found = findPhotoStyle(o.category, o.style) || ALL_PHOTO_PRESETS[0]
  const prompt = buildPhotoshootPrompt(found.style, o.brand, o.direction)
  const aspectRatio = o.aspect || found.style.aspect
  const resolution = ['1k', '2k', '4k'].includes(o.resolution || '') ? o.resolution! : '2k'
  const edit = (refs: string[]) => mu.imageEdit2(prompt, refs, { aspectRatio, resolution, outputFormat: 'png' })
  const withLogo = o.logoUrl && /^https?:\/\//i.test(o.logoUrl) ? [o.productImageUrl, o.logoUrl] : [o.productImageUrl]
  let imageUrl: string
  try { imageUrl = await edit(withLogo) } catch (e) {
    if (withLogo.length === 1) throw e
    imageUrl = await edit([o.productImageUrl]) // a logo the model cannot read must not cost the shot
  }
  if (!imageUrl) throw new Error('Photo studio returned no image')
  return { productImageUrl: o.productImageUrl, category: found.category.label, categoryId: found.category.id, styleId: found.style.id, styleLabel: found.style.label, prompt, imageUrl, aspect: aspectRatio, resolution }
}
