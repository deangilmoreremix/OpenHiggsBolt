import { STUDIO_GOALS, goalLabel } from './goals'
import { findPlatform } from './platforms'
import { asStringArray } from './parse'

export type StudioBrand = {
  brandName?: string; industry?: string; tagline?: string; valueProposition?: string; targetAudience?: string
  toneOfVoice?: string[]; brandPersonality?: string[]; keyMessages?: string[]
  primaryColors?: string[]; secondaryColors?: string[]; imageryStyle?: string; layoutStyle?: string; logoUrl?: string
}
export type StudioConcept = {
  title?: string; theme?: string; key_message?: string; hook?: string; cta?: string
  recommended_platforms?: string[]; tone_notes?: string; visual_direction?: string; body?: string; visual_prompt?: string
}

const dash = (s?: string) => s || '—'
const j = (v: unknown, sep = ', ') => asStringArray(v).join(sep) || '—'

export const BRAND_TEXT_PROMPT = `You are a brand analyst. Given the website content below, extract the brand DNA as STRICT JSON only (no commentary, no markdown). Use this exact shape:
{
  "brand_name": "string",
  "industry": "string",
  "tagline": "string",
  "value_proposition": "string",
  "tone_of_voice": ["3-5 trait words"],
  "brand_personality": ["3-5 trait words"],
  "target_audience": "one sentence",
  "key_messages": ["3-5 short messages"],
  "imagery_style": "professional | casual | illustrated | cinematic | minimalist | editorial",
  "layout_style": "modern | classic | minimalist | bold | editorial"
}

WEBSITE TITLE: {{title}}
META DESCRIPTION: {{description}}
BODY TEXT (truncated):
{{body}}`

export const BRAND_VISION_PROMPT = `Analyze this website screenshot and return STRICT JSON only (no markdown, no commentary):
{
  "primary_colors": ["#hex","#hex","#hex"],
  "secondary_colors": ["#hex","#hex"],
  "typography": "serif | sans-serif | modern | classic | display",
  "logo_style": "wordmark | icon | combination",
  "imagery_style": "professional | casual | illustrated | cinematic | minimalist | editorial",
  "layout_style": "modern | classic | minimalist | bold | editorial",
  "brand_vibe": ["3-5 vibe words"]
}`

export function buildBrandTextPrompt(site: { title: string; description: string; bodyText: string }): string {
  // function replacers: scraped text may contain "$&"-style sequences
  return BRAND_TEXT_PROMPT.replace('{{title}}', () => site.title).replace('{{description}}', () => site.description).replace('{{body}}', () => site.bodyText)
}

export function buildConceptsPrompt(brand: StudioBrand, goal: string, direction = ''): string {
  const label = goalLabel(goal)
  return `You are a senior brand strategist. Generate exactly 4 distinct on-brand marketing campaign concepts for the brand below, tailored to the goal: "${label}".

Return STRICT JSON only — an array of 4 objects with this exact shape (no markdown, no commentary):
[
  {
    "title": "short evocative concept name (max 6 words)",
    "theme": "1 sentence — the strategic angle",
    "key_message": "1 sentence — what the audience should remember",
    "hook": "1 short line — the opening line of the lead asset",
    "cta": "2-4 word call to action",
    "recommended_platforms": ["instagram","linkedin","facebook","twitter","email","banner","youtube_thumb","google_ad"],
    "tone_notes": "how to write this concept — match the brand's voice",
    "visual_direction": "1-2 sentences — palette, imagery, layout cues"
  }
]

Keep concepts genuinely distinct in angle. Match the brand voice and palette. Be specific to the brand, not generic marketing fluff.

BRAND
- Name: ${dash(brand.brandName)}
- Industry: ${dash(brand.industry)}
- Tagline: ${dash(brand.tagline)}
- Value proposition: ${dash(brand.valueProposition)}
- Target audience: ${dash(brand.targetAudience)}
- Tone of voice: ${j(brand.toneOfVoice)}
- Personality: ${j(brand.brandPersonality)}
- Key messages: ${j(brand.keyMessages, ' • ')}
- Primary colors: ${j(brand.primaryColors)}
- Imagery style: ${dash(brand.imageryStyle)}
- Layout style: ${dash(brand.layoutStyle)}

GOAL: ${label}
${direction ? `USER DIRECTION: ${direction}` : ''}`
}

