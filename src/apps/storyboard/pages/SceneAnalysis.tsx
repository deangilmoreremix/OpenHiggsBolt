import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStoryboard } from '../StoryboardContext'
import { panels, buttons, semantic, appWrapper } from '@/shared/styles/designTokens'

export default function SceneAnalysis() {
  const navigate = useNavigate()
  const { projectName, shots, characters, aspectRatio, episodeDuration, result } = useStoryboard()

  const totalSeconds = shots.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
  const framesGenerated = shots.filter((s) => s.frameUrl).length

  const stat = (label: string, value: string) => (
    <div className="p-4 rounded-xl" style={panels.card}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-xs" style={{ color: semantic.textMuted }}>{value}</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full" style={appWrapper}>
      {/* Sub-header — matches other studios */}
      <div className="flex-shrink-0 h-12 flex items-center gap-3 px-6 z-10" style={panels.subHeader}>
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg transition-all"
          style={buttons.ghost}
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-semibold tracking-tight">Scene Analysis</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6">
          <div className="rounded-xl p-6 space-y-6" style={panels.glass}>
            <div>
              <h2 className="text-sm font-semibold mb-2">Project Context</h2>
              {projectName ? (
                <p className="font-medium">{projectName}</p>
              ) : (
                <p className="text-sm" style={{ color: semantic.textMuted }}>No project name set. Add one in the Composer.</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stat('Scenes', `${shots.length} scene(s) defined.`)}
              {stat('Total Shot Time', `${totalSeconds.toFixed(1)}s across scenes.`)}
              {stat('Episode Length', `${episodeDuration}s target.`)}
              {stat('Aspect Ratio', aspectRatio)}
              {stat('Frames', `${framesGenerated}/${shots.length} generated.`)}
              {stat('Characters', `${characters.length} defined.`)}
            </div>

            {shots.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mb-3">Scene Breakdown</h2>
                <ol className="space-y-2">
                  {shots.map((s, i) => (
                    <li key={s.id} className="rounded-xl p-3" style={panels.card}>
                      <span className="text-sm font-bold mr-2" style={{ color: 'var(--color-primary)' }}>{i + 1}.</span>
                      <span className="text-sm">{s.scene}</span>
                      <span className="text-xs ml-2" style={{ color: semantic.textMuted }}>({s.duration}s)</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold mb-2">Status</h2>
              <p className="text-sm" style={{ color: semantic.textMuted }}>
                {result?.url
                  ? 'Storyboard video generated. View it in the Composer.'
                  : 'No storyboard generated yet. Use the Composer to generate one.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
