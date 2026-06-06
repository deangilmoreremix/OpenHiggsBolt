import { Image, Loader2, Upload, Download } from 'lucide-react'
import { useState } from 'react'
import { generateImage } from '@/api/muapi'

export default function ThumbnailStudio() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('flux-1.0')
  const [selectedStyle, setSelectedStyle] = useState('Vibrant Colors')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const image = await generateImage({ prompt, model, style: selectedStyle })
      setResult(image)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const styles = ['Vibrant Colors', 'Bold Text', 'Face Focus', 'Minimal']

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
        
        <div className="glass p-6 rounded-xl mb-6">
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
              <label className="block text-sm font-medium mb-2">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2 mb-3"
              >
                <option value="flux-1.0">Flux 1.0</option>
                <option value="sdxl-1.0">SDXL 1.0</option>
                <option value="dalle-3">DALL-E 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Style Templates</label>
              <div className="grid grid-cols-4 gap-3">
                {styles.map((style, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedStyle(style)}
                    className={`glass-panel p-3 rounded-xl text-center cursor-pointer hover:scale-105 transition-transform ${
                      selectedStyle === style ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <p className="font-medium text-sm">{style}</p>
                  </div>
                ))}
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
                  <Image size={20} />
                  Generate Thumbnail
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Generated Thumbnail</h2>
            <div className="bg-[var(--bg-card)] rounded-xl mb-4 flex items-center justify-center">
              <img src={result.url} alt="Generated thumbnail" className="max-w-full max-h-96 rounded-xl" />
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