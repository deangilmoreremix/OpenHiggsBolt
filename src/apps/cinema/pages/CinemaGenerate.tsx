import { useState } from 'react'
import { Film, Loader2, Download, Share2, Upload, Settings } from 'lucide-react'
import { generateVideo } from 'studio/src/muapi.js'
import { resolveMuapiKey } from '@/lib/keys'
import {
  AdvancedControlsPanel,
  getControlsForModel,
  buildAdvancedParams,
  type AdvancedModelRef,
} from '@/shared/components/AdvancedControlsPanel'
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider'

// Map the modal's friendly model options to real MuAPI t2v model ids so the
// unified generateVideo hits the correct /api/v1/{endpoint}.
const MODEL_OPTIONS: Array<{ value: string; label: string } & AdvancedModelRef> = [
  { value: 'kling-3.0', label: 'Kling 3.0', id: 'kling-v3.0-pro-text-to-video', provider: 'kling' },
  { value: 'veo-3', label: 'Veo 3', id: 'veo3-text-to-video', provider: 'google' },
  { value: 'sora', label: 'Sora', id: 'openai-sora-2-text-to-video', provider: 'openai' },
]

export default function CinemaGenerate() {
  const { requireEntitlement } = useSmartVideoAccess();
  const [prompt, setPrompt] = useState('')
  const [sceneCount, setSceneCount] = useState(5)
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
    requireEntitlement(
      ENTITLEMENTS.SMARTVIDEO_GO,
      async () => {
        setIsGenerating(true)
        try {
          const apiKey = resolveMuapiKey()
          const advanced = buildAdvancedParams(controls, advValues)
          const video = await generateVideo(apiKey, {
            model: selected.id,
            prompt,
            aspect_ratio: '16:9',
            duration: 5 * sceneCount,
            ...advanced,
          })
          setResult(video)
        } catch (error) {
          console.error(error)
        } finally {
          setIsGenerating(false)
        }
      }
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Cinema Studio</h1>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              showAdvanced ? 'bg-primary text-black' : 'bg-[var(--bg-card)] hover:bg-[var(--border-color)]'
            }`}
          >
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
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  {MODEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Camera Style</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2">
                  <option>Modular 8K Digital</option>
                  <option>Full-Frame Cine Digital</option>
                  <option>Grand Format 70mm Film</option>
                </select>
              </div>
            </div>

            {showAdvanced && (
              <div className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)]/40">
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

        {result && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Generated Video</h2>
            <div className="aspect-video bg-[var(--bg-card)] rounded-xl mb-4 flex items-center justify-center">
              <video src={result.url} controls className="w-full h-full rounded-xl" />
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-[var(--bg-card)] rounded-xl text-sm hover:bg-[var(--border-color)] transition-all flex items-center gap-2">
                <Download size={16} />
                Download
              </button>
              <button className="px-4 py-2 bg-[var(--bg-card)] rounded-xl text-sm hover:bg-[var(--border-color)] transition-all flex items-center gap-2">
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
