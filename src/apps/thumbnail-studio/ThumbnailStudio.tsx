'use client'
/**
 * Thumbnail Studio — full thumbnaily-ai feature set
 * Uses shared ImageGen components + the user's MuAPI key (flux-dev image models)
 * The route is Clerk-gated (see middleware.js); once signed in, generation uses the
 * user's own MuAPI key. Gallery is session-based + public community feed.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { Image, Wand2, Loader2, Globe, User, ChevronDown, ChevronUp, RefreshCw, Search } from 'lucide-react'
import { ImageGallery, MuapiImageStream, ImageEditor } from '@/shared/components/ImageGen'
import type { GeneratedImage, GenerationRequest, SizePreset } from '@/shared/components/ImageGen'
import { SIZE_PRESETS, QUALITY_PRESETS } from '@/shared/components/ImageGen'
import type { ImageModel } from '@/shared/components/ImageGen'
import { generateCTRPrompt } from '@/shared/components/ImageGen/ctrEngine'
import { SEED_THUMBNAILS } from '@/shared/components/ImageGen/seedThumbnails'
import { DEFAULT_IMAGE_MODEL, getImageClient } from '@/shared/api/muapiImage'
import { panels, buttons, semantic, tabStyle, optionStyle, appWrapper } from '@/shared/styles/designTokens'
import { supabase } from '@/shared/api/supabase'
import { enhancePrompt } from '@/shared/api/openai'

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_ID_KEY = 'thumbnail_studio_session_id'
const LOCAL_KEY = 'thumbnail_studio_local'

// ── Provider logo map (mirrors Image Studio's PROVIDER_LOGOS) ─────────────────
// Hosted PNG icons from the MuAPI CDN, keyed by provider id.
const PROVIDER_LOGOS: Record<string, string> = {
  openai: "https://cdn.muapi.ai/models/openai.png",
  google: "https://cdn.muapi.ai/models/gemini.png",
  kling: "https://cdn.muapi.ai/models/kling.png",
  alibaba: "https://cdn.muapi.ai/models/alibaba.png",
  bytedance: "https://cdn.muapi.ai/models/bytedance.png",
  blackforest: "https://cdn.muapi.ai/models/bfl.png",
  minimax: "https://cdn.muapi.ai/models/minimax.png",
  suno: "https://cdn.muapi.ai/models/suno.png",
  anthropic: "https://cdn.muapi.ai/models/claude.png",
  meshy: "https://cdn.muapi.ai/models/meshy-3.png",
  tripo3d: "https://cdn.muapi.ai/models/tripo3d.png",
  grok: "https://cdn.muapi.ai/models/xai.png",
  muapi: "https://cdn.muapi.ai/models/muapi.png",
  midjourney: "https://cdn.muapi.ai/models/midjourney.png",
  vidu: "https://cdn.muapi.ai/models/vidu.png",
  runway: "https://cdn.muapi.ai/models/runway.png",
  luma: "https://cdn.muapi.ai/models/luma.png",
  ideogram: "https://cdn.muapi.ai/models/ideogram.png",
  leonardoai: "https://cdn.muapi.ai/models/leonardoai.png",
  hunyuan: "https://cdn.muapi.ai/models/hunyuan.png",
  hidream: "https://cdn.muapi.ai/models/hidream.png",
  lightricks: "https://cdn.muapi.ai/models/lightricks.png",
  pixverse: "https://cdn.muapi.ai/models/pixverse.png",
  reve: "https://cdn.muapi.ai/models/reve.png",
  stability: "https://cdn.muapi.ai/models/stability.png",
}

// Logos that are dark/black on a dark UI → invert via CSS
const INVERT_LOGOS = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok']

// Letter-badge fallback for providers without a logo (mirrors Image Studio)
function getProviderStyle(provider?: string) {
  switch (provider) {
    case "grok":        return { text: "xI", bg: "bg-orange-500/10 text-orange-400 border-orange-500/25" }
    case "openai":      return { text: "O",  bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" }
    case "google":      return { text: "G",  bg: "bg-blue-500/10 text-blue-400 border-blue-500/25" }
    case "blackforest": return { text: "BF", bg: "bg-amber-500/10 text-amber-400 border-amber-500/25" }
    case "bytedance":   return { text: "BD", bg: "bg-purple-500/10 text-purple-400 border-purple-500/25" }
    case "midjourney":  return { text: "MJ", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" }
    case "kling":       return { text: "KL", bg: "bg-rose-500/10 text-rose-400 border-rose-500/25" }
    case "vidu":        return { text: "VD", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" }
    case "minimax":     return { text: "MX", bg: "bg-pink-500/10 text-pink-400 border-pink-500/25" }
    case "ideogram":    return { text: "ID", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" }
    case "luma":        return { text: "LM", bg: "bg-teal-500/10 text-teal-400 border-teal-500/25" }
    case "alibaba":     return { text: "AL", bg: "bg-sky-500/10 text-sky-400 border-sky-500/25" }
    case "leonardoai":  return { text: "LE", bg: "bg-violet-500/10 text-violet-400 border-violet-500/25" }
    case "stability":   return { text: "SD", bg: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25" }
    default: {
      const name = provider ? provider.toUpperCase() : "AI"
      return { text: name.substring(0, 2), bg: "bg-primary/10 text-primary border-primary/25" }
    }
  }
}

/** Model icon: provider logo image when available, else colored letter badge. */
function ModelIcon({ provider, label, size = 10 }: { provider: string; label: string; size?: number }) {
  const logo = PROVIDER_LOGOS[provider]
  const dim = `${size * 4}px` // size is in Tailwind spacing units (0.25rem each)
  if (logo) {
    return (
      <img
        src={logo}
        alt={provider}
        className={`block rounded-xl object-contain p-1 border border-white/5 shrink-0 ${INVERT_LOGOS.includes(provider) ? 'invert' : ''}`}
        style={{ width: dim, height: dim }}
      />
    )
  }
  const badge = getProviderStyle(provider)
  return (
    <span className={`block rounded-xl flex items-center justify-center font-black uppercase border shrink-0 ${badge.bg}`}
      style={{ width: dim, height: dim, fontSize: `${size * 1.4}px` }}>
      {badge.text}
    </span>
  )
}

