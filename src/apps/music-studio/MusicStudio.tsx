import { Music, Loader2, Download } from 'lucide-react'
import { useState } from 'react'
import { generateAudio } from '@/api/muapi'

export default function MusicStudio() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(30)
  const [model, setModel] = useState('music-3.0')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const audio = await generateAudio({ prompt, duration })
      setResult(audio)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Music Studio</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Music Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Epic orchestral music with deep bass..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option value="music-3.0">Music 3.0</option>
                  <option value="audiogen-2.0">AudioGen 2.0</option>
                  <option value="ria">RIA</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

        {result && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Generated Audio</h2>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4">
              <audio src={result.url} controls className="w-full" />
            </div>
            <button className="px-4 py-2 bg-[var(--bg-card)] rounded-xl text-sm hover:bg-[var(--border-color)] transition-all flex items-center gap-2">
              <Download size={16} />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  )
}