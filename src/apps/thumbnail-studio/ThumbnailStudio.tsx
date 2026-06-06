import { Image, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'

export default function ThumbnailStudio() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Thumbnail Studio</h1>
          <button className="px-4 py-2 bg-primary text-black rounded-xl font-medium hover:bg-primary-hover transition-all flex items-center gap-2">
            <Upload size={16} />
            Upload Reference
          </button>
        </div>
        
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
            
            <div>
              <label className="block text-sm font-medium mb-2">Style Templates</label>
              <div className="grid grid-cols-4 gap-3">
                {['Vibrant Colors', 'Bold Text', 'Face Focus', 'Minimal'].map((style, i) => (
                  <div key={i} className="glass-panel p-3 rounded-xl text-center cursor-pointer hover:scale-105 transition-transform">
                    <p className="font-medium text-sm">{style}</p>
                  </div>
                ))}
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