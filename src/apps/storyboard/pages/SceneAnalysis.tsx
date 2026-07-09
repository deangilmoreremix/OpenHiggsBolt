import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStoryboard } from '../StoryboardContext'

export default function SceneAnalysis() {
  const navigate = useNavigate()
  const { projectName, brief, characterIds, episodeId } = useStoryboard()

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
          <h1 className="text-3xl font-bold">Scene Analysis</h1>
        </div>

        <div className="glass p-6 rounded-xl space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Project Context</h2>
            {projectName ? (
              <div className="space-y-2">
                <p className="font-medium">{projectName}</p>
                <p className="text-sm text-muted">{brief || 'No brief provided.'}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">
                No project loaded. Create one in the Planner to populate analysis context.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <p className="font-medium mb-1">Characters</p>
              <p className="text-sm text-muted">
                {characterIds.length > 0
                  ? `${characterIds.length} character(s) defined and reused across scenes.`
                  : 'No characters defined yet.'}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="font-medium mb-1">Episode</p>
              <p className="text-sm text-muted">
                {episodeId
                  ? `Episode storyboard ready (id: ${episodeId}).`
                  : 'No episode created yet.'}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Mood & Atmosphere</h2>
            <p className="text-sm text-muted">
              Use the Shot Editor to generate per-shot assets. Each shot inherits the project's
              visual style and any defined character reference images, enabling consistent
              mood across the episode.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
