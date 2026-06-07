import { useState } from 'react'
import { Video, Loader2, Download, Share2, Image } from 'lucide-react'
import { generateVideo } from '@/api/muapi'

export default function VideoGenerate() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [model, setModel] = useState('kling-3.0')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const video = await generateVideo({ prompt, duration, aspectRatio, model })
      setResult(video)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Video Studio</h1>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-bg-card rounded-xl hover:bg-border-color transition-all flex items-center gap-2">
              <Image size={16} />
              Add Reference
            </button>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your video..."
                className="w-full h-32 bg-bg-card border border-border-color rounded-xl p-3 text-white placeholder-muted resize-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-bg-card border border-border-color rounded-xl p-2"
                >
                  <option value="kling-3.0">Kling 3.0</option>
                  <option value="veo-3">Veo 3</option>
                  <option value="sora">Sora</option>
                  <option value="ltx-2.3">LTX 2.3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-bg-card border border-border-color rounded-xl p-2"
                >
                  <option value={3}>3 seconds</option>
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full bg-bg-card border border-border-color rounded-xl p-2"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
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
                  <Video size={20} />
                  Generate Video
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Generated Video</h2>
            <div className="aspect-video bg-bg-card rounded-xl mb-4 flex items-center justify-center">
              <video src={result.url} controls className="w-full h-full rounded-xl" />
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-bg-card rounded-xl text-sm hover:bg-border-color transition-all flex items-center gap-2">
                <Download size={16} />
                Download
              </button>
              <button className="px-4 py-2 bg-bg-card rounded-xl text-sm hover:bg-border-color transition-all flex items-center gap-2">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}