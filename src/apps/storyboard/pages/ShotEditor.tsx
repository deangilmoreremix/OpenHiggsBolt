"use client";

import { useEffect, useRef, useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { generateShotFrame } from '@/api/storyboard'
import { generateOpenAiPanel, listOpenAiStoryboardModels, type OpenAiStoryboardModel } from '@/api/storyboardOpenAI'
import { saveUploadedFile } from 'studio/src/lib/assetStore.js'
import { exportGif } from '../exportUtils'
import { PublishStep } from '@/components/SocialPublishProvider'
import { useStoryboard, type StoryboardShot, type StoryboardCharacter } from '../StoryboardContext'
import CameraControls from '../CameraControls'
import { buildShotPrompt, withCharacters } from '../cameraTaxonomy'
import ModelSelector from '../ModelSelector'
import {
  GripVertical,
  Loader2,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  Users,
  Trash2,
  ArrowLeft,
  Plus,
  Wand2,
  Film,
  Upload,
} from 'lucide-react'

/** Which service draws the panels. OpenAI uses the user's own OpenAI key (Settings). */
type FrameEngine = { provider: 'muapi' | 'openai'; model: string; quality: 'low' | 'medium' | 'high' }
const ENGINE_KEY = 'storyboard_frame_engine_v1'
const DEFAULT_ENGINE: FrameEngine = { provider: 'muapi', model: '', quality: 'medium' }
const MAX_SKETCH_BYTES = 2.5 * 1024 * 1024
/** Matches MAX_REFERENCES in app/api/storyboard/openai/route.ts. */
const MAX_REFERENCE_IMAGES = 4

function loadEngine(): FrameEngine {
  try {
    const raw = JSON.parse(localStorage.getItem(ENGINE_KEY) || 'null')
    if (raw && (raw.provider === 'openai' || raw.provider === 'muapi')) {
      return { provider: raw.provider, model: typeof raw.model === 'string' ? raw.model : '', quality: ['low', 'medium', 'high'].includes(raw.quality) ? raw.quality : 'medium' }
    }
  } catch {
    // no saved choice
  }
  return DEFAULT_ENGINE
}

function dataUrlToFile(dataUrl: string, name: string): File | null {
  const m = /^data:([^;,]+);base64,(.*)$/.exec(dataUrl)
  if (!m) return null
  const bin = atob(m[2])
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], name, { type: m[1] })
}

/** A panel as OpenAI returns it is a multi-megabyte data URL: keep a hosted copy instead when we can (it is
 *  what gets saved with the project and sent back for edits), and fall back to the data URL when we can't. */
async function keepPanel(url: string, name: string): Promise<string> {
  if (!url.startsWith('data:')) return url
  const file = dataUrlToFile(url, name)
  const saved = file ? await saveUploadedFile(file) : null
  return saved?.url || url
}

