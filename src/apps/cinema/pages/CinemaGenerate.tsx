import { useState } from 'react'
import { Film, Loader2, Upload, Settings } from 'lucide-react'
import { generateVideo } from '@/api/muapi'

export default function CinemaGenerate() {
  const [prompt, setPrompt] = useState('')
  const [sceneCount, setSceneCount] = useState(5)
  const [camera, setCamera] = useState('Modular 8K Digital')
  const [lens, setLens] = useState('Premium Modern Prime')
  const [aperture, setAperture] = useState('f/1.4')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      await generateVideo({ prompt, duration: 5 * sceneCount })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Cinema Studio</h1>
          <button className="px-4 py-2 bg-[var(--bg-card)] rounded-xl flex items-center gap-2 hover:bg-[var(--border-color)] transition-all">
            <Settings size={16} />
            Advanced Settings
          </button>
        </div>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Movie Concept</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cinematic sequence of a futuristic city..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Scenes</label>
                <input
                  type="number"
                  value={sceneCount}
                  onChange={(e) => setSceneCount(Number(e.target.value))}
                  min="1"
                  max="50"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Camera</label>
                <select
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option>Modular 8K Digital</option>
                  <option>Full-Frame Cine Digital</option>
                  <option>Grand Format 70mm Film</option>
                  <option>Studio Digital S35</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Lens</label>
                <select
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option>Premium Modern Prime</option>
                  <option>Classic Anamorphic</option>
                  <option>Vintage Prime</option>
                  <option>Swirl Bokeh Portrait</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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