import { FileText, Loader2, Save, Download } from 'lucide-react'
import { useState } from 'react'

export default function ScriptWriter() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Script Writer</h1>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all flex items-center gap-2">
              <Save size={16} />
              Save Script
            </button>
            <button className="px-4 py-2 bg-primary text-black rounded-xl font-medium hover:bg-primary-hover transition-all flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Story Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A sci-fi story about time travel..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2">
                  <option>Sci-Fi</option>
                  <option>Drama</option>
                  <option>Action</option>
                  <option>Comedy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Length</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2">
                  <option>Short (2-3 min)</option>
                  <option>Medium (5-10 min)</option>
                  <option>Feature (15+ min)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2">
                  <option>Screenplay</option>
                  <option>Novel</option>
                  <option>Video Script</option>
                </select>
              </div>
            </div>
            
            <button
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Writing Script...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Generate Script
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}