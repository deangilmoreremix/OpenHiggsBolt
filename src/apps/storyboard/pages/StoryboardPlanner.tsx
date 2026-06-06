import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StoryboardPlanner() {
  const [script, setScript] = useState('')
  const [sceneCount, setSceneCount] = useState(3)
  const navigate = useNavigate()

  const handleGenerate = () => {
    if (!script.trim()) return
    navigate(`/storyboard/shots/1`)
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Storyboard Planner</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Script or Idea</label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter your script or describe your idea..."
                className="w-full h-40 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Number of Scenes</label>
              <input
                type="number"
                value={sceneCount}
                onChange={(e) => setSceneCount(Number(e.target.value))}
                min="1"
                max="20"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              className="w-full py-3 px-4 bg-[var(--color-primary)] text-black font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] transition-all"
            >
              Generate Storyboard
            </button>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Scene Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: sceneCount }).map((_, i) => (
              <div
                key={i}
                className="glass-panel p-4 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/storyboard/shots/${i + 1}`)}
              >
                <div className="aspect-video bg-[var(--bg-card)] rounded mb-2" />
                <h3 className="font-medium">Scene {i + 1}</h3>
                <p className="text-sm text-[var(--text-muted)]">Wide shot</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}