// ── Available image-generation APIs / models ──────────────────────────────────
type ModelOption = {
  value: ImageModel
  label: string
  description: string
  provider: string      // provider id used for the logo map (e.g. 'openai')
  featured?: boolean
}
const MODELS: ModelOption[] = [
  { value: 'gpt-image-2', label: 'GPT Image 2', description: 'Latest, best quality',     provider: 'openai', featured: true },
  { value: 'gpt-image-1', label: 'GPT Image 1', description: 'Balanced quality & speed', provider: 'openai' },
  { value: 'dall-e-3',    label: 'DALL·E 3',    description: 'Classic, prompt-following', provider: 'openai' },
  { value: 'dall-e-2',    label: 'DALL·E 2',    description: 'Fast, lower cost',         provider: 'openai' },
]

const STYLES = [
  { value: 'cinematic',    label: 'Cinematic',    prompt: 'dramatic cinematic lighting, movie poster style, ultra detailed' },
  { value: 'vibrant',      label: 'Vibrant',      prompt: 'vibrant saturated colors, eye-catching, bold composition, high contrast' },
  { value: 'bold-text',    label: 'Bold Text',    prompt: 'designed for text overlay, clear focal point, bold graphic design' },
  { value: 'face-focus',   label: 'Face Focus',   prompt: 'close-up portrait, expressive face, shallow depth of field, emotional' },
  { value: 'minimal',      label: 'Minimal',      prompt: 'minimalist design, clean background, elegant, lots of negative space' },
  { value: 'neon',         label: 'Neon Glow',    prompt: 'neon glow effects, cyberpunk aesthetic, dark background, futuristic' },
  { value: 'retro',        label: 'Retro',        prompt: 'retro vintage style, film grain, muted tones, classic design' },
  { value: 'photorealism', label: 'Photorealistic', prompt: 'photorealistic, ultra high resolution, professional photography, 8K' },
]

