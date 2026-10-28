import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Film, Clapperboard, BarChart3, Wand2, FileJson, FileText, AlertCircle, AlertTriangle } from 'lucide-react'
import { generateStoryboard } from '@/api/storyboard'
import { useStoryboard, type StoryboardCharacter } from '../StoryboardContext'
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider'
import { panels, buttons, semantic } from '@/shared/styles/designTokens'
import { buildShotPrompt, withCharacters } from '../cameraTaxonomy'
import CharacterLibrary from '../CharacterLibrary'
import SendToMenu from '../SendToMenu'
import ProjectBar from '../ProjectBar'
import { exportJson, exportPdf } from '../exportUtils'

// The storyboard video endpoint only accepts 5s or 10s clips.
const CLIP_LENGTHS = [5, 10] as const

/** Split a free-form brief into one scene per paragraph (or sentence, if it's a single paragraph). */
function splitBrief(brief: string): string[] {
  const paragraphs = brief.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean)
  if (paragraphs.length > 1) return paragraphs
  return (brief.match(/[^.!?]+[.!?]*/g) || []).map((p) => p.trim()).filter(Boolean)
}

function DurationWarning({ total, clipLength, onFit }: { total: number; clipLength: number; onFit: () => void }) {
  const diff = total - clipLength
  return (
    <div
      className="flex items-center gap-2 flex-wrap rounded-xl p-3 text-xs"
      style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
      role="status"
    >
      <AlertTriangle size={14} className="flex-shrink-0" />
      <span className="flex-1">
        Scenes add up to {total.toFixed(1)}s, {Math.abs(diff).toFixed(1)}s {diff > 0 ? 'over' : 'under'} the {clipLength}s
        clip. Scenes may be cut short or stretched.
      </span>
      <button onClick={onFit} className="py-1 px-2.5 rounded-lg transition-all" style={buttons.ghost}>
        Fit to {clipLength}s
      </button>
    </div>
  )
}

