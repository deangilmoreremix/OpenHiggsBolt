import { useState, useCallback } from 'react'
import { supabase } from '@/api/supabase'
import { Upload, Loader, Film, Send, FileVideo, X } from 'lucide-react'
import { useVidecoStore } from '@/stores/videcoStore'

const CLONE_MODELS = [
  { id: 'heygen', name: 'HeyGen Clone' },
  { id: 'd-id', name: 'D-ID Clone' },
  { id: 'sadtalker', name: 'SadTalker' },
]

export default function VideoClone() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [script, setScript] = useState('')
  const [model, setModel] = useState('heygen')
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<{ generated_url?: string; status: string } | null>(null)
  const { addVideo } = useVidecoStore()

  const handleSourceDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      setSourceFile(file)
    }
  }, [])

  const handleSourceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSourceFile(e.target.files[0])
    }
  }

  const uploadSource = async (): Promise<string> => {
    if (sourceUrl) return sourceUrl
    if (!sourceFile) throw new Error('No source video')

    setUploading(true)
    try {
      const fileName = `clone-source-${Date.now()}-${sourceFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { error } = await supabase.storage.from('sources').upload(fileName, sourceFile, { upsert: false })
      if (error) throw error

      const { data } = supabase.storage.from('sources').getPublicUrl(fileName)
      setSourceUrl(data.publicUrl)
      return data.publicUrl
    } finally {
      setUploading(false)
    }
  }

  const handleGenerate = async () => {
    if (!script.trim()) return
    setGenerating(true)
    setProgress('Uploading source video...')

    try {
      const uploadedUrl = await uploadSource()
      setProgress('Creating clone video...')

      // Create video record
      const { data: video, error } = await supabase
        .from('videos')
        .insert({
          name: `AI Clone - ${script.slice(0, 40)}...`,
          prompt: script,
          type: 'clone',
          status: 'processing',
          source_video_url: uploadedUrl,
          metadata: { model, type: 'clone' },
        })
        .select()
        .single()

      if (error) throw error
      if (video) addVideo(video)

      setProgress('Processing AI clone...')

      // Simulate processing - in production this would call an edge function
      await new Promise((r) => setTimeout(r, 3000))

      // For demo, mark as completed
      await supabase.from('videos').update({ status: 'completed' }).eq('id', video.id)

      setResult({ status: 'completed' })
      setProgress('')
    } catch (err) {
      console.error('Clone generation error:', err)
      setProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Clone Studio</h1>
        <p className="text-secondary mt-1">Upload a video of yourself, then generate personalized videos with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Video Upload */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Film size={18} className="text-cyan-400" />
            1. Source Video
          </h3>

          {!sourceFile && !sourceUrl ? (
            <div
              onDrop={handleSourceDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border-color hover:border-cyan-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
              onClick={() => document.getElementById('source-input')?.click()}
            >
              <input id="source-input" type="file" accept="video/*" onChange={handleSourceSelect} className="hidden" />
              <Upload size={32} className="text-muted mx-auto mb-3" />
              <p className="text-secondary text-sm">Drop your source video or click to browse</p>
              <p className="text-muted text-xs mt-1">A clear, front-facing video works best</p>
            </div>
          ) : (
            <div className="bg-bg-card rounded-lg p-3">
              <video
                src={sourceUrl || (sourceFile ? URL.createObjectURL(sourceFile) : '')}
                controls
                className="w-full rounded-lg"
              />
              {!sourceUrl && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-secondary truncate flex-1">{sourceFile?.name}</span>
                  <button
                    onClick={() => { setSourceFile(null); setSourceUrl('') }}
                    className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Or use URL */}
          <div className="mt-3">
            <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">Or paste video URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => { setSourceUrl(e.target.value); setSourceFile(null) }}
              placeholder="https://your-video-url.mp4"
              className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Script & Generate */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">2. Clone Script</h3>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter the script for your AI clone video..."
              rows={6}
              className="w-full bg-bg-card border border-border-color rounded-lg px-3 py-2 text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none resize-none"
            />
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">3. Clone Model</h3>
            <div className="space-y-1.5">
              {CLONE_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
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

          <button
            onClick={handleGenerate}
            disabled={generating || !script.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            {generating ? 'Generating Clone...' : 'Generate Clone Video'}
          </button>

          {progress && (
            <div className="flex items-center gap-2 text-sm text-yellow-400 justify-center">
              <Loader size={14} className="animate-spin" />
              {progress}
            </div>
          )}

          {result && (
            <div className="glass-panel rounded-xl p-5 animate-fade-in-up">
              <h3 className="font-semibold text-white mb-2">
                {result.status === 'completed' ? '✅ Clone Generated!' : '⏳ Processing...'}
              </h3>
              {result.generated_url ? (
                <video src={result.generated_url} controls className="w-full rounded-lg" />
              ) : (
                <p className="text-secondary text-sm">
                  Your AI clone is being processed. Check the Video Library for the result.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
