import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, CheckCircle2 } from 'lucide-react'
import {
  createProject,
  createCharacter,
  createEpisode,
  StoryboardCharacter,
  StoryboardEpisode,
} from '@/api/storyboard'
import { useStoryboard } from '../StoryboardContext'
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider'

export default function StoryboardPlanner() {
  const navigate = useNavigate()
  const { requireEntitlement } = useSmartVideoAccess();
  const { setProject, addCharacter, setEpisode, projectId } = useStoryboard()

  const [projectName, setProjectName] = useState('')
  const [brief, setBrief] = useState('')
  const [style, setStyle] = useState('cinematic, photorealistic')

  const [charName, setCharName] = useState('')
  const [charTraits, setCharTraits] = useState('')
  const [charOutfit, setCharOutfit] = useState('')
  const [charRefs, setCharRefs] = useState('')

  const [episodeTitle, setEpisodeTitle] = useState('')
  const [episodeSummary, setEpisodeSummary] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState<'idle' | 'project' | 'character' | 'episode' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ projectId?: string; characterId?: string; episodeId?: string }>({})

  const handleCreateProject = async () => {
    if (!projectName.trim() || !brief.trim()) return
    requireEntitlement(
      ENTITLEMENTS.SMARTVIDEO_GO,
      async () => {
        setIsGenerating(true)
        setError(null)
        try {
          const res = await createProject({
            name: projectName.trim(),
            brief: brief.trim(),
            style: style.trim(),
          })
          const id = res.id || res.data?.id || res.project?.id
          if (!id) throw new Error('No project id returned from API')
          setCreated((c) => ({ ...c, projectId: id }))
          setProject({ projectId: id, projectName: projectName.trim(), brief: brief.trim() })
          setStep('project')
        } catch (err: any) {
          setError(err?.message || 'Failed to create project')
        } finally {
          setIsGenerating(false)
        }
      }
    )
  }

  const handleCreateCharacter = async () => {
    if (!charName.trim() || !created.projectId) return
    const projectId = created.projectId;
    requireEntitlement(
      ENTITLEMENTS.SMARTVIDEO_GO,
      async () => {
        setIsGenerating(true)
        setError(null)
        try {
          const payload: StoryboardCharacter = {
            name: charName.trim(),
            traits: charTraits.trim(),
            outfit: charOutfit.trim(),
          }
          const refs = charRefs
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
          if (refs.length) payload.reference_images = refs
          const res = await createCharacter(projectId, payload)
          const id = res.id || res.data?.id || res.character?.id
          if (!id) throw new Error('No character id returned from API')
          setCreated((c) => ({ ...c, characterId: id }))
          addCharacter(id)
          setStep('character')
        } catch (err: any) {
          setError(err?.message || 'Failed to create character')
        } finally {
          setIsGenerating(false)
        }
      },
      () => {
        setError('Payment required to create storyboard characters')
      }
    )
  }

  const handleCreateEpisode = async () => {
    if (!episodeTitle.trim() || !created.projectId) return
    const projectId = created.projectId;
    requireEntitlement(
      ENTITLEMENTS.SMARTVIDEO_GO,
      async () => {
        setIsGenerating(true)
        setError(null)
        try {
          const payload: StoryboardEpisode = {
            title: episodeTitle.trim(),
            summary: episodeSummary.trim(),
            project_id: projectId,
          }
          const res = await createEpisode(projectId, payload)
          const id = res.id || res.data?.id || res.episode?.id
          if (!id) throw new Error('No episode id returned from API')
          setCreated((c) => ({ ...c, episodeId: id }))
          setEpisode(id)
          setStep('done')
        } catch (err: any) {
          setError(err?.message || 'Failed to create episode')
        } finally {
          setIsGenerating(false)
        }
      },
      () => {
        setError('Payment required to create storyboard episodes')
      }
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Storyboard Planner</h1>

        {error && (
          <div className="glass p-4 rounded-xl mb-6 border border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        <div className="glass p-6 rounded-xl mb-6 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">1. Project & Creative Brief</h2>
              {step !== 'idle' && <CheckCircle2 size={18} className="text-primary" />}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Animated Series"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Creative Brief</label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe the story, tone, and what you want to achieve..."
                  className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Visual Style</label>
                <input
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="cinematic, photorealistic"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              <button
                onClick={handleCreateProject}
                disabled={isGenerating || !projectName.trim() || !brief.trim()}
                className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating && step === 'idle' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </section>

          <section className={created.projectId ? '' : 'opacity-40 pointer-events-none'}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">2. Character Definition</h2>
              {(step === 'character' || step === 'done') && <CheckCircle2 size={18} className="text-primary" />}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Character Name</label>
                <input
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="Hero"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Traits / Personality</label>
                <input
                  value={charTraits}
                  onChange={(e) => setCharTraits(e.target.value)}
                  placeholder="brave, determined, wears a red coat"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Outfit</label>
                <input
                  value={charOutfit}
                  onChange={(e) => setCharOutfit(e.target.value)}
                  placeholder="red coat, leather boots"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reference Image URLs (comma separated)</label>
                <input
                  value={charRefs}
                  onChange={(e) => setCharRefs(e.target.value)}
                  placeholder="https://.../ref1.png, https://.../ref2.png"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              <button
                onClick={handleCreateCharacter}
                disabled={isGenerating || !charName.trim()}
                className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating && step === 'project' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Character...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Character
                  </>
                )}
              </button>
            </div>
          </section>

          <section className={created.episodeId ? '' : 'opacity-40 pointer-events-none'}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">3. Episode / Storyboard</h2>
              {step === 'done' && <CheckCircle2 size={18} className="text-primary" />}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Episode Title</label>
                <input
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="Pilot Episode"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Episode Summary</label>
                <textarea
                  value={episodeSummary}
                  onChange={(e) => setEpisodeSummary(e.target.value)}
                  placeholder="What happens in this episode..."
                  className="w-full h-24 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
                />
              </div>
              <button
                onClick={handleCreateEpisode}
                disabled={isGenerating || !episodeTitle.trim()}
                className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating && step === 'character' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Episode...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Episode
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {step === 'done' && created.episodeId && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Storyboard Ready</h2>
            <div className="grid grid-cols-3 gap-4">
              <div
                className="glass-panel p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/storyboard/shots/${created.episodeId}`)}
              >
                <div className="aspect-video bg-[var(--bg-card)] rounded-lg mb-2" />
                <h3 className="font-medium">Shot Editor</h3>
                <p className="text-sm text-muted">Generate per-shot assets</p>
              </div>
              <div
                className="glass-panel p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/storyboard/analysis/${created.episodeId}`)}
              >
                <div className="aspect-video bg-[var(--bg-card)] rounded-lg mb-2" />
                <h3 className="font-medium">Scene Analysis</h3>
                <p className="text-sm text-muted">Review project context</p>
              </div>
            </div>
          </div>
        )}

        {projectId && step === 'idle' && (
          <p className="text-sm text-muted mt-4">
            A project is already loaded in this session. Fill the form above to create a new one.
          </p>
        )}
      </div>
    </div>
  )
}
