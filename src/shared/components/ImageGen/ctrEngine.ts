/**
 * CTR Enhancement Engine for YouTube thumbnails
 *
 * Purpose:
 *  Every prompt generated here is optimized for click-through rate by
 *  forcing a set of high-performing visual cues into the prompt.
 *
 * Required elements injected into every prompt:
 *  - strong focal point
 *  - high contrast
 *  - emotional expression
 *  - curiosity gap
 *  - thumbnail composition
 *  - text overlay safe area
 *  - YouTube optimized framing
 *  - professional lighting
 *
 * Presets provide style-specific augmentations that keep the thumbnail
 * coherent with the channel's visual language.
 */

type CtrStyle =
  | 'gaming'
  | 'business'
  | 'finance'
  | 'tutorial'
  | 'reaction'
  | 'ai'
  | 'marketing'
  | 'agency'
  | 'news'
  | 'crypto'

interface CtrPreset {
  label: string
  prompt: string
  modifiers: string[]
}

export const CTR_PRESETS: Record<CtrStyle, CtrPreset> = {
  gaming: {
    label: 'Gaming',
    prompt: 'epic gaming YouTube thumbnail, exaggerated shocked reaction face, bold headline-safe title area, neon accent glow, controller or headset prop, motion blur, vibrant high-contrast color palette, arena-style lighting, shocked emotion, curiosity gap',
    modifiers: ['game genre', 'character expression', 'headline-safe negative space'],
  },
  business: {
    label: 'Business',
    prompt: 'professional business YouTube thumbnail, confident executive expression, luxury office or city skyline backdrop, clean corporate aesthetic, strong side lighting, high-contrast suit or outfit, trustworthy mood, curiosity gap, text overlay safe area',
    modifiers: ['confidence cues', 'luxury environment', 'trustworthy framing'],
  },
  finance: {
    label: 'Finance',
    prompt: 'high-end finance YouTube thumbnail, charismatic expert expression, upward chart or gold accent lighting, dark luxury backdrop, powerful body language, high contrast, text overlay safe area, professional studio lighting, curiosity gap',
    modifiers: ['upward trend cue', 'expert authority', 'clean money-focused composition'],
  },
  tutorial: {
    label: 'Tutorial',
    prompt: 'clean tutorial YouTube thumbnail, approachable instructor expression, workspace or screen preview, step-by-step arrow or number hint, bright even lighting, high contrast, text overlay safe area, clear focal point, curiosity gap',
    modifiers: ['step indicator', 'clear preview', 'approachable expression'],
  },
  reaction: {
    label: 'Reaction',
    prompt: 'viral reaction YouTube thumbnail, extreme exaggerated emotion, split-screen or pop-culture reference hint, bright energetic background, high contrast, text overlay safe area, direct eye contact, curiosity gap',
    modifiers: ['extreme expression', 'reference hint', 'viral framing'],
  },
  ai: {
    label: 'AI',
    prompt: 'futuristic AI YouTube thumbnail, glowing neural network or hologram overlay, sleek tech aesthetic, mysterious advanced-tech lighting, high contrast, text overlay safe area, curious expression or robot motif, curiosity gap',
    modifiers: ['hologram element', 'advanced-tech lighting', 'sleek futuristic composition'],
  },
  marketing: {
    label: 'Marketing',
    prompt: 'bold marketing YouTube thumbnail, charismatic presenter expression, growth chart or product showcase, vibrant brand-safe palette, high contrast, studio lighting, text overlay safe area, curiosity gap, CTR-focused framing',
    modifiers: ['growth cue', 'brand-safe palette', 'presenter confidence'],
  },
  agency: {
    label: 'Agency',
    prompt: 'premium agency YouTube thumbnail, polished professional expression, modern studio or city backdrop, luxury minimalist aesthetic, high contrast, clean text overlay safe area, studio lighting, curiosity gap',
    modifiers: ['minimalist luxury', 'modern backdrop', 'premium feel'],
  },
  news: {
    label: 'News',
    prompt: 'authoritative news YouTube thumbnail, serious professional expression, breaking-news red accent or lower-third hint, high contrast, studio key lighting, text overlay safe area, direct gaze, curiosity gap',
    modifiers: ['breaking cue', 'authoritative expression', 'urgent framing'],
  },
  crypto: {
    label: 'Crypto',
    prompt: 'dynamic crypto YouTube thumbnail, intense determined expression, Bitcoin or Ethereum glow accent, dark futuristic city or blockchain motif, high contrast, neon rim light, text overlay safe area, curiosity gap',
    modifiers: ['blockchain motif', 'neon glow', 'intense emotion'],
  },
}

const UNIVERSAL_TAIL = [
  'High CTR YouTube thumbnail.',
  'Strong focal point with a single dominant subject.',
  'High contrast for instant visibility in feeds.',
  'Emotional expression to drive clicks.',
  'Curiosity gap that makes viewers want to know more.',
  'Thumbnail composition designed for small preview sizes.',
  'Text overlay safe area reserved for headline copy.',
  'YouTube optimized framing with clear subject placement.',
  'Professional lighting that pops on mobile screens.',
].join(' ')

export function generateCTRPrompt(userPrompt: string, style: string): string {
  const preset = CTR_PRESETS[style as CtrStyle]
  const stylePhrase = preset?.prompt ?? 'high quality YouTube thumbnail, bold design, high contrast, professional lighting, eye-catching composition, text overlay safe area, curiosity gap'

  const parts = [
    userPrompt.trim(),
    stylePhrase,
    UNIVERSAL_TAIL,
  ]

  return parts.filter(Boolean).join('. ')

}
