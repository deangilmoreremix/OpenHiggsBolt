import { Presentation, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function PresentationApp() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Presentation Studio</h1>
        
        <div className="glass p-6 rounded-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Presentation Topic</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Quarterly business report..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slides</label>
                <input
                  type="number"
                  defaultValue={10}
                  min="1"
                  max="50"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2">
                  <option>Professional Dark</option>
                  <option>Clean Light</option>
                  <option>Creative Colorful</option>
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
                  Creating Slides...
                </>
              ) : (
                <>
                  <Presentation size={20} />
                  Generate Presentation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}