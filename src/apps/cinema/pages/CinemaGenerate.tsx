import { useState } from 'react'
import { Film, Loader2 } from 'lucide-react'

export default function CinemaGenerate() {
  const [prompt, setPrompt] = useState('')
  const [sceneCount, setSceneCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Cinema Studio</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Movie Concept</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cinematic sequence of a futuristic city..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Number of Scenes</label>
              <input
                type="number"
                value={sceneCount}
                onChange={(e) => setSceneCount(Number(e.target.value))}
                min="1"
                max="50"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2"
              />
            </div>
            
            <button
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-[var(--color-primary)] text-black font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating Cinematic Sequence...
                </>
              ) : (
                <>
                  <Film size={20} />
                  Generate Cinematic Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}