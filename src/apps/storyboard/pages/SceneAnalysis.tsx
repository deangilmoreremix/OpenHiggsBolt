import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function SceneAnalysis() {
  const { sceneId } = useParams()

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Scene {sceneId} - Analysis</h1>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Soundtrack Vibes</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-lg">
              <p className="font-medium mb-1">Hans Zimmer - Time</p>
              <p className="text-sm text-[var(--text-muted)]">Epic, motivational, cinematic</p>
            </div>
            <div className="glass-panel p-4 rounded-lg">
              <p className="font-medium mb-1">Similar to: Audiomachine - Blood and Stone</p>
              <p className="text-sm text-[var(--text-muted)]">Dark, intense, powerful</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}