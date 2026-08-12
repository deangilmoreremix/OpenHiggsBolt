import { useState } from 'react'
import { Video, Loader2, Download, Share2, Image, SlidersHorizontal } from 'lucide-react'
import { generateVideo } from 'studio/src/muapi.js'
import { resolveMuapiKey } from '@/lib/keys'
import {
  AdvancedControlsPanel,
  getControlsForModel,
  buildAdvancedParams,
  type AdvancedModelRef,
} from '@/shared/components/AdvancedControlsPanel'

// Map the modal's friendly model options to real MuAPI t2v model ids so the
// unified generateVideo hits the correct /api/v1/{endpoint}.
const MODEL_OPTIONS: Array<{ value: string; label: string } & AdvancedModelRef> = [
  { value: 'kling-3.0', label: 'Kling 3.0', id: 'kling-v3.0-pro-text-to-video', provider: 'kling' },
  { value: 'veo-3', label: 'Veo 3', id: 'veo3-text-to-video', provider: 'google' },
  { value: 'sora', label: 'Sora', id: 'openai-sora-2-text-to-video', provider: 'openai' },
  { value: 'ltx-2.3', label: 'LTX 2.3', id: 'ltx-2.3-text-to-video', provider: 'lightricks' },
]

export default function VideoGenerate() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [model, setModel] = useState('kling-3.0')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advValues, setAdvValues] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const selected = MODEL_OPTIONS.find((o) => o.value === model) || MODEL_OPTIONS[0]
  const controls = getControlsForModel(selected)

  const handleModelChange = (value: string) => {
    setModel(value)
    setAdvValues({})
  }

  const handleAdvancedChange = (key: string, value: any) => {
    setAdvValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const apiKey = resolveMuapiKey()
      const advanced = buildAdvancedParams(controls, advValues)
      const video = await generateVideo(apiKey, {
        model: selected.id,
        prompt,
        aspect_ratio: aspectRatio,
        duration,
        ...advanced,
      })
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
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                showAdvanced ? 'bg-primary text-black' : 'bg-bg-card hover:bg-border-color'
              }`}
            >
              <SlidersHorizontal size={16} />
              Advanced
            </button>
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
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-bg-card border border-border-color rounded-xl p-2"
                >
                  {MODEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
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

            {showAdvanced && (
              <div className="border border-border-color rounded-xl p-4 bg-bg-card/40">
                <h3 className="text-sm font-semibold mb-3">Advanced Controls</h3>
                <AdvancedControlsPanel
                  controls={controls}
                  values={advValues}
                  onChange={handleAdvancedChange}
                />
              </div>
            )}

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
