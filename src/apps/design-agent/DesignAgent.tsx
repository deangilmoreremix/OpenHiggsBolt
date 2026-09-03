'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import axios from 'axios'
import { Plus, Send, ChevronDown, X, Loader2, Sparkles, FolderOpen, Trash2, Download, Key } from 'lucide-react'
import { semantic, appWrapper } from '@/shared/styles/designTokens'
import DesignAgentErrorBoundary from './ErrorBoundary'
import { PublishStep } from '@/components/SocialPublishProvider'
import { AssistStep } from '@/components/AiAssistantProvider'

type AgentMode = 'agent' | 'generate' | 'edit'
type ActivityStatus = 'running' | 'done' | 'error'
type AssetAction = 'edit' | 'upscale' | 'remove-bg' | 'vectorize'

interface Project {
  id: string
  name: string
  createdAt: string
  preview?: string
  messageCount?: number
}

interface AgentAttachment {
  asset_label: string
  url: string
  kind: 'image' | 'video' | 'audio'
}

interface Asset {
  id: string
  type: 'image' | 'video' | 'audio' | 'text'
  url: string
  name: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  assets?: Asset[]
  attachments?: AgentAttachment[]
  createdAt: string
}

interface PlanNode {
  id?: string | number
  label?: string
  tool?: string
  depends?: Array<string | number>
  est_credits?: number
}

interface PendingPlan {
  jobId: string
  sessionId: string
  title: string
  nodes: PlanNode[]
  totalCredits: number
  cursor: number
}

interface BrandKit {
  enabled: boolean
  logo: string
  colors: string
  fonts: string
  tone: string
  style: string
}

interface ActivityItem {
  label: string
  status: ActivityStatus
}

const LOCAL_KEY = 'go_ai_design_agent'
const MAX_ATTACHMENTS = 14

const EMPTY_BRAND_KIT: BrandKit = {
  enabled: false,
  logo: '',
  colors: '',
  fonts: '',
  tone: '',
  style: '',
}

// ── Templates (preserve the current SmartVideo Go-AI library) ───────────────
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

const PLACEHOLDERS = [
  'Ask Go-AI to write a script...',
  'Ask Go-AI to create a video...',
  'Ask Go-AI to generate an image...',
  'Ask Go-AI to design a brand kit...',
  'Ask Go-AI to make an ad creative...',
  'Ask Go-AI to create a thumbnail...',
]

function loadProjects(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY + '_projects') || '[]')
  } catch {
    return []
  }
}

function loadBrandKit(): BrandKit {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY + '_brand_kit') || 'null') || EMPTY_BRAND_KIT
  } catch {
    return EMPTY_BRAND_KIT
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(LOCAL_KEY + '_projects', JSON.stringify(projects))
}

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
    const detail = (data && (data.detail || data.error || data.message)) || text || `API error ${res.status}`
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return data
}

function mapAsset(value: any): Asset {
  const kind = value?.kind || 'image'
  const type: Asset['type'] = kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'image'
  return {
    id: value?.asset_label || value?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    url: value?.url || '',
    name: value?.asset_label || value?.name || 'Generated asset',
  }
}

function upsertActivity(items: ActivityItem[], label: string, status: ActivityStatus): ActivityItem[] {
  const filtered = items.filter(item => item.label !== label)
  return [...filtered, { label, status }].slice(-8)
}

