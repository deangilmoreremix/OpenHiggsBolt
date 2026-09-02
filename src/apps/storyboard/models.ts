// Storyboard model catalog + provider icon logic.
//
// The PROVIDER_LOGOS / invertLogos / getProviderStyle logic is ported verbatim
// from the upstream Open-Generative-AI repo (packages/studio/src/components/ImageStudio.jsx).
// Each model object carries a `provider` id (e.g. "openai", "kling", "blackforest")
// and `provider_name`. The UI looks that provider id up in PROVIDER_LOGOS to get a
// hosted PNG icon from cdn.muapi.ai; a handful of providers whose logos are dark get
// `invert`-ed via CSS so they show up against the dark UI. If a provider isn't in the
// map, getProviderStyle() falls back to a colored two-letter badge.

export interface StoryboardModel {
  id: string
  name: string
  provider: string
  provider_name: string
}

// ─── Provider → logo image map ──────────────────────────────────────────────
export const PROVIDER_LOGOS: Record<string, string> = {
  openai: 'https://cdn.muapi.ai/models/openai.png',
  google: 'https://cdn.muapi.ai/models/gemini.png',
  kling: 'https://cdn.muapi.ai/models/kling.png',
  alibaba: 'https://cdn.muapi.ai/models/alibaba.png',
  bytedance: 'https://cdn.muapi.ai/models/bytedance.png',
  blackforest: 'https://cdn.muapi.ai/models/bfl.png',
  minimax: 'https://cdn.muapi.ai/models/minimax.png',
  suno: 'https://cdn.muapi.ai/models/suno.png',
  anthropic: 'https://cdn.muapi.ai/models/claude.png',
  meshy: 'https://cdn.muapi.ai/models/meshy-3.png',
  tripo3d: 'https://cdn.muapi.ai/models/tripo3d.png',
  grok: 'https://cdn.muapi.ai/models/xai.png',
  muapi: 'https://cdn.muapi.ai/models/muapi.png',
  midjourney: 'https://cdn.muapi.ai/models/midjourney.png',
  vidu: 'https://cdn.muapi.ai/models/vidu.png',
  runway: 'https://cdn.muapi.ai/models/runway.png',
  luma: 'https://cdn.muapi.ai/models/luma.png',
  ideogram: 'https://cdn.muapi.ai/models/ideogram.png',
  leonardoai: 'https://cdn.muapi.ai/models/leonardoai.png',
  hunyuan: 'https://cdn.muapi.ai/models/hunyuan.png',
  hidream: 'https://cdn.muapi.ai/models/hidream.png',
  lightricks: 'https://cdn.muapi.ai/models/lightricks.png',
  pixverse: 'https://cdn.muapi.ai/models/pixverse.png',
  reve: 'https://cdn.muapi.ai/models/reve.png',
  stability: 'https://cdn.muapi.ai/models/stability.png',
}

// Logos that need to be inverted (dark logos on dark UI)
export const invertLogos: string[] = [
  'openai',
  'blackforest',
  'runway',
  'ideogram',
  'lightricks',
  'grok',
]

// ─── Fallback: letter-badge style if a provider has no logo entry ─────────────
export interface ProviderBadgeStyle {
  text: string
  bg: string
}