function SortableShot({
  shot,
  index,
  aspectRatio,
  characters,
  frameModel,
  engine,
  onUpdate,
  onRemove,
}: {
  shot: StoryboardShot
  index: number
  aspectRatio: '16:9' | '9:16'
  characters: StoryboardCharacter[]
  frameModel: string
  engine: FrameEngine
  onUpdate: (id: string, patch: Partial<StoryboardShot>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: shot.id || `shot-${index}` })
  const [showCamera, setShowCamera] = useState(false)
  const [genning, setGenning] = useState(false)
  const [frameError, setFrameError] = useState<string | null>(null)
  const [sketch, setSketch] = useState<string | null>(null) // a rough drawing that guides the panel (not saved)
  const [editText, setEditText] = useState('')
  const [editing, setEditing] = useState(false)
  const sketchInputRef = useRef<HTMLInputElement>(null)
  const openai = engine.provider === 'openai'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const shotChars = (shot.characterIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is StoryboardCharacter => c !== undefined)

  const cameraSummary = [shot.camera?.shotType, shot.camera?.angle, shot.camera?.movement]
    .filter(Boolean)
    .join(' · ')

  const handleGenerateFrame = async () => {
    if (!shot.scene.trim()) return
    setGenning(true)
    setFrameError(null)
    try {
      const prompt = withCharacters(buildShotPrompt(shot.scene, shot.camera), shotChars)
      const charImages = shotChars.map((c) => c.referenceImageUrl).filter((url): url is string => typeof url === 'string')
      let url: string
      if (openai) {
        // Characters are reused by name: each tagged character's saved reference image goes along, and the
        // prompt says which image is who, so the same character looks the same across panels.
        const refs: string[] = []
        const lines: string[] = []
        const addRef = (src: string, describe: (n: number) => string) => {
          // The route sends each distinct image once and at most MAX_REFERENCE_IMAGES: number what is really sent.
          let n = refs.indexOf(src) + 1
          if (n === 0) {
            if (refs.length >= MAX_REFERENCE_IMAGES) return
            refs.push(src)
            n = refs.length
          }
          lines.push(describe(n))
        }
        if (sketch) addRef(sketch, () => 'The first reference image is a rough sketch: follow its composition.')
        for (const c of shotChars) {
          if (c.referenceImageUrl) addRef(c.referenceImageUrl, (n) => `Reference image ${n} shows ${c.name}: keep ${c.name} looking exactly like it.`)
        }
        const raw = await generateOpenAiPanel({
          prompt: [prompt, ...lines].join('\n'),
          aspect_ratio: aspectRatio,
          model: engine.model || undefined,
          quality: engine.quality,
          ...(refs.length ? { reference_urls: refs } : {}),
        })
        url = await keepPanel(raw, `storyboard-shot-${index + 1}.png`)
      } else {
        url = await generateShotFrame({
          prompt,
          aspect_ratio: aspectRatio,
          model: frameModel,
          ...(charImages.length ? { images_list: charImages } : {}),
        })
      }
      onUpdate(shot.id || `shot-${index}`, { frameUrl: url })
    } catch (err: unknown) {
      setFrameError(err instanceof Error ? err.message : 'Frame generation failed')
    } finally {
      setGenning(false)
    }
  }

  /** Change the current panel in place (OpenAI only): "make it night", "add a lighthouse", ... */
  const editInFlight = useRef(false)
  const handleEditFrame = async () => {
    if (!shot.frameUrl || !editText.trim() || editInFlight.current) return
    editInFlight.current = true
    setEditing(true)
    setFrameError(null)
    try {
      const raw = await generateOpenAiPanel({
        prompt: editText.trim(),
        aspect_ratio: aspectRatio,
        model: engine.model || undefined,
        quality: engine.quality,
        image_url: shot.frameUrl,
      })
      onUpdate(shot.id || `shot-${index}`, { frameUrl: await keepPanel(raw, `storyboard-shot-${index + 1}-edit.png`) })
      setEditText('')
    } catch (err: unknown) {
      setFrameError(err instanceof Error ? err.message : 'Frame edit failed')
    } finally {
      editInFlight.current = false
      setEditing(false)
    }
  }

  const handleSketch = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setFrameError('Pick an image file for the sketch.')
    if (file.size > MAX_SKETCH_BYTES) return setFrameError('That sketch is too large (2.5 MB at most).')
    const reader = new FileReader()
    reader.onload = () => setSketch(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const toggleChar = (id: string) => {
    const cur = shot.characterIds || []
    const next = cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]
    onUpdate(shot.id || `shot-${index}`, { characterIds: next })
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
  }

  const glassStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
  }

  const ghostStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'rgba(255,255,255,0.6)',
  }

  const activePillStyle: React.CSSProperties = {
    background: 'rgba(34,211,238,0.15)',
    border: '1px solid rgba(34,211,238,0.3)',
    color: '#22d3ee',
  }

  const textMuted = 'rgba(255,255,255,0.4)'
  const textLabel = 'rgba(255,255,255,0.6)'
  const errorColor = '#f87171'

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 rounded-xl p-3">
      <button
        {...attributes}
        {...listeners}
        className="p-1 mt-0.5 rounded-lg cursor-grab active:cursor-grabbing touch-none"
        style={ghostStyle}
        title="Drag to reorder"
        aria-label="Drag to reorder scene"
      >
        <GripVertical size={14} />
      </button>

      {/* Frame preview / placeholder */}
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ ...glassStyle, width: 72, height: aspectRatio === '16:9' ? 40 : 72 }}
      >
        {shot.frameUrl ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.frameUrl} alt={`frame ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
              <PublishStep
                mediaUrl={shot.frameUrl}
                mediaType="image"
                title={"Shot " + (index + 1)}
                className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
              />
            </div>
          </div>
        ) : (
          <span className="text-sm font-bold" style={{ color: '#22d3ee' }}>{index + 1}</span>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <textarea
          value={shot.scene}
          onChange={(e) => onUpdate(shot.id || `shot-${index}`, { scene: e.target.value })}
          className="w-full h-20 rounded-xl p-2 text-sm resize-none outline-none"
          style={{ ...cardStyle, color: 'white' }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={shot.duration || 0}
            onChange={(e) => onUpdate(shot.id || `shot-${index}`, { duration: Number(e.target.value) })}
            className="w-20 rounded-xl p-1.5 text-sm outline-none"
            style={{ ...cardStyle, color: 'white' }}
          />
          <span className="text-xs" style={{ color: textMuted }}>seconds</span>

          <button
            onClick={handleGenerateFrame}
            disabled={genning || !shot.scene.trim()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all disabled:opacity-50"
            style={ghostStyle}
            title="Generate a still frame for this shot"
          >
            {genning ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            {shot.frameUrl ? 'Regenerate' : 'Frame'}
          </button>

          {openai && (
            <>
              <input ref={sketchInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleSketch(e.target.files?.[0]); e.target.value = '' }} />
              <button
                onClick={() => (sketch ? setSketch(null) : sketchInputRef.current?.click())}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                style={sketch ? activePillStyle : ghostStyle}
                title={sketch ? 'Remove the sketch' : 'Upload a rough sketch or reference image to guide the composition'}
              >
                <Upload size={13} />
                {sketch ? 'Sketch added ×' : 'Sketch'}
              </button>
            </>
          )}

          <button
            onClick={() => setShowCamera((v) => !v)}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
            style={ghostStyle}
          >
            {showCamera ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Camera{cameraSummary ? `: ${cameraSummary}` : ''}
          </button>
        </div>

        {characters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Users size={12} style={{ color: textMuted }} />
            {characters.map((c) => {
              const on = (shot.characterIds || []).includes(c.id || '')
              return (
                <button
                  key={c.id}
                  onClick={() => c.id && toggleChar(c.id)}
                  className="text-[11px] px-2 py-0.5 rounded-full transition-all"
                  style={on ? activePillStyle : ghostStyle}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        )}

        {openai && shot.frameUrl && (
          <div className="flex items-center gap-2">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEditFrame() }}
              placeholder="Change this frame: make it night, add a lighthouse..."
              className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs outline-none"
              style={{ ...cardStyle, color: 'white' }}
            />
            <button
              onClick={handleEditFrame}
              disabled={editing || !editText.trim()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all disabled:opacity-50"
              style={activePillStyle}
              title="Edit this frame with the OpenAI image model"
            >
              {editing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              Edit
            </button>
          </div>
        )}

        {frameError && (
          <p className="text-[11px]" style={{ color: errorColor }}>{frameError}</p>
        )}

        {showCamera && (
          <div className="pt-1">
            <CameraControls value={shot.camera} onChange={(camera) => onUpdate(shot.id || `shot-${index}`, { camera })} />
            {shot.camera && Object.values(shot.camera).some(Boolean) && (
              <p className="mt-2 text-[11px] leading-snug" style={{ color: textMuted }}>
                <span style={{ color: textLabel }}>Prompt preview: </span>
                {withCharacters(buildShotPrompt(shot.scene, shot.camera), shotChars)}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(shot.id || `shot-${index}`)}
        className="p-1.5 rounded-lg transition-all"
        style={ghostStyle}
        title="Remove scene"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function ShotEditor() {
  const navigate = useNavigate()
  const { shots, addShot, updateShot, removeShot, moveShot, characters, aspectRatio, projectName, model, setModel } = useStoryboard()

  const [sceneDraft, setSceneDraft] = useState('')
  const [durationDraft, setDurationDraft] = useState(3)
  const [engine, setEngine] = useState<FrameEngine>(DEFAULT_ENGINE)
  const [openAiModels, setOpenAiModels] = useState<OpenAiStoryboardModel[]>([])
  const [gifBusy, setGifBusy] = useState(false)
  const [gifError, setGifError] = useState<string | null>(null)
  const [gifSeconds, setGifSeconds] = useState(0) // 0 = each shot's own length

  useEffect(() => setEngine(loadEngine()), [])
  useEffect(() => {
    try { localStorage.setItem(ENGINE_KEY, JSON.stringify(engine)) } catch { /* private mode */ }
  }, [engine])
  useEffect(() => {
    if (engine.provider !== 'openai' || openAiModels.length) return
    let cancelled = false
    listOpenAiStoryboardModels().then(({ models, default: def }) => {
      if (cancelled) return
      setOpenAiModels(models)
      setEngine((e) => (e.model && models.some((m) => m.id === e.model) ? e : { ...e, model: def }))
    })
    return () => { cancelled = true }
  }, [engine.provider, openAiModels.length])

  const framedShots = shots.filter((s) => s.frameUrl).length
  const handleExportGif = async () => {
    setGifBusy(true)
    setGifError(null)
    try {
      await exportGif(shots, aspectRatio, projectName, gifSeconds > 0 ? { frameMs: gifSeconds * 1000 } : {})
    } catch (err: unknown) {
      setGifError(err instanceof Error ? err.message : 'Could not build the GIF')
    } finally {
      setGifBusy(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleAdd = () => {
    if (!sceneDraft.trim()) return
    addShot(sceneDraft.trim(), durationDraft)
    setSceneDraft('')
    setDurationDraft(3)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = shots.findIndex((s) => s.id === active.id)
    const newIndex = shots.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    void arrayMove(shots, oldIndex, newIndex)
    moveShot(oldIndex, newIndex)
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
  }

  const glassStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
  }

  const ghostStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'rgba(255,255,255,0.6)',
  }

  const primaryStyle: React.CSSProperties = {
    background: 'linear-gradient(to right, #22d3ee, #a855f7)',
    color: 'black',
    border: 'none',
  }

  const activePillStyle: React.CSSProperties = {
    background: 'rgba(34,211,238,0.15)',
    border: '1px solid rgba(34,211,238,0.3)',
    color: '#22d3ee',
  }

  const textMuted = 'rgba(255,255,255,0.4)'
  const textLabel = 'rgba(255,255,255,0.6)'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 h-12 flex items-center gap-3 px-6 z-10" style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg transition-all"
          style={ghostStyle}
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-semibold tracking-tight">Shot Editor</span>
        {projectName && <span className="text-xs" style={{ color: textMuted }}>— {projectName}</span>}
        <div className="ml-auto">
          <ModelSelector value={model} onChange={setModel} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6">
          <div className="rounded-xl p-6 mb-6 space-y-4" style={glassStyle}>
            <h3 className="text-sm font-semibold">Add a Scene</h3>
            <textarea
              value={sceneDraft}
              onChange={(e) => setSceneDraft(e.target.value)}
              placeholder="Describe the visual composition of this scene..."
              className="w-full h-24 rounded-xl p-3 text-sm resize-none outline-none"
              style={{ ...cardStyle, color: 'white' }}
            />
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: textLabel }}>DURATION (S)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={durationDraft}
                  onChange={(e) => setDurationDraft(Number(e.target.value))}
                  className="w-24 rounded-xl p-2 text-sm outline-none"
                  style={{ ...cardStyle, color: 'white' }}
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!sceneDraft.trim()}
                className="py-2 px-4 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                style={primaryStyle}
              >
                <Plus size={16} /> Add Scene
              </button>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-6 space-y-3" style={glassStyle}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: textLabel }}>FRAME ENGINE</span>
              {(['muapi', 'openai'] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => setEngine((e) => ({ ...e, provider }))}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={engine.provider === provider ? activePillStyle : ghostStyle}
                  aria-pressed={engine.provider === provider}
                >
                  {provider === 'muapi' ? 'MuAPI' : 'OpenAI Images'}
                </button>
              ))}
              {engine.provider === 'openai' && (
                <>
                  <select
                    aria-label="OpenAI image model"
                    value={engine.model}
                    onChange={(e) => setEngine((en) => ({ ...en, model: e.target.value }))}
                    className="rounded-lg px-2 py-1 text-xs outline-none"
                    style={{ ...cardStyle, color: 'white' }}
                  >
                    {openAiModels.map((m) => <option key={m.id} value={m.id} style={{ color: 'black' }}>{m.label}</option>)}
                  </select>
                  <select
                    aria-label="Panel detail"
                    value={engine.quality}
                    onChange={(e) => setEngine((en) => ({ ...en, quality: e.target.value as FrameEngine['quality'] }))}
                    className="rounded-lg px-2 py-1 text-xs outline-none"
                    style={{ ...cardStyle, color: 'white' }}
                  >
                    <option value="low" style={{ color: 'black' }}>Low detail (fastest)</option>
                    <option value="medium" style={{ color: 'black' }}>Medium detail</option>
                    <option value="high" style={{ color: 'black' }}>High detail</option>
                  </select>
                </>
              )}
            </div>
            {engine.provider === 'openai' && (
              <p className="text-[11px]" style={{ color: textMuted }}>
                Uses your own OpenAI key from Settings. Flare is quick for trying ideas, Sunburst is better for scenes with many details. Tag characters on a scene to keep them looking the same; add a sketch to steer the layout.
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: textLabel }}>ANIMATED GIF</span>
              <label className="text-xs flex items-center gap-1" style={{ color: textMuted }}>
                seconds per frame
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={gifSeconds}
                  onChange={(e) => setGifSeconds(Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 rounded-lg px-2 py-1 text-xs outline-none"
                  style={{ ...cardStyle, color: 'white' }}
                  title="0 uses each shot's own length"
                />
              </label>
              <button
                onClick={handleExportGif}
                disabled={gifBusy || framedShots === 0}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-50"
                style={activePillStyle}
                title={framedShots === 0 ? 'Generate at least one frame first' : `Download ${framedShots} frame${framedShots === 1 ? '' : 's'} as a looping GIF`}
              >
                {gifBusy ? <Loader2 size={13} className="animate-spin" /> : <Film size={13} />}
                Export GIF{framedShots ? ` (${framedShots})` : ''}
              </button>
              {gifError && <span className="text-[11px]" style={{ color: '#f87171' }}>{gifError}</span>}
            </div>
          </div>

          {shots.length === 0 ? (
            <div className="rounded-xl p-6 text-sm" style={{ ...glassStyle, color: textMuted }}>
              No scenes yet. Add scenes here or from the Storyboard page to build your storyboard.
            </div>
          ) : (
            <Fragment>
              <p className="text-xs mb-3" style={{ color: textMuted }}>
                Drag <GripVertical size={12} className="inline" /> to reorder. Generate a still frame per shot, set camera specs, and tag characters.
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={shots.map((s) => s.id || '').filter((id): id is string => id !== '')} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {shots.map((s, i) => (
                       <SortableShot
                        key={s.id}
                        shot={s}
                        index={i}
                        aspectRatio={aspectRatio}
                        characters={characters}
                        frameModel={model}
                        engine={engine}
                        onUpdate={updateShot}
                        onRemove={removeShot}
                      />
                    ))}
                   </div>
                </SortableContext>
              </DndContext>
            </Fragment>
          )}
          </div>
        </div>
      </div>
  )
}
