import { useState } from 'react'
import { Sparkles, Copy, RefreshCw, Save, Trash2, MessageSquare, Hash, Users, Star } from 'lucide-react'
import { generateText, generateImage } from '@/api/muapi'

const CONTENT_TYPES = [
  { id: 'review', label: 'Product Review', icon: '⭐', prompt: 'Write an authentic product review in a conversational tone' },
  { id: 'testimonial', label: 'Testimonial', icon: '💬', prompt: 'Create a customer testimonial story' },
  { id: 'unboxing', label: 'Unboxing', icon: '📦', prompt: 'Write an exciting unboxing script' },
  { id: 'tutorial', label: 'Tutorial', icon: '📚', prompt: 'Create a helpful how-to tutorial' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🌟', prompt: 'Write an engaging lifestyle content piece' },
  { id: 'comparison', label: 'Comparison', icon: '⚖️', prompt: 'Create a balanced product comparison' },
]

const TONES = [
  { id: 'friendly', label: 'Friendly & Casual' },
  { id: 'professional', label: 'Professional' },
  { id: 'humorous', label: 'Humorous' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'educational', label: 'Educational' },
]

const AUDIENCES = [
  'Gen Z (18-25)', 'Millennials (26-41)', 'Gen X (42-57)', 'Boomers (58+)',
  'Tech Savvy', 'Budget Conscious', 'Luxury Seekers', 'Eco-Conscious',
]

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube Shorts', icon: '▶️' },
  { id: 'twitter', label: 'Twitter', icon: '🐦' },
]

type UGCItem = {
  id: string
  product: string
  contentType: string
  content: string
  imageUrl: string | null
  tone: string
  audience: string
  platform: string
  createdAt: string
}

const STORAGE_KEY = 'ugc-generator-library'

function loadLibrary(): UGCItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UGCItem[]) : []
  } catch {
    return []
  }
}

function saveLibrary(items: UGCItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore quota errors
  }
}

export default function UGCGenerator() {
  const [product, setProduct] = useState('')
  const [contentType, setContentType] = useState('review')
  const [tone, setTone] = useState('friendly')
  const [audience, setAudience] = useState('Millennials (26-41)')
  const [platform, setPlatform] = useState('instagram')
  const [includeImage, setIncludeImage] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [current, setCurrent] = useState<UGCItem | null>(null)
  const [library, setLibrary] = useState<UGCItem[]>(loadLibrary)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const typeConfig = CONTENT_TYPES.find(t => t.id === contentType) || CONTENT_TYPES[0]

  const handleGenerate = async () => {
    if (!product.trim()) {
      alert('Please describe your product or service first.')
      return
    }
    setIsGenerating(true)
    try {
      const prompt = `${typeConfig.prompt}. Product/Service: ${product}. Tone: ${tone}. Target audience: ${audience}. Platform: ${platform}. Keep it concise (under 280 chars if Twitter, otherwise 800-1500 chars).`
      const textResult = await generateText({ prompt, systemPrompt: 'You are an expert UGC copywriter. Output ONLY the post copy, no preamble.' })
      const content = (textResult as any).text ?? ''

      let imageUrl: string | null = null
      if (includeImage) {
        try {
          const imageResult = await generateImage({
            prompt: `Professional UGC content photo for ${product}, authentic lifestyle shot, natural lighting, ${platform} aesthetic`,
            width: 1024,
            height: 1024,
          })
          imageUrl = (imageResult as any).url ?? null
        } catch {
          imageUrl = null
        }
      }

      const item: UGCItem = {
        id: String(Date.now()),
        product,
        contentType,
        content,
        imageUrl,
        tone,
        audience,
        platform,
        createdAt: new Date().toISOString(),
      }
      setCurrent(item)
    } catch (err) {
      alert(`Generation failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = (item: UGCItem) => {
    const next = [item, ...library.filter(i => i.id !== item.id)]
    setLibrary(next)
    saveLibrary(next)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this UGC item?')) return
    const next = library.filter(i => i.id !== id)
    setLibrary(next)
    saveLibrary(next)
  }

  const handleEdit = (item: UGCItem) => {
    setEditingId(item.id)
    setDraft(item.content)
  }

  const handleSaveEdit = () => {
    const next = library.map(i => (i.id === editingId ? { ...i, content: draft } : i))
    setLibrary(next)
    saveLibrary(next)
    setEditingId(null)
    setDraft('')
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // ignore
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">UGC Generator</h1>
        <p className="text-secondary mt-1">AI-powered user-generated content for every platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Product or Service</label>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Describe the product or service you need UGC for..."
                rows={3}
                className="w-full bg-bg-card border border-border-color rounded-lg p-3 text-white text-sm placeholder:text-muted focus:border-primary/50 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
                >
                  {TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={(e) => setIncludeImage(e.target.checked)}
                  className="rounded border-border-color bg-bg-card text-primary focus:ring-primary/50"
                />
                <Sparkles size={14} />
                Generate matching image
              </label>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-primary text-black rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              <Sparkles size={18} />
              {isGenerating ? 'Generating...' : 'Generate UGC Content'}
            </button>
          </div>

          {/* Result */}
          {current && (
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Generated</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(current.content)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 text-xs flex items-center gap-1 transition-all"
                  >
                    <Copy size={12} /> Copy
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 text-xs flex items-center gap-1 transition-all"
                  >
                    <RefreshCw size={12} /> Regenerate
                  </button>
                  <button
                    onClick={() => handleSave(current)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-black hover:bg-primary-hover text-xs flex items-center gap-1 transition-all"
                  >
                    <Save size={12} /> Save
                  </button>
                </div>
              </div>
              {current.imageUrl && (
                <img
                  src={current.imageUrl}
                  alt={current.product}
                  className="w-full max-h-72 object-cover rounded-lg border border-border-color"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                  {typeConfig.icon} {typeConfig.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                  {tone}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                  {platform}
                </span>
              </div>
              <p className="text-white whitespace-pre-wrap text-sm leading-relaxed">{current.content}</p>
            </div>
          )}
        </div>

        {/* Library Sidebar */}
        <div className="space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Hash size={16} /> Library
            <span className="text-xs text-muted">({library.length})</span>
          </h3>
          {library.length === 0 ? (
            <div className="glass-panel rounded-xl p-6 text-center text-muted text-sm">
              No saved UGC yet. Generate and save items to build your library.
            </div>
          ) : (
            library.map((item) => (
              <div key={item.id} className="glass-panel rounded-xl p-4 space-y-2">
                {editingId === item.id ? (
                  <>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={5}
                      className="w-full bg-bg-card border border-border-color rounded-lg p-2 text-white text-xs"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded text-xs text-muted hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-1 rounded text-xs bg-primary text-black"
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-muted">{item.platform}</span>
                      <span className="text-muted">·</span>
                      <span className="text-muted">{item.tone}</span>
                    </div>
                    <p className="text-white text-xs line-clamp-4">{item.content}</p>
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 rounded text-muted hover:text-white"
                        title="Edit"
                      >
                        <MessageSquare size={12} />
                      </button>
                      <button
                        onClick={() => handleCopy(item.content)}
                        className="p-1 rounded text-muted hover:text-white"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded text-muted hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
