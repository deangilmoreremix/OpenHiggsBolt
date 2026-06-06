import { Image, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function ThumbnailStudio() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Thumbnail Studio</h1>
        
        <div className="glass p-6 rounded-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A dramatic thumbnail with bold text..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel p-3 rounded-xl text-center">
                <p className="font-medium">Vibrant Colors</p>
              </div>
              <div className="glass-panel p-3 rounded-xl text-center">
                <p className="font-medium">Bold Text</p>
              </div>
              <div className="glass-panel p-3 rounded-xl text-center">
                <p className="font-medium">Face Focus</p>
              </div>
            </div>
            
            <button
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
                  <Image size={20} />
                  Generate Thumbnail
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}