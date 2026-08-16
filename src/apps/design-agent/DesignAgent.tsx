'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Plus, Send, ChevronDown, X, Loader2, Image, Video, FileText, Sparkles, FolderOpen, Trash2, Download, RefreshCw, Key } from 'lucide-react'
import { panels, buttons, semantic, appWrapper } from '@/shared/styles/designTokens'
import DesignAgentErrorBoundary from './ErrorBoundary'
import { PublishStep } from '@/components/SocialPublishProvider'
import { AssistStep } from '@/components/AiAssistantProvider'

function AssetModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className="max-w-4xl max-h-[90vh] w-full mx-4 rounded-2xl overflow-hidden relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{asset.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{asset.type}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {asset.type === 'image' && (
            <img src={asset.url} alt={asset.name} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
          )}
          {asset.type === 'video' && (
            <video src={asset.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-xl" />
          )}
          {asset.type === 'audio' && (
            <div className="w-full p-8 text-center space-y-4">
              <div className="text-6xl">🎵</div>
              <audio src={asset.url} controls autoPlay className="w-full" />
            </div>
          )}
          {asset.type === 'text' && (
            <div className="w-full p-6 rounded-xl whitespace-pre-wrap text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
              {asset.url}
            </div>
          )}
        </div>
        <div className="p-4 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-xs" style={{ color: semantic.textMuted }}>Generated asset</span>
          <div className="flex items-center gap-2">
            {(asset.type === 'image' || asset.type === 'video') && (
              <PublishStep
                mediaUrl={asset.url}
                mediaType={asset.type === 'image' ? 'image' : 'video'}
                title={asset.name}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              />
            )}
            <a href={asset.url} download target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: 'var(--color-primary)', color: 'white' }}>
              Download
            </a>
            {(asset.type === 'image') && (
              <AssistStep
                assetUrl={asset.url}
                assetType="image"
                onApply={() => {}}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                Enhance
              </AssistStep>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Templates (from muapi.ai/assistant screenshots) ───────────────────────────
const TEMPLATES = [
  { id: '3d-logo-animation', label: '3d Logo Animation', description: 'Transform a 2D logo into a premium 3D version and animate it with professional cinematic effects.' },
  { id: 'action-figure-generator', label: 'Action Figure Generator', description: 'Convert a photo of a person into a custom 3D action figure, complete with collectible toy packaging.' },
  { id: 'ad-creative', label: 'Ad Creative', description: 'Generate a high-converting ad creative set — hero image, ad copy variations, and platform-optimized assets.' },
  { id: 'amazon-product-listing', label: 'Amazon Product Listing', description: 'Generate a complete Amazon product listing image set — hero image, lifestyle shot, infographic with features.' },
  { id: 'animal-video-generator', label: 'Animal Video Generator', description: 'Create a hilarious and ultra-realistic video of an anthropomorphic animal acting like a human vlogger.' },
  { id: 'blog-header', label: 'Blog Header', description: 'Create a professional, eye-catching blog post header image sized for web (1200x628) with optional title.' },
  { id: 'brand-kit', label: 'Brand Kit', description: 'Generate a cohesive brand visual kit — logo concept, color palette moodboard, and typography pairing.' },
  { id: 'brochures', label: 'Brochures', description: 'Generate a professional multi-page brochure design — cover, inner spread, and back cover — for business.' },
  { id: 'cartoon-dance-animation', label: 'Cartoon Dance Animation', description: 'Turn any image into a fun animated cartoon character that dances to music.' },
  { id: 'character-story-video', label: 'Character Story Video', description: 'Create a cinematic short-form video featuring a consistent AI character across multiple scenes.' },
  { id: 'cinematic-b-roll', label: 'Cinematic B-Roll', description: 'Generate stunning cinematic B-roll footage from a single image or text description.' },
  { id: 'coloring-book-page', label: 'Coloring Book Page', description: 'Transform any image or idea into a detailed black-and-white coloring book page.' },
  { id: 'comic-strip', label: 'Comic Strip', description: 'Turn your story idea into a multi-panel comic strip with consistent characters and bold artwork.' },
  { id: 'corporate-headshot', label: 'Corporate Headshot', description: 'Transform a casual photo into a polished professional headshot with studio-quality lighting.' },
  { id: 'explainer-video', label: 'Explainer Video', description: 'Create a short animated explainer video for your product, service, or concept.' },
  { id: 'fashion-lookbook', label: 'Fashion Lookbook', description: 'Generate a stunning fashion lookbook with model shots, outfit details, and brand aesthetics.' },
  { id: 'food-photography', label: 'Food Photography', description: 'Transform food descriptions into mouth-watering professional food photography shots.' },
  { id: 'infographic', label: 'Infographic', description: 'Turn complex data or processes into a visually compelling and easy-to-understand infographic.' },
  { id: 'linkedin-banner', label: 'LinkedIn Banner', description: 'Design a professional LinkedIn profile banner that showcases your personal brand.' },
  { id: 'logo-design', label: 'Logo Design', description: 'Generate a unique, scalable logo design with multiple variations and color schemes.' },
  { id: 'meme-generator', label: 'Meme Generator', description: 'Create viral-worthy memes with perfect timing, relatable content, and sharp humor.' },
  { id: 'movie-poster', label: 'Movie Poster', description: 'Design a cinematic movie poster with dramatic lighting, typography, and visual storytelling.' },
  { id: 'music-video-clips', label: 'Music Video Clips', description: 'Generate visually stunning music video clips synchronized with your track mood and lyrics.' },
  { id: 'pattern-design', label: 'Pattern Design', description: 'Create seamless, repeating patterns for textiles, wallpapers, and digital backgrounds.' },
  { id: 'product-mockup', label: 'Product Mockup', description: 'Place your product design into realistic lifestyle mockup scenes for marketing.' },
  { id: 'real-estate-staging', label: 'Real Estate Staging', description: 'Virtually stage empty rooms with furniture and decor to help sell properties faster.' },
  { id: 'social-media-pack', label: 'Social Media Pack', description: 'Generate a complete social media content pack with posts, stories, and cover images.' },
  { id: 'thumbnail-generator', label: 'Thumbnail Generator', description: 'Create click-worthy YouTube thumbnails with bold text, expressive faces, and eye-catching design.' },
  { id: 'travel-postcard', label: 'Travel Postcard', description: 'Generate stunning travel postcards from destination names or existing travel photos.' },
  { id: 'wedding-invitation', label: 'Wedding Invitation', description: 'Design elegant wedding invitations with custom typography, florals, and romantic themes.' },
]

// Typewriter placeholder prompts
const PLACEHOLDERS = [
  'Ask Go-AI to write a script...',
  'Ask Go-AI to create a video...',
  'Ask Go-AI to generate an image...',
  'Ask Go-AI to design a brand kit...',
  'Ask Go-AI to make an ad creative...',
  'Ask Go-AI to create a thumbnail...',
]

// ── API helper (MuAPI Design Agent — https://muapi.ai/docs/design-agent-api)
// The browser calls the /api/design-agent/* Next.js proxies, which forward the
// `x-api-key` header to https://api.muapi.ai/api/v1/creative-agent.
async function apiCall(path: string, options: RequestInit = {}, apiKey: string) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data: any = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.error || data.message)) ||
      text ||
      `API error ${res.status}`
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return data
}