const TEMPLATES = [
  { label: 'Gaming',    prompt: 'Epic gaming thumbnail, shocked face reaction, bold title text, dramatic lighting, vibrant colors, high energy' },
  { label: 'Tutorial',  prompt: 'Clean tutorial thumbnail, step-by-step arrows, professional look, clear text overlay, modern design' },
  { label: 'Finance',   prompt: 'Finance YouTube thumbnail, money symbols, professional suit, clean background, trust-inspiring design' },
  { label: 'Fitness',   prompt: 'Fitness thumbnail, energetic athlete, motivational, bold typography, dynamic pose, gym background' },
  { label: 'Food',      prompt: 'Food thumbnail, mouth-watering close-up, vibrant colors, steam effect, appetizing presentation' },
  { label: 'Tech',      prompt: 'Tech review thumbnail, product showcase, clean white background, modern typography, comparison layout' },
  { label: 'Reaction',  prompt: 'Reaction video thumbnail, exaggerated facial expression, bright background, emotion-focused' },
  { label: 'Vlog',      prompt: 'Personal vlog thumbnail, lifestyle photography, warm tones, candid expression, adventure feel' },
  { label: 'Music',     prompt: 'Music video thumbnail, album art style, atmospheric lighting, artistic composition' },
  { label: 'Education', prompt: 'Educational thumbnail, clear visual metaphor, bright colors, friendly and approachable style' },
]

const FORMATS = [
  { value: 'png',  label: 'PNG',  description: 'Lossless, best quality' },
  { value: 'jpeg', label: 'JPEG', description: 'Smaller file, faster' },
  { value: 'webp', label: 'WebP', description: 'Best compression' },
] as const

