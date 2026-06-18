import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  FilePlus2,
  Loader2,
  Presentation,
  Trash2,
  Clock,
} from 'lucide-react'
import { usePresentationStore } from '@/apps/presentation/state/presentationStore'
import {
  fetchPresentations,
  createPresentationDraft,
  deletePresentation,
  savePresentation,
} from '@/apps/presentation/api/presentations'
import type { PresentationMetadata } from '@/apps/presentation/state/presentationStore'
import ModelPicker from '@/apps/presentation/components/ModelPicker'

const LANGUAGES = [
  ['en-US', 'English'],
  ['pt', 'Portuguese'],
  ['es', 'Spanish'],
  ['fr', 'French'],
  ['de', 'German'],
  ['it', 'Italian'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['zh', 'Chinese'],
  ['ru', 'Russian'],
  ['hi', 'Hindi'],
  ['ar', 'Arabic'],
] as const

function formatRelative(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function PresentationDashboard() {
  const navigate = useNavigate()
  const store = usePresentationStore()
  const [presentations, setPresentations] = useState<PresentationMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchPresentations()
      .then((data) => {
        if (!cancelled) setPresentations(data.items)
      })
      .catch(() => {
        if (!cancelled) setPresentations([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreate = async () => {
    if (!store.title.trim()) return
    setIsCreating(true)
    try {
      store.resetPresentation()
      const draft = createPresentationDraft(store.title)
      draft.language = store.language
      draft.model = store.model
      const saved = await savePresentation(draft)
      store.loadPresentation(saved)
      navigate(`/presentation/outline/${saved.id}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleBlank = async () => {
    setIsCreating(true)
    try {
      store.resetPresentation()
      const draft = createPresentationDraft(store.title || 'Blank Presentation')
      draft.language = store.language
      draft.model = store.model
      const saved = await savePresentation(draft)
      store.loadPresentation(saved)
      navigate(`/presentation/edit/${saved.id}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this presentation?')) return
    try {
      await deletePresentation(id)
      setPresentations((prev) => prev.filter((p) => p.id !== id))
    } catch {
      store.setError('Failed to delete presentation')
    }
  }

  const handleContinue = (presentation: PresentationMetadata) => {
    store.loadPresentation(presentation)
    navigate(`/presentation/edit/${presentation.id}`)
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Presentation Studio</h1>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass p-6 rounded-xl space-y-5">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <Sparkles className="text-primary" size={24} />
              Create a presentation
            </div>

            <textarea
              value={store.title}
              onChange={(e) => store.setTitle(e.target.value)}
              placeholder="Describe the presentation you want to build..."
              className="w-full h-36 bg-bg-card border border-border-color rounded-xl p-3 resize-none outline-none"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ModelPicker
                value={store.model}
                onChange={store.setModel}
                disabled={isCreating}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-secondary">
                  Language
                </label>
                <select
                  value={store.language}
                  onChange={(e) => store.setLanguage(e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-bg-card border border-border-color rounded-xl p-2 text-sm outline-none"
                >
                  {LANGUAGES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreate}
                disabled={isCreating || !store.title.trim()}
                className="px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                Generate outline
              </button>
              <button
                onClick={handleBlank}
                disabled={isCreating}
                className="px-5 py-2.5 bg-bg-card rounded-xl hover:bg-border-color transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <FilePlus2 size={18} />
                Blank presentation
              </button>
            </div>
          </div>

          <div className="glass p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <Presentation className="text-primary" size={22} />
              Recent presentations
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-secondary">
                <Loader2 size={16} className="animate-spin" />
                Loading presentations...
              </div>
            ) : presentations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-color p-6 text-sm text-secondary text-center">
                No presentations yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {presentations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleContinue(item)}
                    className="w-full flex items-start gap-3 rounded-xl border border-border-color p-3 text-left hover:bg-bg-card transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.title || 'Untitled Presentation'}
                      </div>
                      <div className="text-xs text-secondary flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {formatRelative(item.updatedAt)}
                        <span className="mx-1">·</span>
                        {item.slides.length} slides
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1.5 rounded-lg text-secondary opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                      aria-label="Delete presentation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