// Normalize a MuAPI AssetObject (or proxy asset) into the app's Asset shape.
// MuAPI assets expose { asset_label, kind: 'image'|'video'|'audio', url, ... }.
function mapAsset(a: any): Asset {
  const kind: string = a?.kind || 'image'
  const type: Asset['type'] = kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'image'
  return {
    id: a?.asset_label || a?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    url: a?.url || '',
    name: a?.asset_label || a?.name || 'Generated asset',
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Project {
  id: string
  name: string
  createdAt: string
  preview?: string
  messageCount?: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  assets?: Asset[]
  createdAt: string
}

interface Asset {
  id: string
  type: 'image' | 'video' | 'audio' | 'text'
  url: string
  name: string
}

const LOCAL_KEY = 'go_ai_design_agent'
const API_KEY_STORAGE = 'muapi_key'

function loadProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY + '_projects') || '[]') } catch { return [] }
}
function saveProjects(p: Project[]) { localStorage.setItem(LOCAL_KEY + '_projects', JSON.stringify(p)) }

export default function DesignAgent({ apiKey: propApiKey }: { apiKey?: string }) {
  // API key — seeded from the global key passed by StandaloneShell, falling
  // back to a previously saved key. The in-studio key modal can still override.
  const [apiKey, setApiKey] = useState(() =>
    propApiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE) || '' : '')
  )
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState('')

  // UI state
  const [projects, setProjects] = useState<Project[]>(loadProjects)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [placeholder, setPlaceholder] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Tracks whether the component is still mounted so long-running polling can
  // bail out if the user navigates away (avoids setState-after-unmount).
  const aliveRef = useRef(true)

  // Typewriter animation
  useEffect(() => {
    if (input) return // dont animate when user is typing
    const target = PLACEHOLDERS[placeholderIdx]
    if (isTyping) {
      if (charIdx < target.length) {
        const t = setTimeout(() => { setPlaceholder(target.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }, 40)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setIsTyping(false), 1800)
        return () => clearTimeout(t)
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => { setPlaceholder(target.slice(0, charIdx - 1)); setCharIdx(c => c - 1) }, 20)
        return () => clearTimeout(t)
      } else {
        setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
        setIsTyping(true)
      }
    }
  }, [charIdx, isTyping, placeholderIdx, input])

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Persist projects
  useEffect(() => { saveProjects(projects) }, [projects])

  // Stop polling if the component unmounts.
  useEffect(() => () => { aliveRef.current = false }, [])

  const saveApiKey = useCallback(() => {
    localStorage.setItem(API_KEY_STORAGE, keyInput)
    setApiKey(keyInput)
    setShowKeyModal(false)
  }, [keyInput])

  const createNewProject = useCallback(async () => {
    if (!apiKey) { setShowKeyModal(true); return }
    try {
      const session = await apiCall('/api/design-agent/sessions', {
        method: 'POST',
        body: JSON.stringify({ name: `Project ${projects.length + 1}` }),
      }, apiKey)
      const project: Project = {
        id: session.id || session.session_id || Date.now().toString(),
        name: session.name || `Project ${projects.length + 1}`,
        createdAt: new Date().toISOString(),
        messageCount: 0,
      }
      setProjects(prev => [project, ...prev])
      setActiveProject(project)
      setMessages([])
    } catch {
      // Fallback: create local project
      const project: Project = {
        id: Date.now().toString(),
        name: `Project ${projects.length + 1}`,
        createdAt: new Date().toISOString(),
        messageCount: 0,
      }
      setProjects(prev => [project, ...prev])
      setActiveProject(project)
      setMessages([])
    }
  }, [apiKey, projects.length])

  const sendMessage = useCallback(async () => {
    if (!input.trim() && !selectedTemplate) return
    if (!apiKey) { setShowKeyModal(true); return }
    if (!activeProject) { await createNewProject(); return }

    const userContent = selectedTemplate ? `[${selectedTemplate.label}] ${input}` : input
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      createdAt: new Date().toISOString(),
    }
    // Snapshot of prior turns for agent context (optional, docs-recommended).
    const prior = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSelectedTemplate(null)
    setIsLoading(true)

    try {
      let res: any
      if (selectedTemplate) {
        // Invoke a named expert skill (bypasses intent detection).
        res = await apiCall('/api/design-agent/run-skill', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: activeProject.id,
            skill_name: selectedTemplate.id,
            messages_snapshot: [...prior, { role: 'user', content: userContent }],
          }),
        }, apiKey)
      } else {
        res = await apiCall('/api/design-agent/chat', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: activeProject.id,
            message: input,
            messages_snapshot: prior,
          }),
        }, apiKey)
      }

      if (res?.job_id) {
        await pollJob(res.job_id, activeProject.id)
      } else {
        // Synchronous response (not the standard async pattern).
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res?.message || res?.response || 'Done.',
          createdAt: new Date().toISOString(),
        }])
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err?.message || 'Request failed'}. Please check your API key.`,
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, selectedTemplate, apiKey, activeProject, messages, createNewProject])

  // Submit-and-poll: the chat/run-skill call returns a job_id immediately. We poll
  // GET /jobs/{job_id}/events (cursor-based) until `done`, auto-approving any
  // proposed plan and collecting generated assets from `tool_result` events.
  // https://muapi.ai/docs/design-agent-api
  const pollJob = useCallback(async (jobId: string, sessionId: string): Promise<void> => {
    const MAX_ATTEMPTS = 120 // ~4 min at 2s cadence
    const textParts: string[] = []
    const streamedAssets: Asset[] = []
    let cursor = 0
    let failed = false
    let errorMessage = ''

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (!aliveRef.current) return
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000))
      let poll: any
      try {
        poll = await apiCall(
          `/api/design-agent/jobs?jobId=${encodeURIComponent(jobId)}&since=${cursor}`,
          {},
          apiKey,
        )
      } catch (err: any) {
        if (attempt === MAX_ATTEMPTS - 1) { failed = true; errorMessage = err?.message || 'Polling failed' }
        continue
      }

      const events: any[] = Array.isArray(poll?.events) ? poll.events : []
      for (const ev of events) {
        if (ev?.type === 'text' && ev?.payload?.content) {
          textParts.push(ev.payload.content)
        } else if (ev?.type === 'plan_propose') {
          // No plan-approval UI — approve automatically so generation proceeds.
          try {
            await apiCall('/api/design-agent/approve', {
              method: 'POST',
              body: JSON.stringify({ jobId }),
            }, apiKey)
          } catch { /* already approved / not required */ }
        } else if (ev?.type === 'tool_result' && ev?.payload?.asset) {
          streamedAssets.push(mapAsset(ev.payload.asset))
        } else if (ev?.type === 'error' && ev?.payload?.message) {
          errorMessage = ev.payload.message
        }
      }

      if (typeof poll?.cursor === 'number') cursor = poll.cursor
      if (poll?.status === 'failed') {
        failed = true
        errorMessage = poll?.error || errorMessage || 'Generation failed'
        break
      }
      if (poll?.done) break
    }

    // Pull the authoritative asset list for the session.
    let finalAssets: Asset[] = streamedAssets
    if (!failed) {
      try {
        const assetResp = await apiCall(
          `/api/design-agent/assets?sessionId=${encodeURIComponent(sessionId)}`,
          {},
          apiKey,
        )
        const list = Array.isArray(assetResp) ? assetResp : (assetResp?.items || [])
        if (list.length) finalAssets = list.map(mapAsset)
      } catch { /* fall back to streamed assets */ }
    }

    if (!aliveRef.current) return
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: failed
        ? `Error: ${errorMessage || 'Generation failed'}`
        : (textParts.join('') || (finalAssets.length ? 'Here are your generated assets:' : 'Done.')),
      assets: failed ? [] : finalAssets,
      createdAt: new Date().toISOString(),
    }])
  }, [apiKey])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeProject?.id === id) { setActiveProject(null); setMessages([]) }
  }, [activeProject?.id])

  const filteredTemplates = useMemo(() => {
    return templateSearch
      ? TEMPLATES.filter(t => t.label.toLowerCase().includes(templateSearch.toLowerCase()))
      : TEMPLATES
  }, [templateSearch])

  // ── HOME VIEW (no active project) ─────────────────────────────────────────
  return (
    <DesignAgentErrorBoundary>
      <div className="flex flex-col h-full" style={appWrapper}>
        {showTemplates && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowTemplates(false)}>
            <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
              style={{ background: '#111', border: '1px solid var(--border-color)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>
              {/* Modal header */}
              <div className="p-5 border-b flex items-start justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.2)' }}>
                    <Sparkles size={18} style={{ color: '#60a5fa' }} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Templates</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Pick a starting point — specialized workflows for common tasks.</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)' }}>
                  View Protocol
                </button>
              </div>
              {/* Search */}
              <div className="px-4 pt-3 pb-2">
                <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }} />
              </div>
              {/* Grid */}
              <div className="overflow-y-auto custom-scrollbar flex-1 p-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {filteredTemplates.map(t => (
                    <button key={t.id}
                      onClick={() => { setSelectedTemplate(t); setShowTemplates(false); setTemplateSearch('') }}
                      className="p-4 rounded-xl text-left transition-all hover:bg-white/5"
                      style={{ border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
                        <span className="text-sm font-medium">{t.label}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Footer */}
              <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Sparkles size={12} />
                  <span className="text-xs">DESIGN PROTOCOL V1.2</span>
                </div>
                <button onClick={() => setShowTemplates(false)} className="text-xs font-medium transition-all hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>Dismiss</button>
              </div>
            </div>
          </div>
        )}

        {/* API Key modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div className="w-96 rounded-2xl p-6 space-y-4" style={{ ...panels.glass, border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <Key size={18} style={{ color: 'var(--color-primary)' }} />
                <h2 className="text-base font-semibold">Enter your MuAPI Key</h2>
              </div>
              <p className="text-sm" style={{ color: semantic.textMuted }}>Your key is stored locally and never sent to our servers. Get your key at muapi.ai</p>
              <input value={keyInput} onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveApiKey()}
                placeholder="mua_..."
                className="w-full p-3 rounded-xl text-sm outline-none"
                style={{ ...panels.card, color: 'white', fontFamily: 'monospace' }} />
              <div className="flex gap-2">
                <button onClick={() => setShowKeyModal(false)} className="flex-1 py-2 rounded-xl text-sm transition-all" style={buttons.ghost}>Cancel</button>
                <button onClick={saveApiKey} disabled={!keyInput.trim()} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50" style={buttons.primary}>Save Key</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-end px-8 py-4 flex-shrink-0">
          <button onClick={() => setShowKeyModal(true)}
            className="p-2 rounded-full transition-all"
            style={{ color: apiKey ? 'var(--color-primary)' : semantic.textMuted }}
            title={apiKey ? 'API key set' : 'Set API key'}>
            <Key size={14} />
          </button>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Design is easier with{' '}
              <span style={{ color: 'var(--color-primary)' }}>Go-AI</span>
            </h1>
            <p className="text-base" style={{ color: semantic.textSecondary }}>The design agent that gets you and gets the job done</p>
          </div>

          {/* Prompt box */}
          <div className="w-full max-w-5xl">
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
              <div className="relative">
                {!input && (
                  <div className="absolute top-0 left-0 right-0 text-sm pointer-events-none select-none"
                    style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', lineHeight: '1.5', padding: '0' }}>
                    {placeholder}<span className="animate-pulse">|</span>
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder=""
                  rows={3}
                  className="w-full bg-transparent resize-none outline-none text-sm relative"
                  style={{ color: 'white', caretColor: 'var(--color-primary)', zIndex: 1 }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full transition-all hover:bg-white/10"
                  style={{ color: semantic.textMuted }}
                  aria-label="Upload file">
                  <Plus size={16} />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" />

                {/* Templates button */}
                <button onClick={() => setShowTemplates(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                  <Sparkles size={11} />
                  Templates
                  <ChevronDown size={11} />
                </button>
            {selectedTemplate && (() => {
              const t = selectedTemplate;
              return (
                <div className="inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                  <Sparkles size={11} />
                  {t.id}
                  <button onClick={() => setSelectedTemplate(null)} className="ml-0.5"><X size={10} /></button>
                </div>
              );
            })()}

                <div className="flex-1" />

                <button onClick={sendMessage} disabled={!input.trim() && !selectedTemplate}
                  className="p-2 rounded-full transition-all disabled:opacity-30"
                  style={{ color: (input.trim() || selectedTemplate) ? 'var(--color-primary)' : semantic.textMuted }}
                  aria-label="Send message">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="w-full max-w-5xl">
            <h2 className="text-base font-semibold mb-4">Recent Projects</h2>
            <div className="grid grid-cols-3 gap-3">
              {/* New Project card */}
              <button onClick={createNewProject}
                className="aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-white/20"
                style={{ border: '1px dashed var(--border-color)', background: 'transparent' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                  <Plus size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                </div>
                <span className="text-xs" style={{ color: semantic.textSecondary }}>New Project</span>
              </button>

              {/* Existing projects */}
              {projects.slice(0, 8).map(p => (
                <div key={p.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all hover:border-white/20"
                  style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                  onClick={() => { setActiveProject(p); setMessages([]) }}>
                  {p.preview
                    ? <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><FolderOpen size={20} style={{ color: semantic.textDisabled }} /></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-2">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                     <button onClick={e => { e.stopPropagation(); deleteProject(p.id) }}
                       className="absolute top-2 right-2 p-1 rounded-lg transition-all" style={{ background: 'rgba(0,0,0,0.6)' }}
                       aria-label={`Delete project ${p.name}`}>
                       <Trash2 size={11} className="text-red-400" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DesignAgentErrorBoundary>
  )

  // ── CHAT VIEW (active project) ────────────────────────────────────────────
  return (
    <DesignAgentErrorBoundary>
      <div className="flex flex-col h-full" style={appWrapper}>
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowTemplates(false)}>
          <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
            style={{ background: '#111', border: '1px solid var(--border-color)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="p-5 border-b flex items-start justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.2)' }}>
                  <Sparkles size={18} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Templates</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Pick a starting point — specialized workflows for common tasks.</p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)' }}>
                View Protocol
              </button>
            </div>
            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }} />
            </div>
            {/* Grid */}
            <div className="overflow-y-auto custom-scrollbar flex-1 p-4 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {filteredTemplates.map(t => (
                  <button key={t.id}
                    onClick={() => { setSelectedTemplate(t); setShowTemplates(false); setTemplateSearch('') }}
                    className="p-4 rounded-xl text-left transition-all hover:bg-white/5"
                    style={{ border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
                      <span className="text-sm font-medium">{t.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <Sparkles size={12} />
                <span className="text-xs">DESIGN PROTOCOL V1.2</span>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-xs font-medium transition-all hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <button onClick={() => { setActiveProject(null); setMessages([]) }}
          className="text-xs transition-all hover:text-white" style={{ color: semantic.textMuted }}>← Back</button>
        <span className="text-sm font-medium">{activeProject?.name}</span>
        <div className="flex-1" />
        <button onClick={() => setShowKeyModal(true)} className="p-1.5 rounded-lg transition-all" style={{ color: apiKey ? 'var(--color-primary)' : semantic.textMuted }} aria-label="API Key settings"><Key size={13} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: semantic.textDisabled }}>
            <Sparkles size={32} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
            <p className="text-sm">Start your design project</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%] space-y-2">
              <div className="px-4 py-3 rounded-2xl text-sm"
                style={{
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? 'black' : 'white',
                  border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                }}>
                {msg.content}
              </div>
              {msg.assets && msg.assets.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {msg.assets.map(asset => (
                    <div key={asset.id} className="relative rounded-xl overflow-hidden group cursor-pointer" style={{ border: '1px solid var(--border-color)' }} onClick={() => setSelectedAsset(asset)}>
                      {asset.type === 'image'
                        ? <img src={asset.url} alt={asset.name} className="w-full object-cover" />
                        : asset.type === 'video'
                        ? <video src={asset.url} controls className="w-full" />
                        : asset.type === 'audio'
                        ? <div className="p-3 text-xs" style={{ color: semantic.textSecondary }}>🎵 {asset.name}</div>
                        : <div className="p-3 text-xs" style={{ color: semantic.textSecondary }}>{asset.name}</div>
                      }
                      <a href={asset.url} download target="_blank" rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
                        onClick={(e) => e.stopPropagation()}>
                        <Download size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm" style={{ color: semantic.textMuted }}>Go-AI is working...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
          <div className="relative">
            {!input && (
              <div className="absolute top-0 left-0 right-0 text-sm pointer-events-none select-none"
                style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', lineHeight: '1.5', padding: '0' }}>
                {placeholder}<span className="animate-pulse">|</span>
              </div>
            )}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder=""
              rows={2}
              className="w-full bg-transparent resize-none outline-none text-sm relative"
              style={{ color: 'white', caretColor: 'var(--color-primary)', zIndex: 1 }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-full transition-all hover:bg-white/10" style={{ color: semantic.textMuted }} aria-label="Upload file">
              <Plus size={16} />
            </button>
            {/* Templates button */}
            <button onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
              <Sparkles size={11} />
              Templates
              <ChevronDown size={11} />
            </button>
             {selectedTemplate && (() => {
               const t = selectedTemplate;
               return (
                 <div className="inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-full text-xs"
                   style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                   <Sparkles size={11} />
                   {t!.id}
                   <button onClick={() => setSelectedTemplate(null)} className="ml-0.5"><X size={10} /></button>
                 </div>
               );
             })()}
             <div className="flex-1" />
            <button onClick={sendMessage} disabled={!input.trim() && !selectedTemplate}
              className="p-2 rounded-full transition-all disabled:opacity-30"
              style={{ color: (input.trim() || selectedTemplate) ? 'var(--color-primary)' : semantic.textMuted }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Asset viewer modal */}
      {selectedAsset && <AssetModal asset={selectedAsset!} onClose={() => setSelectedAsset(null)} />}
    </DesignAgentErrorBoundary>
  )
}