function getSessionId(): string {
  if (typeof window === 'undefined') return `thumb_session_${Date.now()}`
  let id = localStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = `thumb_session_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
    localStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function saveToSupabase(img: GeneratedImage): Promise<void> {
  try {
    await supabase.from('thumbnails').insert({
      prompt: img.prompt,
      enhanced_prompt: img.enhancedPrompt,
      model: img.model,
      style: img.style,
      aspect_ratio: img.aspectRatio,
      url: img.url,
      quality: img.quality,
      format: img.format,
      width: img.width,
      height: img.height,
      is_public: img.isPublic,
      session_id: img.sessionId,
    })
  } catch (e) {
    console.warn('Thumbnail share failed', e)
    throw e
  }
}

async function loadCommunityGallery(): Promise<GeneratedImage[]> {
  try {
    const { data } = await supabase
      .from('thumbnails')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)
    const mapped = (data || []).map((row): GeneratedImage => ({
      id: row.id,
      url: row.url,
      prompt: row.prompt || row.prompt_used || '',
      enhancedPrompt: row.enhanced_prompt,
      model: row.model || DEFAULT_IMAGE_MODEL,
      quality: row.quality || 'medium',
      format: row.format || 'png',
      style: row.style,
      aspectRatio: row.aspect_ratio,
      width: row.width,
      height: row.height,
      isPublic: row.is_public,
      sessionId: row.session_id,
      createdAt: row.created_at,
    }))
    if (mapped.length > 0) return mapped
    return SEED_THUMBNAILS.map(seed => ({
      id: seed.id,
      url: seed.url,
      prompt: seed.prompt,
      enhancedPrompt: seed.enhancedPrompt,
      model: seed.model,
      quality: seed.quality,
      format: seed.format,
      style: seed.style,
      aspectRatio: seed.aspectRatio,
      width: seed.width,
      height: seed.height,
      isPublic: seed.isPublic,
      sessionId: seed.sessionId,
      createdAt: seed.createdAt,
      responseId: seed.responseId,
    }))
  } catch {
    return SEED_THUMBNAILS.map(seed => ({
      id: seed.id,
      url: seed.url,
      prompt: seed.prompt,
      enhancedPrompt: seed.enhancedPrompt,
      model: seed.model,
      quality: seed.quality,
      format: seed.format,
      style: seed.style,
      aspectRatio: seed.aspectRatio,
      width: seed.width,
      height: seed.height,
      isPublic: seed.isPublic,
      sessionId: seed.sessionId,
      createdAt: seed.createdAt,
      responseId: seed.responseId,
    }))
  }
}

function loadLocal(): GeneratedImage[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function saveLocal(images: GeneratedImage[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(images.slice(0, 100)))
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ThumbnailStudio({ apiKey }: { apiKey?: string }) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'generate' | 'mine' | 'community'>('generate')

  // Generate form
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('cinematic')
  const [selectedSize, setSelectedSize] = useState<SizePreset>(SIZE_PRESETS[0])
  const [selectedModel, setSelectedModel] = useState<ImageModel>('gpt-image-2')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('jpeg')
  const [compression, setCompression] = useState(85)
  const [variations, setVariations] = useState(1)
  const [isPublic, setIsPublic] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showRefine, setShowRefine] = useState(false)
  const [refinePrompt, setRefinePrompt] = useState('')

  // Reference image / edit mode
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [mask, setMask] = useState<Blob | null>(null)
  const [mode, setMode] = useState<'generate' | 'edit'>('generate')

  // Enhancement
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')

  // Generation state
  const [activeRequest, setActiveRequest] = useState<GenerationRequest | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  // Gallery
  const [myImages, setMyImages] = useState<GeneratedImage[]>(loadLocal)
  const [communityImages, setCommunityImages] = useState<GeneratedImage[]>([])
  const [communityLoading, setCommunityLoading] = useState(false)

  // Share-to-community notice (surfaces Supabase write failures without losing local images)
  const [shareNotice, setShareNotice] = useState<string | null>(null)

  // Multi-turn refinement (last generated image URL, used for image-to-image)
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null)

  // Model dropdown ref + outside-click close
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  // Track object URLs so we can revoke them on delete
  const objectUrlsRef = useRef<Set<string>>(new Set())
  const trackObjectUrl = (url: string) => {
    if (url.startsWith('blob:')) objectUrlsRef.current.add(url)
  }
  const revokeObjectUrl = (url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
      objectUrlsRef.current.delete(url)
    }
  }

  const sessionId = useRef<string>(getSessionId())

  // Load community gallery when tab opens
  useEffect(() => {
    if (activeTab === 'community' && communityImages.length === 0) {
      setCommunityLoading(true)
      loadCommunityGallery()
        .then(setCommunityImages)
        .finally(() => setCommunityLoading(false))
    }
  }, [activeTab, communityImages.length])

  // Persist local gallery
  useEffect(() => { saveLocal(myImages) }, [myImages])

  // Close model dropdown on outside click / Escape
  useEffect(() => {
    if (!modelDropdownOpen) return
    const onDown = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModelDropdownOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [modelDropdownOpen])

  // Build the full styled prompt
  const buildPrompt = useCallback(() => {
    const base = enhancedPrompt || prompt
    return generateCTRPrompt(base, selectedStyle)
  }, [prompt, enhancedPrompt, selectedStyle])

  const handleEnhance = async () => {
    if (!prompt.trim()) return
    setIsEnhancing(true)
    try {
      const result = await enhancePrompt(prompt)
      if (result) {
        setEnhancedPrompt(result)
      }
    } catch {}
    finally { setIsEnhancing(false) }
  }

  const handleGenerate = () => {
    if (!prompt.trim()) return
    setError('')
    setIsGenerating(true)

    const request: GenerationRequest = {
      prompt: buildPrompt(),
      model: selectedModel,
      quality,
      format,
      compression: format !== 'png' ? compression : undefined,
      size: selectedSize,
      n: variations,
      style: selectedStyle,
      referenceImage: referenceImage || undefined,
      mask: mask || undefined,
      mode,
      isPublic,
      sessionId: sessionId.current,
      apiKey,
    }
    setActiveRequest(request)
  }

  const handleStreamComplete = useCallback(async (images: GeneratedImage[]) => {
    setIsGenerating(false)
    setActiveRequest(null)
    images.forEach(img => trackObjectUrl(img.url))
    const tagged = images.map(img => ({
      ...img,
      prompt,
      enhancedPrompt: enhancedPrompt || undefined,
      style: selectedStyle,
      sessionId: sessionId.current,
      isPublic,
    }))
    setMyImages(prev => [...tagged, ...prev])
    // Save to Supabase, surfacing failures without breaking the local gallery
    const results = await Promise.allSettled(tagged.map(img => saveToSupabase(img)))
    if (results.some(r => r.status === 'rejected')) {
      setShareNotice('Some thumbnails saved locally but could not be shared to the community.')
    }
    if (tagged[0]?.url) setLastImageUrl(tagged[0].url)
    setActiveTab('mine')
  }, [prompt, enhancedPrompt, selectedStyle, isPublic])

  const handleStreamError = useCallback((err: string) => {
    setIsGenerating(false)
    setActiveRequest(null)
    setError(err)
  }, [])

  const handleRefine = async () => {
    if (!refinePrompt.trim() || !lastImageUrl || !apiKey) return
    setError('')
    setIsGenerating(true)
    try {
      const client = getImageClient(apiKey)
      const results = await client.generate({
        prompt: generateCTRPrompt(refinePrompt, selectedStyle),
        model: DEFAULT_IMAGE_MODEL,
        aspectRatio: selectedSize.ratio,
        quality,
        n: 1,
        imageUrl: lastImageUrl,
        strength: 0.5,
      })
      if (results[0]?.url) {
        const img: GeneratedImage = {
          id: `${Date.now()}-refined`,
          url: results[0].url,
          prompt: refinePrompt,
          model: DEFAULT_IMAGE_MODEL, quality, format,
          style: selectedStyle,
          aspectRatio: selectedSize.ratio,
          width: selectedSize.width, height: selectedSize.height,
          isPublic, sessionId: sessionId.current,
          createdAt: new Date().toISOString(),
        }
        setMyImages(prev => [img, ...prev])
        setLastImageUrl(results[0].url)
        saveToSupabase(img).catch(() => {})
        setActiveTab('mine')
      } else {
        setError('Refinement returned no image. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refinement failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = useCallback(async (img: GeneratedImage) => {
    try {
      const res = await fetch(img.url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `thumbnail-${img.id}.${img.format || 'png'}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch { window.open(img.url, '_blank') }
  }, [])

  const handleReuse = useCallback((img: GeneratedImage) => {
    setPrompt(img.prompt)
    setSelectedStyle(img.style || 'cinematic')
    const size = SIZE_PRESETS.find(s => s.ratio === img.aspectRatio) || SIZE_PRESETS[0]
    setSelectedSize(size)
    setEnhancedPrompt('')
    setActiveTab('generate')
  }, [])

  const handleDelete = useCallback((id: string) => {
    setMyImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img) revokeObjectUrl(img.url)
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const handleTogglePublic = useCallback(async (id: string, pub: boolean) => {
    setMyImages(prev => prev.map(img => img.id === id ? { ...img, isPublic: pub } : img))
    try {
      await supabase.from('thumbnails').update({ is_public: pub }).eq('id', id)
    } catch {}
  }, [])

  return (
    <div className="flex flex-col h-full" style={appWrapper}>

      {/* Sub-header */}
      <div className="flex-shrink-0 h-12 flex items-center justify-between px-6 z-10"
        style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <Image size={13} className="text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Thumbnail Studio</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-primary)' }}>
            {MODELS.find(m => m.value === selectedModel)?.label || selectedModel}
          </span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['generate', 'mine', 'community'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-3 py-1 rounded-md text-xs font-medium transition-all capitalize flex items-center gap-1.5"
              style={tabStyle(activeTab === tab)}
            >
              {tab === 'mine' && <User size={10} />}
              {tab === 'community' && <Globe size={10} />}
              {tab}{tab === 'mine' && myImages.length > 0 ? ` (${myImages.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── GENERATE TAB ── */}
        {activeTab === 'generate' && (
          <div className="max-w-xl mx-auto p-6 space-y-4">

            {/* Mode toggle */}
            <div className="flex gap-2">
              {(['generate', 'edit'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize"
                  style={optionStyle(mode === m)}
                >
                  {m === 'generate' ? '✦ Generate' : '✎ Edit image'}
                </button>
              ))}
            </div>

            {/* Reference image (edit mode) */}
            {mode === 'edit' && (
              <div className="rounded-xl p-4" style={panels.glass}>
                <p className="text-xs font-medium mb-3" style={{ color: semantic.textLabel }}>REFERENCE IMAGE</p>
                <ImageEditor
                  onImageSelected={setReferenceImage}
                  onMaskCreated={setMask}
                  onClear={() => { setReferenceImage(null); setMask(null) }}
                  selectedImage={referenceImage}
                />
                <p className="text-xs mt-2" style={{ color: semantic.textMuted }}>
                  Edit mode sends your reference image to MuAPI for image-to-image generation.
                </p>
              </div>
            )}

            {/* Prompt */}
            <div className="rounded-xl p-4 space-y-3" style={panels.glass}>
              <p className="text-xs font-medium" style={{ color: semantic.textLabel }}>DESCRIBE YOUR THUMBNAIL</p>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); setEnhancedPrompt('') }}
                  placeholder="A dramatic gaming thumbnail with a shocked face and bold text..."
                  rows={3}
                  className="w-full resize-none text-sm outline-none rounded-lg p-3 pr-10 transition-colors"
                  style={{ ...panels.card, color: 'white' }}
                />
                <button onClick={handleEnhance} disabled={isEnhancing || !prompt.trim()}
                  title="AI enhance prompt" className="absolute top-2 right-2 p-1.5 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: 'rgba(34,211,238,0.1)' }}
                >
                  {isEnhancing
                    ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                    : <Wand2 size={13} style={{ color: 'var(--color-primary)' }} />
                  }
                </button>
              </div>
              {enhancedPrompt && (
                <div className="p-2 rounded-lg text-xs" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)', color: semantic.textSecondary }}>
                  <span style={{ color: 'var(--color-primary)' }}>Enhanced: </span>{enhancedPrompt}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => { setPrompt(t.prompt); setEnhancedPrompt('') }}
                    className="px-2.5 py-1 rounded-full text-xs transition-all"
                    style={{ ...panels.card, color: semantic.textMuted }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="rounded-xl p-4" style={panels.glass}>
              <p className="text-xs font-medium mb-3" style={{ color: semantic.textLabel }}>STYLE</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map(s => (
                  <button key={s.value} onClick={() => setSelectedStyle(s.value)}
                    className="py-2 px-1 rounded-lg text-xs font-medium transition-all text-center"
                    style={optionStyle(selectedStyle === s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model / API — dropdown with thumbnail tiles (mirrors Image Studio) */}
            <div className="rounded-xl p-4 relative" style={panels.glass} ref={modelDropdownRef}>
              <p className="text-xs font-medium mb-3" style={{ color: semantic.textLabel }}>MODEL / API</p>

              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={modelDropdownOpen}
                aria-label="Select image generation model"
                onClick={() => { setModelDropdownOpen(o => !o); setModelSearch('') }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={{ ...panels.card, color: 'white' }}
              >
                {(() => {
                  const m = MODELS.find(x => x.value === selectedModel)!
                  return (
                    <>
                      <ModelIcon provider={m.provider} label={m.label} size={8} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-bold truncate">{m.label}</span>
                        <span className="block text-xs truncate" style={{ color: semantic.textMuted }}>{m.description}</span>
                      </span>
                    </>
                  )
                })()}
                <ChevronDown size={14} style={{ color: semantic.textMuted }} className={`transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {modelDropdownOpen && (
                <div className="absolute left-4 right-4 z-50 mt-2 rounded-2xl p-3 shadow-4xl border border-white/10 overflow-hidden"
                  style={{ background: '#111', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Search */}
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5 mb-2 shrink-0 focus-within:border-primary/50 transition-colors">
                    <Search size={13} style={{ color: semantic.textMuted }} />
                    <input
                      autoFocus
                      value={modelSearch}
                      onChange={e => setModelSearch(e.target.value)}
                      placeholder="Search models"
                      aria-label="Search models"
                      className="bg-transparent border-none text-xs text-white focus:outline-none w-full"
                    />
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-widest px-1 py-1.5 shrink-0" style={{ color: semantic.textMuted }}>
                    Available models
                  </div>

                  <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1" role="listbox" aria-label="Image generation models">
                    {MODELS.filter(m => m.label.toLowerCase().includes(modelSearch.toLowerCase()) || m.value.toLowerCase().includes(modelSearch.toLowerCase())).map(m => {
                      const active = selectedModel === m.value
                      return (
                        <button
                          key={m.value}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => { setSelectedModel(m.value); setModelDropdownOpen(false) }}
                          className="flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 hover:bg-white/5 text-left"
                          style={active ? { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' } : undefined}
                        >
                          <span className="flex items-center gap-3.5">
                            <ModelIcon provider={m.provider} label={m.label} size={10} />
                            <span className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white tracking-tight">{m.label}</span>
                                {m.featured && (
                                  <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.2)', color: 'var(--color-primary)' }}>FEATURED</span>
                                )}
                              </span>
                              <span className="text-[10px]" style={{ color: semantic.textMuted }}>{m.value}</span>
                            </span>
                          </span>
                          {active && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </button>
                      )
                    })}
                    {MODELS.filter(m => m.label.toLowerCase().includes(modelSearch.toLowerCase()) || m.value.toLowerCase().includes(modelSearch.toLowerCase())).length === 0 && (
                      <div className="text-xs text-center py-4" style={{ color: semantic.textMuted }}>No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>


            {/* Size */}
            <div className="rounded-xl p-4" style={panels.glass}>
              <p className="text-xs font-medium mb-3" style={{ color: semantic.textLabel }}>CANVAS SIZE</p>
              <div className="grid grid-cols-3 gap-2">
                {SIZE_PRESETS.map(size => (
                  <button key={size.id} onClick={() => setSelectedSize(size)}
                    className="py-2 rounded-lg text-center transition-all"
                    style={optionStyle(selectedSize.id === size.id)}
                  >
                    <p className="text-xs font-bold">{size.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: semantic.textMuted }}>{size.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="rounded-xl p-4" style={panels.glass}>
              <p className="text-xs font-medium mb-3" style={{ color: semantic.textLabel }}>QUALITY</p>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_PRESETS.map(q => (
                  <button key={q.value} onClick={() => setQuality(q.value as 'low' | 'medium' | 'high')}
                    className="py-2.5 rounded-lg text-center transition-all"
                    style={optionStyle(quality === q.value)}
                  >
                    <p className="text-xs font-bold">{q.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: semantic.textMuted }}>{q.speed}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced */}
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs transition-all"
              style={{ color: semantic.textLabel }}
            >
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="rounded-xl p-4 space-y-4" style={panels.glass}>
                {/* Format */}
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>OUTPUT FORMAT</p>
                  <div className="flex gap-2">
                    {FORMATS.map(f => (
                      <button key={f.value} onClick={() => setFormat(f.value)}
                        className="flex-1 py-2 rounded-lg text-xs transition-all text-center"
                        style={optionStyle(format === f.value)}
                      >
                        <p className="font-bold">{f.label}</p>
                        <p style={{ color: semantic.textMuted }}>{f.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compression */}
                {format !== 'png' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium" style={{ color: semantic.textLabel }}>COMPRESSION</p>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{compression}%</span>
                    </div>
                    <input type="range" min={10} max={100} value={compression}
                      onChange={e => setCompression(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                    <div className="flex justify-between text-xs mt-1" style={{ color: semantic.textMuted }}>
                      <span>Smaller file</span><span>Best quality</span>
                    </div>
                  </div>
                )}

                {/* Variations */}
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>VARIATIONS</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} onClick={() => setVariations(n)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                        style={optionStyle(variations === n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Public toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Share to community</p>
                    <p className="text-xs" style={{ color: semantic.textMuted }}>Show in public gallery</p>
                  </div>
                  <button onClick={() => setIsPublic(!isPublic)}
                    className="w-10 h-6 rounded-full transition-all relative"
                    style={{ background: isPublic ? 'var(--color-primary)' : 'var(--border-color)' }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
                      style={{ left: isPublic ? '22px' : '2px' }}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Streaming progress (MuAPI) */}
            <MuapiImageStream
              request={activeRequest}
              onComplete={handleStreamComplete}
              onError={handleStreamError}
            />

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={buttons.primary}
            >
              {isGenerating
                ? <><Loader2 size={16} className="animate-spin" />Generating...</>
                : <><Image size={16} />Generate {variations > 1 ? `${variations} Thumbnails` : 'Thumbnail'}</>
              }
            </button>

            {/* Multi-turn refinement */}
            {lastImageUrl && myImages.length > 0 && (
              <div className="rounded-xl p-4 space-y-3" style={panels.glass}>
                <button onClick={() => setShowRefine(!showRefine)}
                  className="flex items-center gap-2 text-xs w-full"
                  style={{ color: semantic.textLabel }}
                >
                  <RefreshCw size={12} />
                  Refine last result
                  {showRefine ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
                </button>
                {showRefine && (
                  <div className="space-y-2">
                    <textarea
                      value={refinePrompt}
                      onChange={e => setRefinePrompt(e.target.value)}
                      placeholder="Change the background to a dark cityscape..."
                      rows={2}
                      className="w-full resize-none text-xs outline-none rounded-lg p-2.5"
                      style={{ ...panels.card, color: 'white' }}
                    />
                    <button onClick={handleRefine} disabled={isGenerating || !refinePrompt.trim()}
                      className="w-full py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      style={buttons.primary}
                    >
                      Apply refinement
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MY GALLERY TAB ── */}
        {activeTab === 'mine' && (
          <div className="p-4">
            {shareNotice && (
              <div
                onClick={() => setShareNotice(null)}
                className="mb-3 p-3 rounded-xl text-xs cursor-pointer"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
              >
                {shareNotice}
              </div>
            )}
            <ImageGallery
              images={myImages}
              onDelete={handleDelete}
              onReuse={handleReuse}
              onDownload={handleDownload}
              onTogglePublic={handleTogglePublic}
              emptyMessage="No thumbnails yet"
              emptyAction={{ label: 'Generate your first thumbnail', onClick: () => setActiveTab('generate') }}
            />
          </div>
        )}

        {/* ── COMMUNITY TAB ── */}
        {activeTab === 'community' && (
          <div className="p-4">
            {communityLoading ? (
              <div className="flex items-center justify-center py-16 gap-2" style={{ color: semantic.textMuted }}>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading community thumbnails...</span>
              </div>
            ) : (
              <ImageGallery
                images={communityImages}
                onDelete={() => {}}
                onReuse={handleReuse}
                onDownload={handleDownload}
                emptyMessage="No community thumbnails yet — be the first!"
                emptyAction={{ label: 'Generate & share', onClick: () => setActiveTab('generate') }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