export function getProviderStyle(provider?: string): ProviderBadgeStyle {
  switch (provider) {
    case 'grok':
      return { text: 'xI', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/25' }
    case 'openai':
      return { text: 'O', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' }
    case 'google':
      return { text: 'G', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/25' }
    case 'blackforest':
      return { text: 'BF', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25' }
    case 'bytedance':
      return { text: 'BD', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/25' }
    case 'midjourney':
      return { text: 'MJ', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' }
    case 'kling':
      return { text: 'KL', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25' }
    case 'vidu':
      return { text: 'VD', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' }
    case 'minimax':
      return { text: 'MX', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/25' }
    case 'ideogram':
      return { text: 'ID', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' }
    case 'luma':
      return { text: 'LM', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/25' }
    case 'alibaba':
      return { text: 'AL', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/25' }
    case 'leonardoai':
      return { text: 'LE', bg: 'bg-violet-500/10 text-violet-400 border-violet-500/25' }
    case 'stability':
      return { text: 'SD', bg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25' }
    default:
      const name = provider ? provider.toUpperCase() : 'AI'
      return { text: name.substring(0, 2), bg: 'bg-primary/10 text-primary border-primary/25' }
  }
}

// ─── Curated storyboard frame (image) model catalog ──────────────────────────
// These are the image-generation models used to render each storyboard shot's
// still frame (the per-shot "Frame" button in the Shot Editor). Each entry carries
// a `provider` id (used for the icon) and `provider_name`. The default matches the
// backend FRAME_MODEL ('flux-dev').
export const STORYBOARD_MODELS: StoryboardModel[] = [
  {
    id: 'flux-2-dev',
    name: 'Flux 2 Dev',
    provider: 'blackforest',
    provider_name: 'Black Forest',
  },
  {
    id: 'flux-2-pro',
    name: 'Flux 2 Pro',
    provider: 'blackforest',
    provider_name: 'Black Forest',
  },
  {
    id: 'flux-kontext-dev-t2i',
    name: 'Flux Kontext Dev',
    provider: 'blackforest',
    provider_name: 'Black Forest',
  },
  {
    id: 'flux-kontext-pro-t2i',
    name: 'Flux Kontext Pro',
    provider: 'blackforest',
    provider_name: 'Black Forest',
  },
  {
    id: 'flux-kontext-max-t2i',
    name: 'Flux Kontext Max',
    provider: 'blackforest',
    provider_name: 'Black Forest',
  },
  {
    id: 'flux-krea-dev',
    name: 'Flux Krea Dev',
    provider: 'blackforest',
    provider_name: 'Black Forest',
  },
  {
    id: 'midjourney-v7',
    name: 'Midjourney V7',
    provider: 'midjourney',
    provider_name: 'Midjourney',
  },
  {
    id: 'midjourney-v7-text-to-image',
    name: 'Midjourney V7 T2I',
    provider: 'midjourney',
    provider_name: 'Midjourney',
  },
  {
    id: 'ideogram-v3-t2i',
    name: 'Ideogram v3',
    provider: 'ideogram',
    provider_name: 'Ideogram',
  },
  {
    id: 'gpt-image-2-text-to-image',
    name: 'GPT Image 2 (OpenAI)',
    provider: 'openai',
    provider_name: 'OpenAI',
  },
  {
    id: 'wan2.6-text-to-image',
    name: 'Wan 2.6 T2I',
    provider: 'alibaba',
    provider_name: 'Alibaba',
  },
]

export const DEFAULT_STORYBOARD_MODEL_ID = 'flux-2-dev'

// Flat set of valid model ids — single source of truth for backend validation.
export const STORYBOARD_MODEL_IDS: ReadonlySet<string> = new Set(
  STORYBOARD_MODELS.map((m) => m.id)
)

// Resolve the provider id for a given model id (or null if unknown).
export function getProviderForModel(id: string): string | null {
  return STORYBOARD_MODELS.find((m) => m.id === id)?.provider ?? null
}

// True when the id is a known, selectable storyboard image model.
export function isValidStoryboardModel(id: unknown): id is string {
  return typeof id === 'string' && STORYBOARD_MODEL_IDS.has(id)
}

export function getStoryboardModel(id: string): StoryboardModel {
  return STORYBOARD_MODELS.find((m) => m.id === id) || STORYBOARD_MODELS[0]
}

// Dynamically compute the list of providers present in the catalog.
export function getStoryboardProviders(): { id: string; name: string }[] {
  const seen = new Set<string>()
  const out: { id: string; name: string }[] = []
  for (const m of STORYBOARD_MODELS) {
    if (!seen.has(m.provider)) {
      seen.add(m.provider)
      out.push({ id: m.provider, name: m.provider_name })
    }
  }
  return out
}
