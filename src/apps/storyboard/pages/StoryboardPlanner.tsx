import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Film, Trash2, Download, Upload, Camera, FileText, Users } from 'lucide-react'
import {
  generateStoryboard,
  pollStoryboardResult,
  extractStoryboardAsset,
  type GenerateStoryboardPayload,
} from '@/api/storyboard'
import { useStoryboard } from '../StoryboardContext'
import { buildShotPrompt, withCharacters, type CameraSpec } from '../cameraTaxonomy'
import CameraControls from '../CameraControls'
import CharacterLibrary from '../CharacterLibrary'
import ProjectBar from '../ProjectBar'
import SendToMenu from '../SendToMenu'
import { exportJson, exportPdf } from '../exportUtils'
import { panels, buttons, semantic, appWrapper } from '@/shared/styles/designTokens'

export default function StoryboardPlanner() {
  const navigate = useNavigate()
  const {
    projectName,
    setProjectName,
    shots,
    addShot,
    removeShot,
    characters,
    aspectRatio,
    setAspectRatio,
    episodeDuration,
    setEpisodeDuration,
    result,
    setResult,
    exportProject,
    importProject,
  } = useStoryboard()

  const [sceneDraft, setSceneDraft] = useState('')
  const [durationDraft, setDurationDraft] = useState(3)
  const [cameraDraft, setCameraDraft] = useState<CameraSpec>({})
  const [charDraft, setCharDraft] = useState<string[]>([])
  const [showCameraDraft, setShowCameraDraft] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showCharacters, setShowCharacters] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'generating' | 'polling' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(result?.url ?? null)

  const draftHasCamera = Object.values(cameraDraft).some(Boolean)

  const charsForShot = (ids?: string[]) =>
    (ids || []).map((id) => characters.find((c) => c.id === id)).filter(Boolean) as {
      name: string
      description?: string
    }[]

  const handleAddShot = () => {
    if (!sceneDraft.trim()) return
    addShot(sceneDraft.trim(), durationDraft, draftHasCamera ? cameraDraft : undefined, charDraft)
    setSceneDraft('')
    setDurationDraft(3)
    setCameraDraft({})
    setCharDraft([])
    setShowCameraDraft(false)
  }

  const handleExportJson = () => {
    try {
      exportJson(exportProject())
      setNotice('Project exported as JSON.')
    } catch {
      setError('Failed to export project.')
    }
  }

  const handleExportPdf = () => {
    try {
      exportPdf(exportProject().project)
      setNotice('Opened printable storyboard (Save as PDF).')
    } catch {
      setError('Failed to export PDF.')
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const ok = importProject(data)
      if (ok) {
        const importedUrl = data?.project?.result?.url ?? data?.result?.url ?? null
        setVideoUrl(importedUrl)
        setNotice('Project imported as a new project.')
        setError(null)
      } else {
        setError('Invalid storyboard file.')
      }
    } catch {
      setError('Could not read storyboard file.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (shots.length === 0) {
      setError('Add at least one scene before generating.')
      return
    }
    setIsGenerating(true)
    setError(null)
    setNotice(null)
    setStatus('generating')
    try {
      const payload: GenerateStoryboardPayload = {
        shots: shots.map((s) => ({
          scene: withCharacters(buildShotPrompt(s.scene, s.camera), charsForShot(s.characterIds)),
          duration: s.duration,
        })),
        duration: episodeDuration,
        aspect_ratio: aspectRatio,
      }
      // Prefer explicit reference URL, otherwise use character reference images.
      const charImages = characters.map((c) => c.referenceImageUrl).filter(Boolean) as string[]
      if (imageUrl.trim()) payload.images_list = [imageUrl.trim()]
      else if (charImages.length) payload.images_list = charImages.slice(0, 1)

      const { request_id } = await generateStoryboard(payload)
      setStatus('polling')
      const finalResult = await pollStoryboardResult(request_id)
      const url = extractStoryboardAsset(finalResult) || finalResult.url || null
      if (!url) throw new Error('Generation completed but no video was returned.')
      setVideoUrl(url)
      setResult({ requestId: request_id, url, status: 'completed' })
      setStatus('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Storyboard generation failed')
      setStatus('error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={appWrapper}>
      {/* Sub-header — matches other studios */}
      <div className="flex-shrink-0 h-12 flex items-center justify-between px-6 z-10" style={panels.subHeader}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <Film size={13} className="text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Storyboard Composer</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-primary)' }}>
            sora-2-pro-storyboard
          </span>
        </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all"
              style={buttons.ghost}
              title="Import a storyboard .json file"
            >
              <Upload size={14} /> Import
            </button>
            <SendToMenu />
            <button
              onClick={handleExportJson}
              disabled={shots.length === 0 && !projectName}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50"
              style={buttons.ghost}
              title="Export this project as .json"
            >
              <Download size={14} /> JSON
            </button>
          <button
            onClick={handleExportPdf}
            disabled={shots.length === 0}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50"
            style={buttons.ghost}
            title="Export a printable PDF storyboard"
          >
            <FileText size={14} /> PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto p-6">
          <ProjectBar />

          <p className="text-sm mb-6" style={{ color: semantic.textSecondary }}>
            Build a sequence of scenes, then generate a cohesive multi-scene video with Sora 2 Pro Storyboard.
          </p>

          {error && (
            <div className="p-4 rounded-xl mb-6 text-sm" style={{ background: semantic.errorBg, border: `1px solid ${semantic.errorBorder}`, color: semantic.error }}>
              {error}
            </div>
          )}
          {notice && (
            <div className="p-3 rounded-xl mb-6 text-sm" style={{ background: semantic.successBg, color: semantic.success }}>
              {notice}
            </div>
          )}

          <div className="rounded-xl p-6 mb-6 space-y-6" style={panels.glass}>
            <section>
              <label className="block text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>PROJECT NAME</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Animated Series"
                className="w-full rounded-xl p-2 text-sm outline-none"
                style={{ ...panels.card, color: 'white' }}
              />
            </section>

            <section>
              <h2 className="text-sm font-semibold mb-3">Scenes ({shots.length})</h2>

              <div className="space-y-3">
                <textarea
                  value={sceneDraft}
                  onChange={(e) => setSceneDraft(e.target.value)}
                  placeholder="Describe this scene — setting, characters, action, mood..."
                  className="w-full h-24 rounded-xl p-3 text-sm resize-none outline-none"
                  style={{ ...panels.card, color: 'white' }}
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowCameraDraft((v) => !v)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                    style={showCameraDraft || draftHasCamera ? buttons.activePill : buttons.ghost}
                  >
                    <Camera size={13} /> Camera specs {draftHasCamera ? '(set)' : '(optional)'}
                  </button>
                  {characters.length > 0 &&
                    characters.map((c) => {
                      const on = charDraft.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          onClick={() =>
                            setCharDraft((prev) => (on ? prev.filter((id) => id !== c.id) : [...prev, c.id]))
                          }
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          style={on ? buttons.activePill : buttons.ghost}
                        >
                          <Users size={12} /> {c.name}
                        </button>
                      )
                    })}
                </div>

                {showCameraDraft && (
                  <div className="rounded-xl p-3" style={panels.card}>
                    <CameraControls value={cameraDraft} onChange={setCameraDraft} />
                  </div>
                )}

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
                    onClick={handleAddShot}
                    disabled={!sceneDraft.trim()}
                    className="py-2 px-4 font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                    style={buttons.primary}
                  >
                    <Plus size={16} /> Add Scene
                  </button>
                </div>
              </div>

              {shots.length > 0 && (
                <div className="mt-4 space-y-2">
                  {shots.map((s, i) => {
                    const cam = [s.camera?.shotType, s.camera?.angle, s.camera?.movement].filter(Boolean).join(' · ')
                    const chars = charsForShot(s.characterIds).map((c) => c.name).join(', ')
                    return (
                      <div key={s.id} className="flex items-start gap-3 rounded-xl p-3" style={panels.card}>
                        {s.frameUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.frameUrl} alt={`frame ${i + 1}`} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <span className="text-sm font-bold mt-0.5 w-6" style={{ color: 'var(--color-primary)' }}>{i + 1}</span>
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{s.scene}</p>
                          <p className="text-xs mt-1" style={{ color: semantic.textMuted }}>
                            {s.duration}s{cam ? ` · ${cam}` : ''}{chars ? ` · 👤 ${chars}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => removeShot(s.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={buttons.ghost}
                          title="Remove scene"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>EPISODE LENGTH</label>
                <select
                  value={episodeDuration}
                  onChange={(e) => setEpisodeDuration(Number(e.target.value))}
                  className="w-full rounded-xl p-2 text-sm outline-none"
                  style={{ ...panels.card, color: 'white' }}
                >
                  <option value={10}>10s</option>
                  <option value={15}>15s</option>
                  <option value={25}>25s</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>ASPECT RATIO</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                  className="w-full rounded-xl p-2 text-sm outline-none"
                  style={{ ...panels.card, color: 'white' }}
                >
                  <option value="9:16">9:16 (vertical)</option>
                  <option value="16:9">16:9 (landscape)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>REFERENCE IMAGE URL (OPTIONAL)</label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl p-2 text-sm outline-none"
                  style={{ ...panels.card, color: 'white' }}
                />
              </div>
            </section>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || shots.length === 0}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={buttons.primary}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {status === 'polling' ? 'Generating storyboard…' : 'Submitting…'}
                </>
              ) : (
                <>
                  <Film size={18} /> Generate Storyboard
                </>
              )}
            </button>
          </div>

          {/* Characters */}
          <div className="mb-6">
            <button
              onClick={() => setShowCharacters((v) => !v)}
              className="flex items-center gap-2 text-sm mb-3 px-3 py-2 rounded-lg transition-all"
              style={showCharacters ? buttons.activePill : buttons.ghost}
            >
              <Users size={15} /> {showCharacters ? 'Hide' : 'Manage'} Characters ({characters.length})
            </button>
            {showCharacters && <CharacterLibrary />}
          </div>

          {videoUrl && (
            <div className="rounded-xl p-6" style={panels.glass}>
              <h2 className="text-sm font-semibold mb-4">Generated Storyboard</h2>
              <video src={videoUrl} controls className="w-full rounded-xl bg-black" />
            </div>
          )}

          {shots.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div
                className="p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                style={panels.glass}
                onClick={() => navigate('/shots')}
              >
                <h3 className="text-sm font-medium">Shot Editor</h3>
                <p className="text-xs mt-1" style={{ color: semantic.textMuted }}>Reorder scenes, set camera specs, generate frames</p>
              </div>
              <div
                className="p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                style={panels.glass}
                onClick={() => navigate('/analysis')}
              >
                <h3 className="text-sm font-medium">Scene Analysis</h3>
                <p className="text-xs mt-1" style={{ color: semantic.textMuted }}>Review your project context</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