function AssetModal({ asset, onClose, onAction }: { asset: Asset; onClose: () => void; onAction: (action: AssetAction, asset: Asset) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className="max-w-4xl max-h-[90vh] w-full mx-4 rounded-2xl overflow-hidden relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{asset.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{asset.type}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-4 flex items-center justify-center" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {asset.type === 'image' && <img src={asset.url} alt={asset.name} className="max-w-full max-h-[70vh] object-contain rounded-xl" />}
          {asset.type === 'video' && <video src={asset.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-xl" />}
          {asset.type === 'audio' && <div className="w-full p-8 text-center space-y-4"><div className="text-6xl">🎵</div><audio src={asset.url} controls autoPlay className="w-full" /></div>}
          {asset.type === 'text' && <div className="w-full p-6 rounded-xl whitespace-pre-wrap text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>{asset.url}</div>}
        </div>
        <div className="p-4 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-xs" style={{ color: semantic.textMuted }}>Generated asset</span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {asset.type === 'image' && (
              <>
                <button onClick={() => onAction('edit', asset)} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Edit with Go-AI</button>
                <button onClick={() => onAction('upscale', asset)} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Upscale</button>
                <button onClick={() => onAction('remove-bg', asset)} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Remove BG</button>
                <button onClick={() => onAction('vectorize', asset)} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Vectorize</button>
              </>
            )}
            {(asset.type === 'image' || asset.type === 'video') && (
              <PublishStep
                mediaUrl={asset.url}
                mediaType={asset.type === 'image' ? 'image' : 'video'}
                title={asset.name}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              />
            )}
            <a href={asset.url} download target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: 'var(--color-primary)', color: 'white' }}>Download</a>
            {asset.type === 'image' && (
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

function TemplateModal({ open, onClose, search, setSearch, templates, onSelect }: {
  open: boolean
  onClose: () => void
  search: string
  setSearch: (value: string) => void
  templates: typeof TEMPLATES
  onSelect: (template: typeof TEMPLATES[number]) => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up" style={{ background: '#111', border: '1px solid var(--border-color)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={event => event.stopPropagation()}>
        <div className="p-5 border-b flex items-start justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.2)' }}><Sparkles size={18} style={{ color: '#60a5fa' }} /></div>
            <div><h2 className="text-base font-semibold">Templates</h2><p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Pick a starting point — specialized workflows for common tasks.</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={17} /></button>
        </div>
        <div className="px-4 pt-3 pb-2">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search templates..." className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white' }} />
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 p-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map(template => (
              <button key={template.id} onClick={() => onSelect(template)} className="p-4 rounded-xl text-left transition-all hover:bg-white/5" style={{ border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2 mb-2"><Sparkles size={13} style={{ color: '#60a5fa', flexShrink: 0 }} /><span className="text-sm font-medium">{template.label}</span></div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{template.description}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}><Sparkles size={12} /><span className="text-xs">DESIGN PROTOCOL V1.2</span></div>
          <button onClick={onClose} className="text-xs font-medium transition-all hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>Dismiss</button>
        </div>
      </div>
    </div>
  )
}

function BrandKitModal({ open, kit, setKit, onClose }: { open: boolean; kit: BrandKit; setKit: (kit: BrandKit) => void; onClose: () => void }) {
  if (!open) return null
  const fields: Array<keyof Omit<BrandKit, 'enabled'>> = ['logo', 'colors', 'fonts', 'tone', 'style']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl p-5 space-y-4" style={{ background: '#111', border: '1px solid var(--border-color)' }} onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between"><div><h2 className="font-semibold">Brand Kit</h2><p className="text-xs mt-1" style={{ color: semantic.textSecondary }}>Persist brand context across Go-AI generations.</p></div><button onClick={onClose}><X size={18} /></button></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={kit.enabled} onChange={event => setKit({ ...kit, enabled: event.target.checked })} /> Use Brand Kit</label>
        {fields.map(field => (
          <label key={field} className="block text-xs capitalize">
            {field}
            <input value={kit[field]} onChange={event => setKit({ ...kit, [field]: event.target.value })} className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} placeholder={field === 'logo' ? 'Logo URL or asset label' : `Brand ${field}`} />
          </label>
        ))}
        <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--color-primary)', color: 'white' }}>Save Brand Kit</button></div>
      </div>
    </div>
  )
}

function ModeControls({ mode, setMode, brandEnabled, openBrandKit }: { mode: AgentMode; setMode: (mode: AgentMode) => void; brandEnabled: boolean; openBrandKit: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['agent', 'generate', 'edit'] as const).map(value => (
        <button key={value} onClick={() => setMode(value)} className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all" style={{ background: mode === value ? 'rgba(59,130,246,0.2)' : 'var(--bg-card)', border: '1px solid var(--border-color)', color: mode === value ? '#60a5fa' : semantic.textSecondary }}>{value}</button>
      ))}
      <button onClick={openBrandKit} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: brandEnabled ? 'rgba(34,197,94,0.12)' : 'var(--bg-card)', border: '1px solid var(--border-color)', color: brandEnabled ? '#86efac' : semantic.textSecondary }}>Brand Kit</button>
    </div>
  )
}

function AttachmentStrip({ attachments, uploading, progress, activity, onRemove }: { attachments: AgentAttachment[]; uploading: boolean; progress: number; activity: ActivityItem[]; onRemove: (label: string) => void }) {
  if (!attachments.length && !uploading && !activity.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-color)' }}>
      {attachments.map(item => (
        <div key={item.asset_label} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs" style={{ background: 'var(--bg-card)' }}>
          <span>{item.kind === 'video' ? '🎬' : item.kind === 'audio' ? '🎵' : '🖼️'}</span>
          <span>{item.asset_label}</span>
          <button onClick={() => onRemove(item.asset_label)} aria-label={`Remove ${item.asset_label}`}><X size={11} /></button>
        </div>
      ))}
      {uploading && <div className="text-xs" style={{ color: semantic.textSecondary }}>Uploading reference… {progress}%</div>}
      {activity.slice(-4).map((item, index) => (
        <div key={`${item.label}-${index}`} className="text-xs" style={{ color: item.status === 'error' ? '#f87171' : item.status === 'done' ? '#86efac' : '#60a5fa' }}>
          {item.status === 'done' ? '✓' : item.status === 'error' ? '!' : '●'} {item.label}
        </div>
      ))}
    </div>
  )
}

function PlanCard({ plan, onApprove, onReject, busy }: { plan: PendingPlan; onApprove: () => void; onReject: () => void; busy: boolean }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(96,165,250,0.28)' }}>
      <div className="flex items-start justify-between gap-4">
        <div><div className="text-xs font-semibold" style={{ color: '#60a5fa' }}>GO-AI EXECUTION PLAN</div><div className="mt-1 text-sm font-semibold">{plan.title}</div></div>
        <div className="text-xs" style={{ color: semantic.textSecondary }}>{plan.nodes.length} steps · {plan.totalCredits} credits</div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {plan.nodes.map((node, index) => (
          <div key={String(node.id ?? index)} className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-xs font-medium">{index + 1}. {node.label || String(node.tool || 'Generate asset').replace(/_/g, ' ')}</div>
            <div className="mt-1 text-[11px]" style={{ color: semantic.textMuted }}>{node.tool ? String(node.tool).replace(/_/g, ' ') : 'AI step'}{node.est_credits != null ? ` · ${node.est_credits} cr` : ''}{node.depends?.length ? ` · after ${node.depends.join(', ')}` : ''}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button disabled={busy} onClick={onReject} className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: semantic.textSecondary }}>Reject / Revise</button>
        <button disabled={busy} onClick={onApprove} className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: 'var(--color-primary)', color: 'white' }}>Approve & Generate</button>
      </div>
    </div>
  )
}

