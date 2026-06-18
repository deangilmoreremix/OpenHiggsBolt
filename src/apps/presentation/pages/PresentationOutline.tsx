import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ArrowRight, RefreshCw, Wand2 } from 'lucide-react'
import { usePresentationStore } from '@/apps/presentation/state/presentationStore'
import { fetchPresentation, savePresentation } from '@/apps/presentation/api/presentations'
import { generateOutline, generateSlideContent } from '@/apps/presentation/api/generation'
import { parseOutline } from '@/apps/presentation/lib/parser'
import { getThemeById } from '@/apps/presentation/lib/themes'
import OutlineList from '@/apps/presentation/components/OutlineList'
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

export default function PresentationOutline() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const store = usePresentationStore()
  const [isLoading, setIsLoading] = useState(true)
  const [numSlides, setNumSlides] = useState(5)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setIsLoading(true)
    fetchPresentation(id)
      .then((presentation) => {
        if (cancelled) return
        if (!presentation) {
          store.setError('Presentation not found')
          navigate('/presentation')
          return
        }
        store.loadPresentation(presentation)
        setNumSlides(Math.max(1, presentation.slides.length || 5))
      })
      .catch(() => {
        if (!cancelled) store.setError('Failed to load presentation')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, navigate, store])

  const handleGenerateOutline = useCallback(async () => {
    if (!store.title.trim() || !id) return
    store.setGeneratingOutline(true)
    store.setError(null)
    try {
      const items = await generateOutline(store.title, numSlides, store.language, store.model)
      store.setOutline(items)
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Outline generation failed')
    } finally {
      store.setGeneratingOutline(false)
    }
  }, [store.title, numSlides, store.language, store.model, id, store])

  const handleGenerateSlides = useCallback(async () => {
    if (!id || store.outline.length === 0) return
    store.setGeneratingSlides(true)
    store.setError(null)
    try {
      const theme = getThemeById(store.theme)
      const slides = await Promise.all(
        store.outline.map((title) =>
          generateSlideContent(store.title, title, store.language, theme.description, store.model),
        ),
      )
      store.setSlides(slides)
      const updated = await savePresentation({
        id,
        title: store.title,
        slides,
        theme: store.theme,
        language: store.language,
        model: store.model,
        createdAt: store.lastSavedAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      store.setLastSavedAt(new Date(updated.updatedAt))
      navigate(`/presentation/edit/${id}`)
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Slide generation failed')
    } finally {
      store.setGeneratingSlides(false)
    }
  }, [id, store, navigate])

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Outline</h1>
          <div className="text-sm text-secondary">
            {store.outline.length > 0 ? `${store.outline.length} cards` : 'No outline yet'}
          </div>
        </div>

        {store.error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200">
            {store.error}
          </div>
        )}

        <div className="glass p-6 rounded-xl space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Presentation title</label>
            <input
              type="text"
              value={store.title}
              onChange={(e) => store.setTitle(e.target.value)}
              className="w-full bg-bg-card border border-border-color rounded-xl p-3 outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Slides</label>
              <input
                type="number"
                min={1}
                max={30}
                value={numSlides}
                onChange={(e) => setNumSlides(Math.max(1, Number(e.target.value)))}
                className="w-full bg-bg-card border border-border-color rounded-xl p-2 text-sm outline-none"
              />
            </div>

            <ModelPicker value={store.model} onChange={store.setModel} />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Language</label>
              <select
                value={store.language}
                onChange={(e) => store.setLanguage(e.target.value)}
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

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Prompt</label>
            <textarea
              value={store.title}
              onChange={(e) => store.setTitle(e.target.value)}
              placeholder="Describe your presentation topic..."
              className="w-full h-32 bg-bg-card border border-border-color rounded-xl p-3 resize-none outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerateOutline}
              disabled={store.isGeneratingOutline || !store.title.trim()}
              className="px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {store.isGeneratingOutline ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              Generate outline
            </button>

            <button
              onClick={handleGenerateSlides}
              disabled={store.isGeneratingSlides || store.outline.length === 0}
              className="px-5 py-2.5 bg-bg-card rounded-xl hover:bg-border-color transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {store.isGeneratingSlides ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Wand2 size={18} />
              )}
              Generate slides
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="glass p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">Edit outline</h2>
          <OutlineList
            items={store.outline}
            onChange={store.setOutline}
            disabled={store.isGeneratingOutline || store.isGeneratingSlides}
          />
        </div>
      </div>
    </div>
  )
}
