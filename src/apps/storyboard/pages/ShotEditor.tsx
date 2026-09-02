"use client";

import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  generateShot,
  pollStoryboardResult,
  extractStoryboardAsset,
} from '@/api/storyboard'
import { PublishStep } from '@/components/SocialPublishProvider'
import { AssistStep } from '@/components/AiAssistantProvider'
import { useStoryboard } from '../StoryboardContext'
import ModelSelector from '../ModelSelector'

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: shot.id })
  const [showCamera, setShowCamera] = useState(false)
  const [genning, setGenning] = useState(false)
  const [frameError, setFrameError] = useState<string | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    ...panels.card,
  }

  const shotChars = (shot.characterIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as StoryboardCharacter[]

  const cameraSummary = [shot.camera?.shotType, shot.camera?.angle, shot.camera?.movement]
    .filter(Boolean)
    .join(' · ')

  const handleGenerateFrame = async () => {
    if (!shot.scene.trim()) return
    setGenning(true)
    setFrameError(null)
    try {
      const prompt = withCharacters(buildShotPrompt(shot.scene, shot.camera), shotChars)
      const charImages = shotChars.map((c) => c.referenceImageUrl).filter(Boolean) as string[]
      const url = await generateShotFrame({
        prompt,
        aspect_ratio: aspectRatio,
        model: frameModel,
        ...(charImages.length ? { images_list: charImages } : {}),
      })
      onUpdate(shot.id, { frameUrl: url })
    } catch (err: unknown) {
      setFrameError(err instanceof Error ? err.message : 'Frame generation failed')
    } finally {
      setGenning(false)
    }
  }

  const toggleChar = (id: string) => {
    const cur = shot.characterIds || []
    const next = cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]
    onUpdate(shot.id, { characterIds: next })
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 rounded-xl p-3">
      <button
        {...attributes}
        {...listeners}
        className="p-1 mt-0.5 rounded-lg cursor-grab active:cursor-grabbing touch-none"
        style={buttons.ghost}
        title="Drag to reorder"
        aria-label="Drag to reorder scene"
      >
        <GripVertical size={14} />
      </button>

      {/* Frame preview / placeholder */}
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ ...panels.glass, width: 72, height: aspectRatio === '16:9' ? 40 : 72 }}
      >
        {shot.frameUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.frameUrl} alt={`frame ${index + 1}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{index + 1}</span>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <textarea
          value={shot.scene}
          onChange={(e) => onUpdate(shot.id, { scene: e.target.value })}
          className="w-full h-20 rounded-xl p-2 text-sm resize-none outline-none"
          style={{ ...panels.card, color: 'white' }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={shot.duration}
            onChange={(e) => onUpdate(shot.id, { duration: Number(e.target.value) })}
            className="w-20 rounded-xl p-1.5 text-sm outline-none"
            style={{ ...panels.card, color: 'white' }}
          />
          <span className="text-xs" style={{ color: semantic.textMuted }}>seconds</span>

          <button
            onClick={handleGenerateFrame}
            disabled={genning || !shot.scene.trim()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all disabled:opacity-50"
            style={buttons.ghost}
            title="Generate a still frame for this shot"
          >
            {genning ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            {shot.frameUrl ? 'Regenerate' : 'Frame'}
          </button>

          <button
            onClick={() => setShowCamera((v) => !v)}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
            style={buttons.ghost}
          >
            {showCamera ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Camera{cameraSummary ? `: ${cameraSummary}` : ''}
          </button>
        </div>

        {characters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Users size={12} style={{ color: semantic.textMuted }} />
            {characters.map((c) => {
              const on = (shot.characterIds || []).includes(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => toggleChar(c.id)}
                  className="text-[11px] px-2 py-0.5 rounded-full transition-all"
                  style={on ? buttons.activePill : buttons.ghost}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        )}

        {frameError && (
          <p className="text-[11px]" style={{ color: semantic.error }}>{frameError}</p>
        )}

        {showCamera && (
          <div className="pt-1">
            <CameraControls value={shot.camera} onChange={(camera) => onUpdate(shot.id, { camera })} />
            {shot.camera && Object.values(shot.camera).some(Boolean) && (
              <p className="mt-2 text-[11px] leading-snug" style={{ color: semantic.textMuted }}>
                <span style={{ color: semantic.textLabel }}>Prompt preview: </span>
                {withCharacters(buildShotPrompt(shot.scene, shot.camera), shotChars)}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(shot.id)}
        className="p-1.5 rounded-lg transition-all"
        style={buttons.ghost}
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

  return (
    <div className="flex flex-col h-full" style={appWrapper}>
      <div className="flex-shrink-0 h-12 flex items-center gap-3 px-6 z-10" style={panels.subHeader}>
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg transition-all"
          style={buttons.ghost}
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-semibold tracking-tight">Shot Editor</span>
        {projectName && <span className="text-xs" style={{ color: semantic.textMuted }}>— {projectName}</span>}
        <div className="ml-auto">
          <ModelSelector value={model} onChange={setModel} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6">
          <div className="rounded-xl p-6 mb-6 space-y-4" style={panels.glass}>
            <h3 className="text-sm font-semibold">Add a Scene</h3>
            <textarea
              value={sceneDraft}
              onChange={(e) => setSceneDraft(e.target.value)}
              placeholder="Describe the visual composition of this scene..."
              className="w-full h-24 rounded-xl p-3 text-sm resize-none outline-none"
              style={{ ...panels.card, color: 'white' }}
            />
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>DURATION (S)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={durationDraft}
                  onChange={(e) => setDurationDraft(Number(e.target.value))}
                  className="w-24 rounded-xl p-2 text-sm outline-none"
                  style={{ ...panels.card, color: 'white' }}
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!sceneDraft.trim()}
                className="py-2 px-4 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                style={buttons.primary}
              >
                <Plus size={16} /> Add Scene
              </button>
            </div>
          </div>

          {shots.length === 0 ? (
            <div className="rounded-xl p-6 text-sm" style={{ ...panels.glass, color: semantic.textMuted }}>
              No scenes yet. Add scenes here or from the Composer to build your storyboard.
            </div>
          ) : (
            <Fragment>
              <p className="text-xs mb-3" style={{ color: semantic.textMuted }}>
                Drag <GripVertical size={12} className="inline" /> to reorder. Generate a still frame per shot, set camera specs, and tag characters.
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={shots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
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
                 <p className="text-sm text-muted mb-3">{shot.description}</p>
                {shot.status === 'generating' && (
                  <div className="aspect-video bg-[var(--bg-card)] rounded-xl flex items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-primary" />
                  </div>
                )}
                {shot.status === 'done' && shot.assetUrl && (
                  <div className="relative">
                    <img
                      src={shot.assetUrl}
                      alt={shot.description}
                      className="w-full aspect-video object-cover rounded-xl"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <PublishStep
                        mediaUrl={shot.assetUrl}
                        mediaType="image"
                        title={shot.description?.substring(0, 50) || 'Storyboard shot'}
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center"
                      />
                      <AssistStep
                        assetUrl={shot.assetUrl}
                        assetType="image"
                        onApply={() => {}}
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                        </svg>
                      </AssistStep>
                    </div>
                  </div>
                )}
                {shot.status === 'error' && (
                  <div className="aspect-video bg-[var(--bg-card)] rounded-xl flex items-center justify-center text-sm text-red-300 p-4 text-center">
                    {shot.error}
                  </div>
                )}
                {shot.status === 'idle' && (
                  <div className="aspect-video bg-[var(--bg-card)] rounded-xl" />
                )}
              </DndContext>
            </Fragment>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}
