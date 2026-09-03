"use client";

import { useState, Fragment } from 'react'
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
} from 'lucide-react'

function SortableShot({
  shot,
  index,
  aspectRatio,
  characters,
  frameModel,
  onUpdate,
  onRemove,
}: {
  shot: StoryboardShot
  index: number
  aspectRatio: '16:9' | '9:16'
  characters: StoryboardCharacter[]
  frameModel: string
  onUpdate: (id: string, patch: Partial<StoryboardShot>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: shot.id || `shot-${index}` })
  const [showCamera, setShowCamera] = useState(false)
  const [genning, setGenning] = useState(false)
  const [frameError, setFrameError] = useState<string | null>(null)

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
      const url = await generateShotFrame({
        prompt,
        aspect_ratio: aspectRatio,
        model: frameModel,
        ...(charImages.length ? { images_list: charImages } : {}),
      })
      onUpdate(shot.id || `shot-${index}`, { frameUrl: url })
    } catch (err: unknown) {
      setFrameError(err instanceof Error ? err.message : 'Frame generation failed')
    } finally {
      setGenning(false)
    }
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.frameUrl} alt={`frame ${index + 1}`} className="w-full h-full object-cover" />
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

          {shots.length === 0 ? (
            <div className="rounded-xl p-6 text-sm" style={{ ...glassStyle, color: textMuted }}>
              No scenes yet. Add scenes here or from the Composer to build your storyboard.
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