export function buildCopyPrompt(brand: StudioBrand, concept: StudioConcept, platformId: string): string {
  const platform = findPlatform(platformId)
  const { headlineMaxWords: hm, bodyMaxWords: bm, ctaMaxWords: cm, tone } = platform.copy
  return `You are writing on-brand marketing copy for a single asset. Return STRICT JSON only:
{
  "headline": "string (max ${hm} words)",
  "body": "string (max ${bm} words${bm === 0 ? ' — return empty string' : ''})",
  "cta": "string (max ${cm} words${cm === 0 ? ' — return empty string' : ''})"
}

PLATFORM: ${platform.label}
COPY TONE: ${tone}

BRAND
- Name: ${dash(brand.brandName)}
- Voice: ${j(brand.toneOfVoice)}
- Personality: ${j(brand.brandPersonality)}

CAMPAIGN CONCEPT
- Title: ${dash(concept.title)}
- Theme: ${dash(concept.theme)}
- Hook: ${dash(concept.hook)}
- Key message: ${dash(concept.key_message || concept.body)}
- Default CTA: ${dash(concept.cta)}
- Tone notes: ${dash(concept.tone_notes)}

Match the brand voice exactly. Stay under the word caps. Do not use hashtags in body. Do not add markdown.`
}

export function buildImagePrompt(brand: StudioBrand, concept: StudioConcept, platformId: string, headline: string, opts: { noText?: boolean } = {}): string {
  const platform = findPlatform(platformId)
  const primary = asStringArray(brand.primaryColors).join(', ') || 'brand colors'
  const secondary = asStringArray(brand.secondaryColors)
  const palette = secondary.length ? `Primary palette: ${primary}. Accent palette: ${secondary.join(', ')}.` : `Palette: ${primary}.`
  const textRule = opts.noText
    ? 'IMPORTANT: render NO text, NO words, NO letters, NO typography on this image. Pure visual background only — text will be overlaid afterward. Leave generous negative space where copy can go.'
    : `Overlay headline (large, on-brand typography): "${headline}"`
  return `Marketing creative for ${platform.label}. ${platform.copy.imageHint}

Concept: ${concept.title || ''} — ${concept.theme || ''}
Visual direction: ${concept.visual_direction || concept.visual_prompt || ''}
Imagery style: ${brand.imageryStyle || 'modern'}. Layout style: ${brand.layoutStyle || 'modern'}.
${palette}

${textRule}

Composition rules: clean focal hierarchy, brand-consistent palette, no extraneous logos, no watermarks, no stock-photo aesthetic, no lorem ipsum. Make it feel native to the brand.`
}

export function buildPhotoshootPrompt(style: { label: string; prompt: string }, brand?: StudioBrand | null, direction?: string): string {
  const lines = [
    'Professional product photography. Use the product from the reference image as the exact focal subject — preserve its geometry, color, materials and proportions perfectly.',
    '', `Style: ${style.label}`, style.prompt,
  ]
  const palette = asStringArray(brand?.primaryColors)
  if (palette.length) lines.push('', `Brand palette to influence backdrop and props (do not paint the product itself): ${palette.join(', ')}.`)
  if (brand?.imageryStyle) lines.push(`Brand imagery style: ${brand.imageryStyle}.`)
  if (direction) lines.push('', `Additional direction: ${direction}`)
  lines.push('', 'Composition rules: realistic lighting and shadows that match the staged scene, sharp focus on the product, no text, no watermarks, no overlaid logos, no warping or distortion of the product, no model faces.')
  return lines.join('\n')
}

export { STUDIO_GOALS }
