import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, RefreshCw, ImageIcon } from 'lucide-react'
import {
  generateShot,
  pollStoryboardResult,
  extractStoryboardAsset,
} from '@/api/storyboard'
import { useStoryboard } from '../StoryboardContext'

interface Shot {
  id: string
  camera: string
  angle: string
  description: string
  status: 'idle' | 'generating' | 'done' | 'error'
  assetUrl: string | null
  error?: string
}

const CAMERA_OPTIONS = ['Wide Shot', 'Close-up', 'Medium', 'Over Shoulder']
const ANGLE_OPTIONS = ['Eye Level', 'High Angle', 'Low Angle', 'Dutch Angle']

export default function ShotEditor() {
  const { sceneId } = useParams()
  const navigate = useNavigate()
  const { episodeId, characterIds, projectName } = useStoryboard()

  const [camera, setCamera] = useState(CAMERA_OPTIONS[0])
  const [angle, setAngle] = useState(ANGLE_OPTIONS[0])
  const [description, setDescription] = useState('')
  const [shots, setShots] = useState<Shot[]>([])

  const targetEpisode = sceneId || episodeId

  const runGeneration = async (shot: Shot) => {
    if (!targetEpisode || !shot.description.trim()) return
    setShots((prev) =>
      prev.map((s) => (s.id === shot.id ? { ...s, status: 'generating', error: undefined } : s))
    )
    try {
      const res = await generateShot(targetEpisode, {
        camera: shot.camera,
        angle: shot.angle,
        description: shot.description,
        character_ids: characterIds,
      })
      const requestId = res.request_id
      if (!requestId) throw new Error('No request_id returned from shot generation')
      const result = await pollStoryboardResult(requestId)
      const url = extractStoryboardAsset(result)
      setShots((prev) =>
        prev.map((s) =>
          s.id === shot.id ? { ...s, status: 'done', assetUrl: url } : s
        )
      )
    } catch (err: any) {
      setShots((prev) =>
        prev.map((s) =>
          s.id === shot.id ? { ...s, status: 'error', error: err?.message || 'Generation failed' } : s
        )
      )
    }
  }

  const handleAddShot = () => {
    if (!description.trim()) return
    const shot: Shot = {
      id: `shot-${Date.now()}`,
      camera,
      angle,
      description: description.trim(),
      status: 'idle',
      assetUrl: null,
    }
    setShots((prev) => [...prev, shot])
    setDescription('')
    runGeneration(shot)
  }

  if (!targetEpisode) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/storyboard')}
              className="p-2 rounded-xl hover:bg-[var(--bg-card)] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Shot Editor</h1>
          </div>
          <div className="glass p-6 rounded-xl text-muted">
            No episode loaded. Create a project and episode in the Planner first, then open the Shot Editor from there.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/storyboard')}
            className="p-2 rounded-xl hover:bg-[var(--bg-card)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Shot Editor</h1>
          {projectName && <span className="text-sm text-muted">- {projectName}</span>}
        </div>

        <div className="glass p-6 rounded-xl mb-6">
          <h3 className="font-semibold mb-3">Add a Shot</h3>
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-3">
              <select
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
              >
                {CAMERA_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
              >
                {ANGLE_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the visual composition of this shot..."
                className="w-full h-24 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
              />
              <button
                onClick={handleAddShot}
                disabled={!description.trim()}
                className="w-full py-2 bg-primary text-black rounded-xl font-medium hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Generate Shot
              </button>
            </div>
          </div>
        </div>

        {shots.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            {shots.map((shot) => (
              <div key={shot.id} className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {shot.camera} · {shot.angle}
                  </span>
                  <div className="flex items-center gap-2">
                    {shot.status === 'generating' && (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    )}
                    <button
                      onClick={() => runGeneration(shot)}
                      disabled={shot.status === 'generating'}
                      className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-color)] transition-all disabled:opacity-50"
                      title="Regenerate"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted mb-3">{shot.description}</p>
                {shot.status === 'generating' && (
                  <div className="aspect-video bg-[var(--bg-card)] rounded-xl flex items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-primary" />
                  </div>
                )}
                {shot.status === 'done' && shot.assetUrl && (
                  <img
                    src={shot.assetUrl}
                    alt={shot.description}
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                )}
                {shot.status === 'error' && (
                  <div className="aspect-video bg-[var(--bg-card)] rounded-xl flex items-center justify-center text-sm text-red-300 p-4 text-center">
                    {shot.error}
                  </div>
                )}
                {shot.status === 'idle' && (
                  <div className="aspect-video bg-[var(--bg-card)] rounded-xl" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