export default function DesignAgent({ apiKey: propApiKey, onRequestApiKey, templateData }: { apiKey?: string; onRequestApiKey?: () => void; templateData?: { prompt?: string; slug?: string; [key: string]: any } }) {
  const apiKey = propApiKey || ''
  const [projects, setProjects] = useState<Project[]>(loadProjects)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[number] | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [placeholder, setPlaceholder] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [attachments, setAttachments] = useState<AgentAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [agentMode, setAgentMode] = useState<AgentMode>('agent')
  const [showBrandKit, setShowBrandKit] = useState(false)
  const [brandKit, setBrandKit] = useState<BrandKit>(loadBrandKit)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const aliveRef = useRef(true)
  const approvedJobsRef = useRef(new Set<string>())
  const templateApplied = useRef<string | null>(null)

  useEffect(() => {
    if (!templateData || templateApplied.current === templateData.slug) return
    templateApplied.current = templateData.slug || 'template'
    if (templateData.prompt) setInput(templateData.prompt)
  }, [templateData])

  useEffect(() => {
    if (input) return
    const target = PLACEHOLDERS[placeholderIdx]
    if (isTyping) {
      if (charIdx < target.length) {
        const timer = setTimeout(() => { setPlaceholder(target.slice(0, charIdx + 1)); setCharIdx(value => value + 1) }, 40)
        return () => clearTimeout(timer)
      }
      const timer = setTimeout(() => setIsTyping(false), 1800)
      return () => clearTimeout(timer)
    }
    if (charIdx > 0) {
      const timer = setTimeout(() => { setPlaceholder(target.slice(0, charIdx - 1)); setCharIdx(value => value - 1) }, 20)
      return () => clearTimeout(timer)
    }
    setPlaceholderIdx(value => (value + 1) % PLACEHOLDERS.length)
    setIsTyping(true)
  }, [charIdx, isTyping, placeholderIdx, input])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, pendingPlan, activity])
  useEffect(() => { saveProjects(projects) }, [projects])
  useEffect(() => { localStorage.setItem(LOCAL_KEY + '_brand_kit', JSON.stringify(brandKit)) }, [brandKit])
  useEffect(() => () => { aliveRef.current = false }, [])

  const createNewProject = useCallback(async (): Promise<Project | null> => {
    if (!apiKey) { onRequestApiKey?.(); return null }
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
      setProjects(previous => [project, ...previous])
      setActiveProject(project)
      setMessages([])
      setActivity([])
      setPendingPlan(null)
      return project
    } catch (error: any) {
      setActivity([{ label: error?.message || 'Could not create a Design Agent project', status: 'error' }])
      return null
    }
  }, [apiKey, onRequestApiKey, projects.length])

  const handleAttachmentFiles = useCallback(async (fileList: FileList | null) => {
    if (!apiKey) { onRequestApiKey?.(); return }
    const remaining = Math.max(0, MAX_ATTACHMENTS - attachments.length)
    const files = Array.from(fileList || []).slice(0, remaining)
    if (!files.length) return

    let project = activeProject
    if (!project) project = await createNewProject()
    if (!project) return

    setUploading(true)
    setUploadProgress(0)
    try {
      for (const file of files) {
        const supported = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')
        if (!supported) continue
        const maxBytes = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 20 * 1024 * 1024
        if (file.size > maxBytes) throw new Error(`${file.name} exceeds the ${file.type.startsWith('video/') ? '100MB' : '20MB'} reference limit`)

        const kind: AgentAttachment['kind'] = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image'
        const sign = await axios.get('/api/v1/get_upload_url', {
          params: { filename: file.name },
          headers: { 'x-api-key': apiKey },
        })
        const { url, fields } = sign.data || {}
        if (!url || !fields?.key) throw new Error('MuAPI did not return an upload URL')

        const formData = new FormData()
        formData.append('x-proxy-target-url', url)
        Object.entries(fields).forEach(([key, value]) => formData.append(key, String(value)))
        formData.append('file', file)
        await axios.post('/api/v1/upload-binary', formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'x-api-key': apiKey },
          onUploadProgress: event => {
            if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total))
          },
        })

        const encodedKey = String(fields.key)
          .split('/')
          .map(encodeURIComponent)
          .join('/')
        const uploadedUrl = `https://cdn.muapi.ai/${encodedKey}`
        const registered = await apiCall('/api/design-agent/session-assets', {
          method: 'POST',
          body: JSON.stringify({ sessionId: project.id, url: uploadedUrl, kind }),
        }, apiKey)
        const attachment: AgentAttachment = {
          asset_label: registered.asset_label || registered.id || `asset_${Date.now()}`,
          url: uploadedUrl,
          kind,
        }
        setAttachments(previous => [...previous, attachment].slice(0, MAX_ATTACHMENTS))
      }
      setActivity(previous => upsertActivity(previous, 'Reference media ready', 'done'))
    } catch (error: any) {
      setActivity(previous => upsertActivity(previous, error?.message || 'Reference upload failed', 'error'))
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [activeProject, apiKey, attachments.length, createNewProject, onRequestApiKey])

  const removeAttachment = useCallback((label: string) => {
    setAttachments(previous => previous.filter(item => item.asset_label !== label))
  }, [])

  const pollJob = useCallback(async (jobId: string, sessionId: string, startCursor = 0): Promise<void> => {
    const MAX_ATTEMPTS = 120
    const textParts: string[] = []
    const streamedAssets: Asset[] = []
    let cursor = startCursor
    let failed = false
    let errorMessage = ''

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (!aliveRef.current) return
      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 2000))

      let poll: any
      try {
        poll = await apiCall(`/api/design-agent/jobs?jobId=${encodeURIComponent(jobId)}&since=${cursor}`, {}, apiKey)
      } catch (error: any) {
        if (attempt === MAX_ATTEMPTS - 1) {
          failed = true
          errorMessage = error?.message || 'Polling failed'
        }
        continue
      }

      const events: any[] = Array.isArray(poll?.events) ? poll.events : []
      for (const event of events) {
        if (event?.type === 'text' && event?.payload?.content) {
          textParts.push(event.payload.content)
        } else if (event?.type === 'plan_propose') {
          if (!approvedJobsRef.current.has(jobId) && poll?.approved !== true) {
            setPendingPlan({
              jobId,
              sessionId,
              title: event?.payload?.title || 'Go-AI execution plan',
              nodes: Array.isArray(event?.payload?.nodes) ? event.payload.nodes : [],
              totalCredits: Number(event?.payload?.total_credits || 0),
              cursor: typeof poll?.cursor === 'number' ? poll.cursor : cursor,
            })
            setActivity(previous => upsertActivity(previous, 'Plan ready for approval', 'running'))
            return
          }
        } else if (event?.type === 'tool_call') {
          const label = String(event?.payload?.name || 'AI tool').replace(/_/g, ' ')
          setActivity(previous => upsertActivity(previous, label, 'running'))
        } else if (event?.type === 'tool_result') {
          const label = String(event?.payload?.name || 'AI tool').replace(/_/g, ' ')
          setActivity(previous => upsertActivity(previous, label, 'done'))
          if (event?.payload?.asset) streamedAssets.push(mapAsset(event.payload.asset))
        } else if (event?.type === 'error' && event?.payload?.message) {
          errorMessage = event.payload.message
          setActivity(previous => upsertActivity(previous, errorMessage, 'error'))
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

    let finalAssets = streamedAssets
    if (!failed) {
      try {
        const response = await apiCall(`/api/design-agent/assets?sessionId=${encodeURIComponent(sessionId)}`, {}, apiKey)
        const list = Array.isArray(response) ? response : (response?.items || [])
        if (list.length) finalAssets = list.map(mapAsset)
      } catch {
        // Keep streamed tool-result assets when the authoritative list is unavailable.
      }
    }

    if (!aliveRef.current) return
    setMessages(previous => [...previous, {
      id: Date.now().toString(),
      role: 'assistant',
      content: failed ? `Error: ${errorMessage || 'Generation failed'}` : (textParts.join('') || (finalAssets.length ? 'Here are your generated assets:' : 'Done.')),
      assets: failed ? [] : finalAssets,
      createdAt: new Date().toISOString(),
    }])
    setActivity(previous => upsertActivity(previous, failed ? 'Generation failed' : 'Generation complete', failed ? 'error' : 'done'))
  }, [apiKey])

  const sendMessage = useCallback(async () => {
    if (!input.trim() && !selectedTemplate && attachments.length === 0) return
    if (!apiKey) { onRequestApiKey?.(); return }

    let project = activeProject
    if (!project) project = await createNewProject()
    if (!project) return

    const attachmentSnapshot = [...attachments]
    const visibleInput = input.trim() || (attachmentSnapshot.length ? 'Use the attached references.' : '')
    const attachmentNote = attachmentSnapshot.length ? `\n\n[Attached ${attachmentSnapshot.map(item => `${item.asset_label} (${item.kind})`).join(', ')}]` : ''
    const brandNote = brandKit.enabled ? `\n\n[Brand Kit — logo: ${brandKit.logo || 'not set'}; colors: ${brandKit.colors || 'not set'}; fonts: ${brandKit.fonts || 'not set'}; tone: ${brandKit.tone || 'not set'}; style: ${brandKit.style || 'not set'}]` : ''
    const agentContent = `${visibleInput}${attachmentNote}${brandNote}\n\n[Mode: ${agentMode}]`.trim()
    const userContent = selectedTemplate ? `[${selectedTemplate.label}] ${visibleInput}` : visibleInput
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      attachments: attachmentSnapshot,
      createdAt: new Date().toISOString(),
    }
    const prior = messages
      .filter(message => message.role === 'user' || message.role === 'assistant')
      .map(message => ({
        role: message.role,
        content: message.content,
        ...(message.attachments?.length ? { attachments: message.attachments } : {}),
      }))

    setMessages(previous => [...previous, userMsg])
    setInput('')
    setAttachments([])
    setSelectedTemplate(null)
    setPendingPlan(null)
    setActivity([{ label: 'Go-AI is planning', status: 'running' }])
    setIsLoading(true)

    try {
      let response: any
      const currentSnapshot = [...prior, { role: 'user', content: agentContent, ...(attachmentSnapshot.length ? { attachments: attachmentSnapshot } : {}) }]
      if (selectedTemplate) {
        response = await apiCall('/api/design-agent/run-skill', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: project.id,
            skill_name: selectedTemplate.id,
            messages_snapshot: currentSnapshot,
          }),
        }, apiKey)
      } else {
        response = await apiCall('/api/design-agent/chat', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: project.id,
            message: agentContent,
            messages_snapshot: currentSnapshot,
          }),
        }, apiKey)
      }

      if (response?.job_id) {
        await pollJob(response.job_id, project.id)
      } else {
        setMessages(previous => [...previous, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response?.message || response?.response || 'Done.',
          createdAt: new Date().toISOString(),
        }])
        setActivity(previous => upsertActivity(previous, 'Generation complete', 'done'))
      }
    } catch (error: any) {
      setMessages(previous => [...previous, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error?.message || 'Request failed'}. Please check your API key.`,
        createdAt: new Date().toISOString(),
      }])
      setActivity(previous => upsertActivity(previous, error?.message || 'Request failed', 'error'))
    } finally {
      setIsLoading(false)
    }
  }, [activeProject, agentMode, apiKey, attachments, brandKit, createNewProject, input, messages, onRequestApiKey, pollJob, selectedTemplate])

  const handlePlanAction = useCallback(async (action: 'approve' | 'reject') => {
    if (!pendingPlan) return
    const plan = pendingPlan
    setIsLoading(true)
    try {
      if (action === 'approve') {
        await apiCall('/api/design-agent/approve', {
          method: 'POST',
          body: JSON.stringify({ jobId: plan.jobId }),
        }, apiKey)
        approvedJobsRef.current.add(plan.jobId)
        setPendingPlan(null)
        setActivity(previous => upsertActivity(previous, 'Plan approved — executing', 'running'))
        await pollJob(plan.jobId, plan.sessionId, plan.cursor)
      } else {
        await apiCall('/api/design-agent/reject', {
          method: 'POST',
          body: JSON.stringify({ jobId: plan.jobId }),
        }, apiKey)
        setPendingPlan(null)
        setActivity(previous => upsertActivity(previous, 'Plan rejected — ready for revisions', 'done'))
        setInput('Revise the plan: ')
      }
    } catch (error: any) {
      setActivity(previous => upsertActivity(previous, error?.message || `Could not ${action} plan`, 'error'))
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, pendingPlan, pollJob])

  const handleAssetAction = useCallback((action: AssetAction, asset: Asset) => {
    if (asset.type !== 'image') return
    setAgentMode('edit')
    setAttachments([{ asset_label: asset.id, url: asset.url, kind: 'image' }])
    const prompts: Record<AssetAction, string> = {
      edit: 'Edit this image: ',
      upscale: 'Upscale this image to the highest practical quality while preserving the original design.',
      'remove-bg': 'Remove the background from this image and return a clean transparent-background result.',
      vectorize: 'Vectorize this image and return a clean scalable logo or illustration result.',
    }
    setInput(prompts[action])
    setSelectedAsset(null)
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(previous => previous.filter(project => project.id !== id))
    if (activeProject?.id === id) {
      setActiveProject(null)
      setMessages([])
      setAttachments([])
      setPendingPlan(null)
      setActivity([])
    }
  }, [activeProject?.id])

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase()
    return query ? TEMPLATES.filter(template => `${template.label} ${template.description}`.toLowerCase().includes(query)) : TEMPLATES
  }, [templateSearch])

  const selectTemplate = useCallback((template: typeof TEMPLATES[number]) => {
    setSelectedTemplate(template)
    setShowTemplates(false)
    setTemplateSearch('')
  }, [])

  const canSend = Boolean(input.trim() || selectedTemplate || attachments.length)

  const referenceInput = (
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      accept="image/*,video/*,audio/*"
      multiple
      onChange={event => {
        void handleAttachmentFiles(event.currentTarget.files)
        event.currentTarget.value = ''
      }}
    />
  )

  const commonModals = (
    <>
      <TemplateModal open={showTemplates} onClose={() => setShowTemplates(false)} search={templateSearch} setSearch={setTemplateSearch} templates={filteredTemplates} onSelect={selectTemplate} />
      <BrandKitModal open={showBrandKit} kit={brandKit} setKit={setBrandKit} onClose={() => setShowBrandKit(false)} />
    </>
  )

  // ── HOME VIEW (preserve the existing SmartVideo Design Agent design) ──────
  if (!activeProject) {
    return (
      <DesignAgentErrorBoundary>
        <div className="flex flex-col h-full" style={appWrapper}>
          {commonModals}
          {referenceInput}

          <div className="flex items-center justify-between px-8 py-4 flex-shrink-0">
            <ModeControls mode={agentMode} setMode={setAgentMode} brandEnabled={brandKit.enabled} openBrandKit={() => setShowBrandKit(true)} />
            <button onClick={() => onRequestApiKey?.()} className="p-2 rounded-full transition-all" style={{ color: apiKey ? 'var(--color-primary)' : semantic.textMuted }} title={apiKey ? 'API key set' : 'Set API key'}><Key size={14} /></button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Design is easier with <span style={{ color: 'var(--color-primary)' }}>Go-AI</span></h1>
              <p className="text-base" style={{ color: semantic.textSecondary }}>The design agent that gets you and gets the job done</p>
            </div>

            <div className="w-full max-w-5xl space-y-2">
              <AttachmentStrip attachments={attachments} uploading={uploading} progress={uploadProgress} activity={activity} onRemove={removeAttachment} />
              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
                <div className="relative">
                  {!input && <div className="absolute top-0 left-0 right-0 text-sm pointer-events-none select-none" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', lineHeight: '1.5' }}>{placeholder}<span className="animate-pulse">|</span></div>}
                  <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() } }} placeholder="" rows={3} className="w-full bg-transparent resize-none outline-none text-sm relative" style={{ color: 'white', caretColor: 'var(--color-primary)', zIndex: 1 }} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading || attachments.length >= MAX_ATTACHMENTS} className="p-1.5 rounded-full transition-all hover:bg-white/10 disabled:opacity-30" style={{ color: semantic.textMuted }} aria-label="Upload reference media"><Plus size={16} /></button>
                  <button onClick={() => setShowTemplates(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}><Sparkles size={11} />Templates<ChevronDown size={11} /></button>
                  {selectedTemplate && <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}><Sparkles size={11} />{selectedTemplate.id}<button onClick={() => setSelectedTemplate(null)}><X size={10} /></button></div>}
                  <span className="text-[10px]" style={{ color: semantic.textMuted }}>{attachments.length}/{MAX_ATTACHMENTS} references</span>
                  <div className="flex-1" />
                  <button onClick={() => void sendMessage()} disabled={!canSend || isLoading} className="p-2 rounded-full transition-all disabled:opacity-30" style={{ color: canSend ? 'var(--color-primary)' : semantic.textMuted }} aria-label="Send message"><Send size={16} /></button>
                </div>
              </div>
            </div>

            <div className="w-full max-w-5xl">
              <h2 className="text-base font-semibold mb-4">Recent Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button onClick={() => void createNewProject()} className="aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-white/20" style={{ border: '1px dashed var(--border-color)', background: 'transparent' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card)' }}><Plus size={16} style={{ color: 'rgba(255,255,255,0.6)' }} /></div>
                  <span className="text-xs" style={{ color: semantic.textSecondary }}>New Project</span>
                </button>
                {projects.slice(0, 8).map(project => (
                  <div key={project.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all hover:border-white/20" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }} onClick={() => { setActiveProject(project); setMessages([]); setActivity([]); setPendingPlan(null) }}>
                    {project.preview ? <img src={project.preview} alt={project.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FolderOpen size={20} style={{ color: semantic.textDisabled }} /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-2">
                      <p className="text-xs font-medium truncate">{project.name}</p>
                      <button onClick={event => { event.stopPropagation(); deleteProject(project.id) }} className="absolute top-2 right-2 p-1 rounded-lg transition-all" style={{ background: 'rgba(0,0,0,0.6)' }} aria-label={`Delete project ${project.name}`}><Trash2 size={11} className="text-red-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DesignAgentErrorBoundary>
    )
  }

  // ── CHAT VIEW ─────────────────────────────────────────────────────────────
  return (
    <DesignAgentErrorBoundary>
      <div className="flex flex-col h-full" style={appWrapper}>
        {commonModals}
        {referenceInput}

        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={() => { setActiveProject(null); setMessages([]); setPendingPlan(null); setActivity([]); setAttachments([]) }} className="text-xs transition-all hover:text-white" style={{ color: semantic.textMuted }}>← Back</button>
          <span className="text-sm font-medium">{activeProject.name}</span>
          <ModeControls mode={agentMode} setMode={setAgentMode} brandEnabled={brandKit.enabled} openBrandKit={() => setShowBrandKit(true)} />
          <div className="flex-1" />
          <button onClick={() => onRequestApiKey?.()} className="p-1.5 rounded-lg transition-all" style={{ color: apiKey ? 'var(--color-primary)' : semantic.textMuted }} aria-label="API Key settings"><Key size={13} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 && !pendingPlan && <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: semantic.textDisabled }}><Sparkles size={32} style={{ color: 'var(--color-primary)', opacity: 0.5 }} /><p className="text-sm">Start your design project</p></div>}
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] space-y-2">
                <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: message.role === 'user' ? 'var(--color-primary)' : 'var(--bg-card)', color: message.role === 'user' ? 'black' : 'white', border: message.role === 'assistant' ? '1px solid var(--border-color)' : 'none' }}>{message.content}</div>
                {message.attachments?.length ? <div className="flex flex-wrap gap-1 justify-end">{message.attachments.map(item => <span key={item.asset_label} className="px-2 py-1 rounded-full text-[10px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: semantic.textSecondary }}>{item.kind === 'video' ? '🎬' : item.kind === 'audio' ? '🎵' : '🖼️'} {item.asset_label}</span>)}</div> : null}
                {message.assets?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {message.assets.map(asset => (
                      <div key={asset.id} className="relative rounded-xl overflow-hidden group cursor-pointer" style={{ border: '1px solid var(--border-color)' }} onClick={() => setSelectedAsset(asset)}>
                        {asset.type === 'image' ? <img src={asset.url} alt={asset.name} className="w-full object-cover" /> : asset.type === 'video' ? <video src={asset.url} controls className="w-full" /> : asset.type === 'audio' ? <div className="p-3 text-xs" style={{ color: semantic.textSecondary }}>🎵 {asset.name}</div> : <div className="p-3 text-xs" style={{ color: semantic.textSecondary }}>{asset.name}</div>}
                        <a href={asset.url} download target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }} onClick={event => event.stopPropagation()}><Download size={12} /></a>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {pendingPlan && <PlanCard plan={pendingPlan} busy={isLoading} onApprove={() => void handlePlanAction('approve')} onReject={() => void handlePlanAction('reject')} />}
          <AttachmentStrip attachments={attachments} uploading={uploading} progress={uploadProgress} activity={activity} onRemove={removeAttachment} />
          {isLoading && !pendingPlan && <div className="flex justify-start"><div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}><Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-primary)' }} /><span className="text-sm" style={{ color: semantic.textMuted }}>Go-AI is working...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
            <div className="relative">
              {!input && <div className="absolute top-0 left-0 right-0 text-sm pointer-events-none select-none" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', lineHeight: '1.5' }}>{placeholder}<span className="animate-pulse">|</span></div>}
              <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() } }} placeholder="" rows={2} className="w-full bg-transparent resize-none outline-none text-sm relative" style={{ color: 'white', caretColor: 'var(--color-primary)', zIndex: 1 }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading || attachments.length >= MAX_ATTACHMENTS} className="p-1.5 rounded-full transition-all hover:bg-white/10 disabled:opacity-30" style={{ color: semantic.textMuted }} aria-label="Upload reference media"><Plus size={16} /></button>
              <button onClick={() => setShowTemplates(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}><Sparkles size={11} />Templates<ChevronDown size={11} /></button>
              {selectedTemplate && <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}><Sparkles size={11} />{selectedTemplate.id}<button onClick={() => setSelectedTemplate(null)}><X size={10} /></button></div>}
              <span className="text-[10px]" style={{ color: semantic.textMuted }}>{attachments.length}/{MAX_ATTACHMENTS} references</span>
              <div className="flex-1" />
              <button onClick={() => void sendMessage()} disabled={!canSend || isLoading || Boolean(pendingPlan)} className="p-2 rounded-full transition-all disabled:opacity-30" style={{ color: canSend ? 'var(--color-primary)' : semantic.textMuted }} aria-label="Send message"><Send size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {selectedAsset && <AssetModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} onAction={handleAssetAction} />}
    </DesignAgentErrorBoundary>
  )
}
