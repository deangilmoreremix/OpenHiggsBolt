import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/api/supabase'
import { Save, ArrowLeft, Play, Loader, Copy, ExternalLink, Globe, Lock } from 'lucide-react'
import { useVidecoStore } from '@/stores/videcoStore'
import type { Video } from '@/stores/videcoStore'

export default function VideoEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [video, setVideo] = useState<Video | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const [creatingEmbed, setCreatingEmbed] = useState(false)
  const [embedTitle, setEmbedTitle] = useState('')
  const [embedCta, setEmbedCta] = useState('Learn More')
  const [embedCtaUrl, setEmbedCtaUrl] = useState('')
  const [embedPassword, setEmbedPassword] = useState('')

  useEffect(() => {
    async function loadVideo() {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          setVideo(data)
          setName(data.name)
          setDescription(data.description || '')
        }
      } catch (err) {
        console.error('Failed to load video:', err)
      } finally {
        setLoading(false)
      }
    }
    loadVideo()
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('videos')
        .update({
          name,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      setVideo((prev) => prev ? { ...prev, name, description } : null)
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyUrl = () => {
    if (video?.generated_url) {
      navigator.clipboard.writeText(video.generated_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getEmbedCode = () => {
    if (!video?.generated_url) return ''
    return `<video src="${video.generated_url}" controls style="max-width:100%;border-radius:8px;"></video>`
  }

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(getEmbedCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateEmbed = async () => {
    if (!id) return
    setCreatingEmbed(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-embed`
      const response = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: id,
          title: embedTitle || video?.name || 'Video',
          cta_text: embedCta,
          cta_url: embedCtaUrl,
          password: embedPassword || undefined,
        }),
      })
      if (!response.ok) throw new Error('Failed to create embed')
      const result = await response.json()
      if (result.embed) {
        const url = `${window.location.origin}/videco/embed/${result.embed.slug}`
        setEmbedUrl(url)
      }
    } catch (err) {
      console.error('Failed to create embed:', err)
    } finally {
      setCreatingEmbed(false)
    }
  }

  const handleCopyEmbedUrl = () => {
    if (embedUrl) {
      navigator.clipboard.writeText(embedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-cyan-400" size={32} />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-secondary text-lg">Video not found</p>
        <Link to="/videco/library" className="mt-4 text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Library
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/videco/library')}
          className="p-2 rounded-lg hover:bg-bg-card text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Edit Video</h1>
          <p className="text-secondary text-sm mt-0.5">ID: {video.id}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="aspect-video bg-black">
              {video.generated_url ? (
                <video src={video.generated_url} controls className="w-full h-full" />
              ) : video.source_video_url ? (
                <video src={video.source_video_url} controls className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    {video.status === 'processing' ? (
                      <>
                        <Loader size={32} className="text-yellow-400 animate-spin mx-auto mb-2" />
                        <p className="text-secondary text-sm">Video is processing...</p>
                      </>
                    ) : (
                      <>
                        <Play size={32} className="text-muted mx-auto mb-2" />
                        <p className="text-muted text-sm">No video available</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Type</span>
                <p className="text-white capitalize">{video.type}</p>
              </div>
              <div>
                <span className="text-muted">Status</span>
                <p className={`capitalize ${
                  video.status === 'completed' ? 'text-green-400' :
                  video.status === 'processing' ? 'text-yellow-400' : 'text-red-400'
                }`}>{video.status}</p>
              </div>
              <div>
                <span className="text-muted">Created</span>
                <p className="text-white">{new Date(video.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted">Updated</span>
                <p className="text-white">{new Date(video.updated_at).toLocaleString()}</p>
              </div>
            </div>
            {video.prompt && (
              <div>
                <span className="text-muted text-sm">Prompt</span>
                <p className="text-secondary text-sm mt-1 bg-bg-card rounded-lg p-3">{video.prompt}</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white">Edit</h3>

            <div>
              <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Share */}
          {video.generated_url && (
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-white">Share</h3>

              <div>
                <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">Video URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={video.generated_url}
                    readOnly
                    className="flex-1 px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-xs truncate"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="p-2 rounded-lg bg-bg-card border border-border-color hover:border-cyan-500/30 text-secondary hover:text-cyan-400 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">Embed Code</label>
                <div className="flex gap-2">
                  <textarea
                    value={getEmbedCode()}
                    readOnly
                    rows={3}
                    className="flex-1 px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-xs font-mono resize-none"
                  />
                  <button
                    onClick={handleCopyEmbed}
                    className="p-2 rounded-lg bg-bg-card border border-border-color hover:border-cyan-500/30 text-secondary hover:text-cyan-400 transition-colors self-start"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {copied && (
                <p className="text-xs text-green-400">Copied to clipboard!</p>
              )}
            </div>
          )}

          {/* Create Embed Page */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              Create Embed Page
            </h3>
            <p className="text-secondary text-xs">Create a public landing page for your video with CTAs and optional password protection.</p>

            {embedUrl ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-green-400 text-sm font-medium mb-1">Embed page created!</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={embedUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-xs"
                    />
                    <button
                      onClick={handleCopyEmbedUrl}
                      className="p-2 rounded-lg bg-bg-card border border-border-color hover:border-cyan-500/30 text-secondary hover:text-cyan-400 transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-bg-card border border-border-color hover:border-cyan-500/30 text-secondary hover:text-cyan-400 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">Page Title</label>
                  <input
                    type="text"
                    value={embedTitle}
                    onChange={(e) => setEmbedTitle(e.target.value)}
                    placeholder={video.name || 'Video Title'}
                    className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">CTA Button Text</label>
                  <input
                    type="text"
                    value={embedCta}
                    onChange={(e) => setEmbedCta(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">CTA Link URL</label>
                  <input
                    type="url"
                    value={embedCtaUrl}
                    onChange={(e) => setEmbedCtaUrl(e.target.value)}
                    placeholder="https://your-website.com"
                    className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block flex items-center gap-1">
                    <Lock size={12} />
                    Password (optional)
                  </label>
                  <input
                    type="text"
                    value={embedPassword}
                    onChange={(e) => setEmbedPassword(e.target.value)}
                    placeholder="Leave empty for public access"
                    className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleCreateEmbed}
                  disabled={creatingEmbed}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                >
                  {creatingEmbed ? <Loader size={16} className="animate-spin" /> : <Globe size={16} />}
                  Create Embed Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
