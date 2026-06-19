'use client'
import { useState, useCallback } from 'react'
import { Image, Loader2, Download, Copy, Trash2, ZoomIn, X, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import { generateImage } from '@/api/muapi'
import { panels, buttons, inputs, semantic, tabStyle, optionStyle, iconBadge, appWrapper, colors } from '@/shared/styles/designTokens'
import { enhancePrompt } from '@/api/openai'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ThumbnailResult {
  id: string
  url: string
  prompt: string
  model: string
  style: string
  aspectRatio: string
  createdAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MODELS = [
  { value: 'flux-1.0', label: 'Flux 1.0' },
  { value: 'flux-pro', label: 'Flux Pro' },
  { value: 'sdxl-1.0', label: 'SDXL 1.0' },
  { value: 'sdxl-turbo', label: 'SDXL Turbo' },
]

const STYLES = [
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'bold-text', label: 'Bold Text' },
  { value: 'face-focus', label: 'Face Focus' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'neon', label: 'Neon Glow' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'retro', label: 'Retro' },
]

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9', description: 'YouTube', width: 1280, height: 720 },
  { value: '1:1', label: '1:1', description: 'Instagram', width: 1080, height: 1080 },
  { value: '9:16', label: '9:16', description: 'Shorts', width: 1080, height: 1920 },
  { value: '4:3', label: '4:3', description: 'Classic', width: 1280, height: 960 },
]

const PROMPT_TEMPLATES = [
  { label: 'Gaming', prompt: 'Epic gaming thumbnail, shocked face reaction, bold title text, dramatic lighting, vibrant colors' },
  { label: 'Tutorial', prompt: 'Clean tutorial thumbnail, step-by-step layout, professional look, clear text overlay, modern design' },
  { label: 'Vlog', prompt: 'Personal vlog thumbnail, lifestyle photography, warm tones, candid expression, adventure feel' },
  { label: 'Finance', prompt: 'Finance YouTube thumbnail, money symbols, professional suit, clean background, trust-inspiring design' },
  { label: 'Fitness', prompt: 'Fitness thumbnail, energetic athlete, motivational, bold typography, dynamic pose, gym background' },
  { label: 'Food', prompt: 'Food thumbnail, mouth-watering close-up, vibrant colors, steam effect, appetizing presentation' },
  { label: 'Tech', prompt: 'Tech review thumbnail, product showcase, clean white background, modern typography, comparison layout' },
  { label: 'Reaction', prompt: 'Reaction video thumbnail, exaggerated facial expression, bright background, emotion-focused, engaging' },
]

const STYLE_MODIFIERS: Record<string, string> = {
  'vibrant': 'vibrant saturated colors, eye-catching, bold composition, high contrast, thumbnail style',
  'bold-text': 'designed for text overlay, clear focal point, bold graphic design, YouTube thumbnail composition',
  'face-focus': 'close-up portrait, expressive face, shallow depth of field, emotional, engaging eye contact',
  'minimal': 'minimalist design, clean background, simple composition, elegant, lots of negative space',
  'dramatic': 'dramatic lighting, cinematic mood, high contrast shadows, epic atmosphere, movie poster style',
  'neon': 'neon glow effects, cyberpunk aesthetic, dark background, bright neon colors, futuristic',
  'gradient': 'smooth gradient background, modern design, colorful blend, professional, visually appealing',
  'retro': 'retro vintage style, nostalgic, film grain, muted tones, classic design elements',
}

