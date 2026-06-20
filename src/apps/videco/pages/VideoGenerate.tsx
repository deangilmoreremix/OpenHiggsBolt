import { useState } from 'react'
import { supabase } from '@/shared/api/supabase'
import { enhancePrompt } from '@/shared/api/openai'
import { Sparkles, Send, Wand2, Loader, Settings2, Video } from 'lucide-react'
import { useVidecoStore } from '@/shared/api/videcoStore'

const MODELS = [
  { id: 'kling-v2', name: 'Kling v2' },
  { id: 'kling-v1', name: 'Kling v1' },
  { id: 'wanx', name: 'WanX' },
  { id: 'wanx-turbo', name: 'WanX Turbo' },
  { id: 'wanx-2.1', name: 'WanX 2.1' },
]

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '1:1', label: '1:1 (Square)' },
]

const QUALITIES = ['standard', 'high', 'ultra']

export default function VideoGenerate() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('kling-v2')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [quality, setQuality] = useState('standard')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [enhancing, setEnhancing] = useState(false)
  const [result, setResult] = useState<{ name: string; generated_url?: string; status: string } | null>(null)
  const { addVideo } = useVidecoStore()

  const handleEnhance = async () => {
    if (!prompt.trim()) return
    setEnhancing(true)
    try {
      const enhanced = await enhancePrompt(prompt)
      setPrompt(enhanced)
    } catch (err) {
      console.error('Enhancement failed:', err)
    } finally {
      setEnhancing(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setProgress('Submitting to AI...')

    try {
      // Create video record first
      const { data: video, error } = await supabase
        .from('videco_videos')
        .insert({
          name: prompt.slice(0, 60) + (prompt.length > 60 ? '...' : ''),
          prompt,
          type: 'generation',
          status: 'processing',
          metadata: { model, aspect_ratio: aspectRatio, quality },
        })
        .select()
        .single()

      if (error) throw error
      addVideo(video)

      // Call edge function for generation
      const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video`
      setProgress('Generating video...')

      const response = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          aspect_ratio: aspectRatio,
          quality,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Generation failed: ${response.status}`)
      }

      const { video: updatedVideo } = await response.json()

      // Update video status
      if (updatedVideo) {
        await supabase
          .from('videco_videos')
          .update({
            status: updatedVideo.status ?? 'completed',
            generated_url: updatedVideo.generated_url,
            thumbnail_url: updatedVideo.thumbnail_url,
          })
          .eq('id', video.id)

        setResult({
          name: video.name,
          generated_url: updatedVideo.generated_url,
          status: updatedVideo.status ?? 'completed',
        })
      }

      setProgress('')
    } catch (err) {
      console.error('Generation error:', err)
      setProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)

      // Update video to failed
      await supabase
        .from('videco_videos')
        .update({ status: 'failed' })
        .eq('name', prompt.slice(0, 60))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Generate AI Video</h1>
        <p className="text-secondary mt-1">Create videos from text prompts using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt & Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Prompt Input */}
          <div className="glass-panel rounded-xl p-5">
            <div className="prompt-bar-container">
              <div className="prompt-field">
                <label>Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate..."
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                {generating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={handleEnhance}
                disabled={enhancing || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 text-purple-400 font-medium rounded-lg hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {enhancing ? <Loader size={16} className="animate-spin" /> : <Wand2 size={16} />}
                Enhance with AI
              </button>
            </div>
            {progress && (
              <div className="mt-3 flex items-center gap-2 text-sm text-yellow-400">
                <Loader size={14} className="animate-spin" />
                {progress}
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="glass-panel rounded-xl p-5 animate-fade-in-up">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                Generated Video
              </h3>
              <div className="aspect-video bg-bg-card rounded-lg overflow-hidden">
                {result.generated_url ? (
                  <video src={result.generated_url} controls className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader size={32} className="text-yellow-400 animate-spin mx-auto mb-2" />
                      <p className="text-secondary text-sm">Video is still processing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Settings2 size={18} className="text-cyan-400" />
              Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Model</label>
                <div className="space-y-1.5">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        model === m.id
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-secondary hover:bg-bg-card border border-transparent'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Aspect Ratio</label>
                <div className="space-y-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        aspectRatio === ar.value
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-secondary hover:bg-bg-card border border-transparent'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Quality</label>
                <div className="flex gap-2">
                  {QUALITIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                        quality === q
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-secondary hover:bg-bg-card border border-transparent'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-3">💡 Tips</h3>
            <ul className="text-xs text-secondary space-y-2">
              <li>• Be specific about scenes, characters, and actions</li>
              <li>• Include mood, lighting, and camera style</li>
              <li>• Use the AI Enhance feature to improve your prompt</li>
              <li>• Different models excel at different video styles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