export default function StoryboardPlanner() {
  const navigate = useNavigate()
  const { requireEntitlement } = useSmartVideoAccess()
  const {
    projectName,
    setProjectName,
    brief,
    setBrief,
    shots,
    addShot,
    updateShot,
    characters,
    aspectRatio,
    setAspectRatio,
    episodeDuration,
    setEpisodeDuration,
    result,
    setResult,
  } = useStoryboard()

  const [sceneDraft, setSceneDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clipLength: 5 | 10 = episodeDuration === 5 ? 5 : 10
  const totalShotSeconds = shots.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
  const durationMismatch = shots.length > 0 && Math.abs(totalShotSeconds - clipLength) > 0.05
  const inputStyle = { ...panels.card, color: 'white' as const }

  /**
   * Scale every scene's duration so they add up to the clip length. Works in
   * half-second units: each scene gets at least one, and the rest are shared
   * by weight (largest remainder), so the total is exact whenever it can be.
   */
  const handleFitDurations = () => {
    if (shots.length === 0) return
    const weights = shots.map((s) => Number(s.duration) || 1)
    const weightSum = weights.reduce((a, b) => a + b, 0)
    const spare = Math.max(0, clipLength * 2 - shots.length)
    const shares = weights.map((w) => (w / weightSum) * spare)
    const units = shares.map((x) => 1 + Math.floor(x))
    let left = spare - shares.reduce((sum, x) => sum + Math.floor(x), 0)
    shares
      .map((x, i) => ({ i, rem: x - Math.floor(x) }))
      .sort((a, b) => b.rem - a.rem)
      .forEach(({ i }) => {
        if (left > 0) { units[i] += 1; left -= 1 }
      })
    shots.forEach((s, i) => s.id && updateShot(s.id, { duration: units[i] / 2 }))
  }

  const handleSplitBrief = () => {
    const scenes = splitBrief(brief)
    if (scenes.length === 0) return
    const perShot = Math.max(1, Math.round((clipLength / scenes.length) * 2) / 2)
    scenes.forEach((scene) => addShot(scene, perShot))
  }

  const handleAddScene = () => {
    if (!sceneDraft.trim()) return
    addShot(sceneDraft.trim(), 3)
    setSceneDraft('')
  }

  const handleGenerate = () => {
    if (shots.length === 0) return
    requireEntitlement(
      ENTITLEMENTS.SMARTVIDEO_GO,
      async () => {
        setIsGenerating(true)
        setError(null)
        setStatus('Submitting…')
        try {
          const charById = new Map(characters.map((c) => [c.id, c]))
          const compiled = shots
            .filter((s) => s.scene.trim())
            .map((s) => {
              const chars = (s.characterIds || []).map((id) => charById.get(id)).filter((c): c is StoryboardCharacter => c !== undefined)
              return {
                scene: withCharacters(buildShotPrompt(s.scene, s.camera), chars),
                duration: Number(s.duration) || 1,
              }
            })
          const referenceImage = characters.find((c) => c.referenceImageUrl)?.referenceImageUrl
          const url = await generateStoryboard(
            {
              shots: compiled,
              duration: clipLength,
              aspect_ratio: aspectRatio,
              ...(referenceImage ? { images_list: [referenceImage] } : {}),
            },
            (s) => setStatus(s === 'queued' ? 'Queued…' : 'Rendering storyboard…')
          )
          setResult({ url })
          setStatus(null)
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Storyboard generation failed')
          setStatus(null)
        } finally {
          setIsGenerating(false)
        }
      },
      () => setError('An active plan is required to generate storyboards.')
    )
  }

  const exportProject = { projectName, shots, characters, aspectRatio, episodeDuration: clipLength }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 h-12 flex items-center gap-3 px-6 z-10" style={panels.subHeader}>
        <Clapperboard size={16} style={{ color: 'var(--color-primary)' }} />
        <span className="text-sm font-semibold tracking-tight">Storyboard</span>
        {projectName && <span className="text-xs truncate" style={{ color: semantic.textMuted }}>— {projectName}</span>}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => exportJson({ project: exportProject })}
            disabled={shots.length === 0}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50"
            style={buttons.ghost}
            title="Export as JSON"
          >
            <FileJson size={14} /> JSON
          </button>
          <button
            onClick={() => exportPdf({ id: 'current', ...exportProject })}
            disabled={shots.length === 0}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50"
            style={buttons.ghost}
            title="Export as PDF"
          >
            <FileText size={14} /> PDF
          </button>
          <SendToMenu disabled={isGenerating} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Project switching and page navigation are locked while generating, so the
              planner stays mounted and the result can't land in a different project. */}
          <fieldset disabled={isGenerating} className={isGenerating ? 'opacity-60' : ''}>
            <ProjectBar />
          </fieldset>

          {error && (
            <div className="rounded-xl p-4 flex items-start gap-2 text-sm border border-red-500/40 text-red-300" style={panels.glass}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <section className="rounded-xl p-6 space-y-4" style={panels.glass}>
            <h2 className="text-sm font-semibold">1. Project & Creative Brief</h2>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>PROJECT NAME</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Animated Series"
                className="w-full rounded-xl p-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>CREATIVE BRIEF</label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe the story beat by beat — one line per scene works best."
                className="w-full h-32 rounded-xl p-3 text-sm resize-none outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex items-end gap-6 flex-wrap">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>ASPECT RATIO</label>
                <div className="flex gap-1">
                  {(['16:9', '9:16'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className="py-1.5 px-3 rounded-lg text-xs transition-all"
                      style={aspectRatio === r ? buttons.activePill : buttons.inactivePill}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: semantic.textLabel }}>CLIP LENGTH</label>
                <div className="flex gap-1">
                  {CLIP_LENGTHS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setEpisodeDuration(d)}
                      className="py-1.5 px-3 rounded-lg text-xs transition-all"
                      style={clipLength === d ? buttons.activePill : buttons.inactivePill}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSplitBrief}
                disabled={!brief.trim()}
                className="ml-auto flex items-center gap-2 py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-50"
                style={buttons.ghost}
                title="Create one scene per line/sentence of the brief"
              >
                <Wand2 size={15} /> Brief → scenes
              </button>
            </div>
          </section>

          <CharacterLibrary />

          <section className="rounded-xl p-6 space-y-4" style={panels.glass}>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold">2. Scenes ({shots.length})</h2>
              <span className="text-xs" style={{ color: durationMismatch ? '#fbbf24' : semantic.textMuted }}>
                {totalShotSeconds.toFixed(1)}s of shots / {clipLength}s clip
              </span>
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => navigate('/shots/current')}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50"
                  style={buttons.ghost}
                >
                  <Film size={14} /> Shot Editor
                </button>
                <button
                  onClick={() => navigate('/analysis/current')}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50"
                  style={buttons.ghost}
                >
                  <BarChart3 size={14} /> Analysis
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={sceneDraft}
                onChange={(e) => setSceneDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddScene()}
                placeholder="Quick-add a scene…"
                className="flex-1 rounded-xl p-2 text-sm outline-none"
                style={inputStyle}
              />
              <button
                onClick={handleAddScene}
                disabled={!sceneDraft.trim()}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-50"
                style={buttons.ghost}
              >
                <Plus size={15} /> Add
              </button>
            </div>

            {durationMismatch && <DurationWarning total={totalShotSeconds} clipLength={clipLength} onFit={handleFitDurations} />}

            {shots.length === 0 ? (
              <p className="text-sm" style={{ color: semantic.textMuted }}>
                No scenes yet. Add one above, split your brief, or open the Shot Editor for camera and frame controls.
              </p>
            ) : (
              <ol className="space-y-2">
                {shots.map((s, i) => (
                  <li key={s.id} className="flex items-start gap-3 rounded-xl p-3" style={panels.card}>
                    {s.frameUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.frameUrl} alt={`frame ${i + 1}`} className="w-16 h-10 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-16 text-center text-sm font-bold flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                        {i + 1}
                      </span>
                    )}
                    <span className="text-sm flex-1">{s.scene}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: semantic.textMuted }}>{s.duration}s</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-xl p-6 space-y-4" style={panels.glass}>
            <h2 className="text-sm font-semibold">3. Generate Storyboard Video</h2>
            {durationMismatch && <DurationWarning total={totalShotSeconds} clipLength={clipLength} onFit={handleFitDurations} />}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || shots.length === 0}
              className="w-full py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={buttons.primary}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {status || 'Generating…'}
                </>
              ) : (
                <>
                  <Clapperboard size={18} />
                  {result?.url ? 'Regenerate Storyboard' : 'Generate Storyboard'}
                </>
              )}
            </button>
            {result?.url && (
              <video
                key={result.url}
                src={result.url}
                controls
                className={`w-full rounded-xl bg-black ${aspectRatio === '9:16' ? 'max-h-[70vh] object-contain' : ''}`}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