// ── Storage ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'thumbnail_studio_gallery'
function loadGallery(): ThumbnailResult[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveGallery(items: ThumbnailResult[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ThumbnailStudio({ apiKey }: { apiKey?: string }) {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('flux-1.0')
  const [selectedStyle, setSelectedStyle] = useState('vibrant')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [batchCount, setBatchCount] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [gallery, setGallery] = useState<ThumbnailResult[]>(loadGallery)
  const [lightbox, setLightbox] = useState<ThumbnailResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError('')
    setProgress(0)
    const timer = setInterval(() => setProgress(p => Math.min(p + 100 / (batchCount * 15), 88)), 1000)
    try {
      const ratio = ASPECT_RATIOS.find(r => r.value === aspectRatio)
      const styledPrompt = `${prompt}, ${STYLE_MODIFIERS[selectedStyle] || ''}, ultra high quality, 8K resolution`
      const results = await Promise.all(
        Array.from({ length: batchCount }).map(() =>
          generateImage({ prompt: styledPrompt, model, style: selectedStyle, width: ratio?.width, height: ratio?.height })
        )
      )
      const newItems: ThumbnailResult[] = results.map((r: any, i) => ({
        id: `${Date.now()}-${i}`,
        url: r.url || r.image_url || r,
        prompt, model, style: selectedStyle, aspectRatio,
        createdAt: new Date().toISOString(),
      }))
      const updated = [...newItems, ...gallery]
      setGallery(updated)
      saveGallery(updated)
      setProgress(100)
      setActiveTab('gallery')
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.')
    } finally {
      clearInterval(timer)
      setTimeout(() => { setIsGenerating(false); setProgress(0) }, 800)
    }
  }

  const handleEnhance = async () => {
    if (!prompt.trim()) return
    setIsEnhancing(true)
    try { const e = await enhancePrompt(prompt); if (e) setPrompt(e) } catch {}
    finally { setIsEnhancing(false) }
  }

  const deleteImage = (id: string) => {
    const updated = gallery.filter(g => g.id !== id)
    setGallery(updated); saveGallery(updated)
    if (lightbox?.id === id) setLightbox(null)
  }

  const reuseSettings = (item: ThumbnailResult) => {
    setPrompt(item.prompt); setModel(item.model)
    setSelectedStyle(item.style); setAspectRatio(item.aspectRatio)
    setCopiedId(item.id); setActiveTab('generate')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const downloadImage = useCallback(async (url: string, id: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `thumbnail-${id}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch { window.open(url, '_blank') }
  }, [])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-app)', color: 'white' }}>

      {/* ── Sub-header (matches shell tab bar style) ── */}
      <div
        className="flex-shrink-0 h-12 flex items-center justify-between px-6 z-10"
        style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <Image size={13} className="text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Thumbnail Studio</span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['generate', 'gallery'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-1 rounded-md text-xs font-medium transition-all capitalize"
              style={{ color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)' }}
            >
              {activeTab === tab && (
                <span
                  className="absolute inset-0 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                />
              )}
              <span className="relative">
                {tab}{tab === 'gallery' && gallery.length > 0 ? ` (${gallery.length})` : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* GENERATE */}
        {activeTab === 'generate' && (
          <div className="max-w-xl mx-auto p-6 space-y-5">

            {/* Prompt */}
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            >
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  DESCRIBE YOUR THUMBNAIL
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="A dramatic gaming thumbnail with a shocked face and bold text..."
                    rows={4}
                    className="w-full resize-none text-sm outline-none rounded-lg p-3 pr-10 transition-colors"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                    }}
                  />
                  <button
                    onClick={handleEnhance}
                    disabled={isEnhancing || !prompt.trim()}
                    title="AI enhance prompt"
                    className="absolute top-2 right-2 p-1.5 rounded-lg transition-all disabled:opacity-40"
                    style={{ background: 'rgba(34,211,238,0.1)' }}
                  >
                    {isEnhancing
                      ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                      : <Wand2 size={13} style={{ color: 'var(--color-primary)' }} />
                    }
                  </button>
                </div>
              </div>

              {/* Templates */}
              <div>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Quick templates</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_TEMPLATES.map(t => (
                    <button
                      key={t.label}
                      onClick={() => setPrompt(t.prompt)}
                      className="px-2.5 py-1 rounded-full text-xs transition-all"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            >
              <label className="block text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                STYLE
              </label>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedStyle(s.value)}
                    className="py-2 px-2 rounded-lg text-xs font-medium transition-all text-center"
                    style={{
                      background: selectedStyle === s.value ? 'rgba(34,211,238,0.15)' : 'var(--bg-card)',
                      border: `1px solid ${selectedStyle === s.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      color: selectedStyle === s.value ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            >
              <label className="block text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                ASPECT RATIO
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setAspectRatio(r.value)}
                    className="py-2.5 rounded-lg text-center transition-all"
                    style={{
                      background: aspectRatio === r.value ? 'rgba(34,211,238,0.15)' : 'var(--bg-card)',
                      border: `1px solid ${aspectRatio === r.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    }}
                  >
                    <p className="text-sm font-bold" style={{ color: aspectRatio === r.value ? 'var(--color-primary)' : 'white' }}>
                      {r.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs transition-all"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Advanced options
            </button>

            {showAdvanced && (
              <div
                className="rounded-xl p-5 grid grid-cols-2 gap-4"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
              >
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>MODEL</label>
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full text-sm rounded-lg p-2 outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>VARIATIONS</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => setBatchCount(n)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: batchCount === n ? 'var(--color-primary)' : 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: batchCount === n ? 'black' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--color-primary)', color: 'black' }}
            >
              {isGenerating
                ? <><Loader2 size={16} className="animate-spin" />Generating...</>
                : <><Image size={16} />Generate {batchCount > 1 ? `${batchCount} Variations` : 'Thumbnail'}</>
              }
            </button>

            {isGenerating && (
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'var(--color-primary)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* GALLERY */}
        {activeTab === 'gallery' && (
          <div className="p-4">
            {gallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <Image size={40} className="mb-4 opacity-30" />
                <p className="text-sm mb-1">No thumbnails yet</p>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.15)' }}>Generate your first thumbnail to see it here</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: 'var(--color-primary)' }}
                >
                  Start Generating
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {gallery.length} thumbnail{gallery.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => { if (confirm('Clear all thumbnails?')) { setGallery([]); saveGallery([]) } }}
                    className="text-xs flex items-center gap-1 transition-all"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Trash2 size={11} /> Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gallery.map(item => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden transition-all"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                    >
                      <div
                        className={`relative overflow-hidden cursor-pointer ${
                          item.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                          item.aspectRatio === '1:1' ? 'aspect-square' :
                          item.aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-video'
                        }`}
                        onClick={() => setLightbox(item)}
                      >
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <ZoomIn size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.prompt}</p>
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>{item.model}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>{item.aspectRatio}</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {[
                          { icon: <Download size={11} />, title: 'Download', onClick: () => downloadImage(item.url, item.id) },
                          { icon: <Copy size={11} />, title: 'Reuse', onClick: () => reuseSettings(item), active: copiedId === item.id },
                          { icon: <Trash2 size={11} />, title: 'Delete', onClick: () => deleteImage(item.id), danger: true },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            onClick={e => { e.stopPropagation(); btn.onClick() }}
                            title={btn.title}
                            className="p-1.5 rounded-lg transition-all"
                            style={{
                              background: btn.active ? 'rgba(34,211,238,0.3)' : 'rgba(0,0,0,0.7)',
                              color: btn.active ? 'var(--color-primary)' : btn.danger ? '#f87171' : 'white',
                            }}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden animate-fade-in-up"
            style={{ border: '1px solid var(--border-color)' }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.prompt}
              className="max-w-full max-h-[78vh] object-contain"
            />
            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
            >
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{lightbox.prompt}</p>
              <div className="flex gap-2 mt-2">
                {[lightbox.model, lightbox.style, lightbox.aspectRatio].map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              {[
                { icon: <Download size={14} />, onClick: () => downloadImage(lightbox.url, lightbox.id) },
                { icon: <Copy size={14} />, onClick: () => reuseSettings(lightbox) },
                { icon: <X size={14} />, onClick: () => setLightbox(null) },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: 'rgba(0,0,0,0.7)', color: 'white', border: '1px solid var(--border-color)' }}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
