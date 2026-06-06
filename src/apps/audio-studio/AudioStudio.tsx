import { Music, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function AudioStudio() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Audio Studio</h1>
        
        <div className="glass p-6 rounded-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Music Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Epic orchestral music with deep bass..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2">
                  <option>Cinematic</option>
                  <option>Epic</option>
                  <option>Ambient</option>
                  <option>Electronic</option>
                </select>
              </div>
            </div>
            
            <button
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-[var(--color-primary)] text-black font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Music size={20} />
                  Generate Music
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}