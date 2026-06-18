import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { generateText } from '@/api/muapi'

export default function StoryboardPlanner() {
  const [script, setScript] = useState('')
  const [sceneCount, setSceneCount] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scenes, setScenes] = useState<any[]>([])
  const navigate = useNavigate()

  const handleGenerate = async () => {
    if (!script.trim()) return
    setIsGenerating(true)
    try {
      const sceneBreakdown = await generateText({
        prompt: `Break down this script into ${sceneCount} scenes with shot descriptions: ${script}`,
        systemPrompt: 'You are a professional storyboard artist. Break scripts into scenes with shot types, camera angles, and visual descriptions.',
        maxTokens: 1500
      })
      const sceneList = sceneBreakdown.text.split('\n\n').map((scene, i) => ({ id: i + 1, description: scene }))
      setScenes(sceneList)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
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
                className="w-full h-40 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
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
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Storyboard
                </>
              )}
            </button>
          </div>
        </div>

        {scenes.length > 0 && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Scene Breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="glass-panel p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/storyboard/shots/${scene.id}`)}
                >
                  <div className="aspect-video bg-[var(--bg-card)] rounded-lg mb-2" />
                  <h3 className="font-medium">Scene {scene.id}</h3>
                  <p className="text-sm text-muted">Wide shot</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}