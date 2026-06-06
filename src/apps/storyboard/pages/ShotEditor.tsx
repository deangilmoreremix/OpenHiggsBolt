import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ShotEditor() {
  const { sceneId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/storyboard')}
            className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Scene {sceneId} - Shot Editor</h1>
        </div>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">Camera Settings</h3>
              <div className="space-y-3">
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2">
                  <option>Wide Shot</option>
                  <option>Close-up</option>
                  <option>Medium</option>
                  <option>Over Shoulder</option>
                </select>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2">
                  <option>Eye Level</option>
                  <option>High Angle</option>
                  <option>Low Angle</option>
                  <option>Dutch Angle</option>
                </select>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Mood Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Energy</span>
                  <span>75%</span>
                </div>
                <div className="h-2 bg-[var(--bg-card)] rounded-full">
                  <div className="h-full w-3/4 bg-[var(--color-primary)] rounded-full" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2 bg-[var(--color-primary)] text-black rounded-lg font-medium">
                  Generate Shot
                </button>
                <button className="w-full py-2 bg-[var(--bg-card)] rounded-lg">
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="aspect-video bg-[var(--bg-card)] rounded-xl" />
      </div>
    </div>
  )
}