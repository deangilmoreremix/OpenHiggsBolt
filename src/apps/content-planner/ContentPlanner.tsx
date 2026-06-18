import { useState } from 'react'
import { CalendarDays, Plus, Trash2, Edit3, Check, X, Sparkles } from 'lucide-react'
import { generateText } from '@/api/muapi'

type Plan = {
  id: string
  title: string
  description: string
  platform: string
  scheduledDate: string
  status: 'idea' | 'drafting' | 'scheduled' | 'published'
  createdAt: string
}

const STORAGE_KEY = 'content-planner-plans'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'pink' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'gray' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: 'red' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦', color: 'blue' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'sky' },
  { id: 'facebook', label: 'Facebook', icon: '👤', color: 'blue' },
]

const STATUSES: { id: Plan['status']; label: string; color: string }[] = [
  { id: 'idea', label: 'Idea', color: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'drafting', label: 'Drafting', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-purple-500/20 text-purple-400' },
  { id: 'published', label: 'Published', color: 'bg-green-500/20 text-green-400' },
]

function loadPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Plan[]) : []
  } catch {
    return []
  }
}

function savePlans(plans: Plan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
  } catch {
    // ignore
  }
}

function emptyDraft(): Omit<Plan, 'id' | 'createdAt'> {
  return {
    title: '',
    description: '',
    platform: 'instagram',
    scheduledDate: new Date().toISOString().slice(0, 10),
    status: 'idea',
  }
}

export default function ContentPlanner() {
  const [plans, setPlans] = useState<Plan[]>(loadPlans)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<Plan, 'id' | 'createdAt'>>(emptyDraft())
  const [filter, setFilter] = useState<'all' | Plan['status']>('all')
  const [isGenerating, setIsGenerating] = useState(false)

  const persist = (next: Plan[]) => {
    setPlans(next)
    savePlans(next)
  }

  const startAdd = () => {
    setDraft(emptyDraft())
    setIsAdding(true)
  }

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id)
    setDraft({
      title: plan.title,
      description: plan.description,
      platform: plan.platform,
      scheduledDate: plan.scheduledDate,
      status: plan.status,
    })
  }

  const cancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setDraft(emptyDraft())
  }

  const save = () => {
    if (!draft.title.trim()) {
      alert('Please add a title for the plan.')
      return
    }
    if (editingId) {
      const next = plans.map((p) => (p.id === editingId ? { ...p, ...draft } : p))
      persist(next)
    } else {
      const next: Plan[] = [
        { id: String(Date.now()), createdAt: new Date().toISOString(), ...draft },
        ...plans,
      ]
      persist(next)
    }
    cancel()
  }

  const remove = (id: string) => {
    if (!confirm('Delete this plan?')) return
    persist(plans.filter((p) => p.id !== id))
  }

  const generateIdeas = async () => {
    setIsGenerating(true)
    try {
      const result = await generateText({
        prompt: 'Suggest 5 short social media post ideas for a creative AI tools company. Format: one per line, prefix each with "- ".',
        systemPrompt: 'You are a social media strategist. Output only the list.',
      })
      const text = (result as any).text ?? ''
      const ideas = text
        .split('\n')
        .map((l: string) => l.replace(/^[-*\d.)\s]+/, '').trim())
        .filter((l: string) => l.length > 4)
        .slice(0, 5)
      if (ideas.length > 0) {
        setDraft({ ...draft, title: ideas[0], description: ideas.slice(0, 3).join(' • ') })
      } else {
        alert('No ideas generated. Try again.')
      }
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const filtered = filter === 'all' ? plans : plans.filter((p) => p.status === filter)
  const platformFor = (id: string) => PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0]
  const statusFor = (id: Plan['status']) => STATUSES.find((s) => s.id === id) ?? STATUSES[0]

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays size={24} className="text-primary" />
            Content Planner
          </h1>
          <p className="text-secondary mt-1">Plan, draft, and schedule your content across platforms</p>
        </div>
        <button
          onClick={startAdd}
          className="px-4 py-2 bg-primary text-black rounded-lg font-medium flex items-center gap-2 hover:bg-primary-hover transition-all"
        >
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            filter === 'all' ? 'bg-primary/20 text-primary' : 'text-secondary hover:bg-bg-card'
          }`}
        >
          All ({plans.length})
        </button>
        {STATUSES.map((s) => {
          const count = plans.filter((p) => p.status === s.id).length
          return (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filter === s.id ? 'bg-primary/20 text-primary' : 'text-secondary hover:bg-bg-card'
              }`}
            >
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {(isAdding || editingId) && (
        <div className="glass-panel rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-white">{editingId ? 'Edit Plan' : 'New Plan'}</h3>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Launch teaser for VFX Studio"
              className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              placeholder="What is this content about? Key points, hook, CTA..."
              className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none resize-none"
            />
            <button
              onClick={generateIdeas}
              disabled={isGenerating}
              className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles size={12} /> {isGenerating ? 'Generating…' : 'Suggest ideas with AI'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Platform</label>
              <select
                value={draft.platform}
                onChange={(e) => setDraft({ ...draft, platform: e.target.value })}
                className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Scheduled Date</label>
              <input
                type="date"
                value={draft.scheduledDate}
                onChange={(e) => setDraft({ ...draft, scheduledDate: e.target.value })}
                className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Plan['status'] })}
                className="w-full bg-bg-card border border-border-color rounded-lg p-2.5 text-white text-sm focus:border-primary/50 focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 text-sm flex items-center gap-1.5 transition-all"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={save}
              className="px-4 py-2 rounded-lg bg-primary text-black hover:bg-primary-hover text-sm font-medium flex items-center gap-1.5 transition-all"
            >
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !isAdding ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <CalendarDays size={48} className="text-muted mx-auto mb-4" />
          <p className="text-secondary">No plans yet. Click "New Plan" to start building your content calendar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plan) => {
            const platform = platformFor(plan.platform)
            const status = statusFor(plan.status)
            return (
              <div key={plan.id} className="glass-panel rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white line-clamp-2">{plan.title}</h3>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(plan)}
                      className="p-1.5 rounded text-muted hover:text-white hover:bg-white/5 transition-all"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => remove(plan.id)}
                      className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-white/5 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {plan.description && (
                  <p className="text-sm text-secondary line-clamp-3">{plan.description}</p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-secondary">
                    {platform.icon} {platform.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                </div>
                <div className="text-xs text-muted">
                  {new Date(plan.scheduledDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
