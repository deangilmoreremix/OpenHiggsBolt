import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/api/supabase'
import { Loader, Lock, ExternalLink } from 'lucide-react'

interface EmbedPage {
  id: string
  slug: string
  title: string | null
  description: string | null
  cta_text: string
  cta_url: string | null
  cta_secondary_text: string | null
  cta_secondary_url: string | null
  video_url: string | null
  video_name: string | null
  password_hash: string | null
  views_count: number
  brand: {
    primary_color: string
    secondary_color: string
    primary_text_color: string
    secondary_text_color: string
    cta_text: string
    logo_url: string
  } | null
}

export default function EmbedPlayer() {
  const { slug } = useParams<{ slug: string }>()
  const [embed, setEmbed] = useState<EmbedPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    async function loadEmbed() {
      if (!slug) return
      try {
        // Get embed page
const { data } = await supabase
           .from('embed_pages')
           .select(`
             *,
             videos:video_id (name, generated_url)
           `)
           .eq('slug', slug)
           .single()

        if (data) {
          // Get brand kit
          const { data: brand } = await supabase
            .from('brand_kit')
            .select('*')
            .eq('tenant_id', data.tenant_id ?? 'default')
            .single()

          setEmbed({
            id: data.id,
            slug: data.slug,
            title: data.title,
            description: data.description,
            cta_text: data.cta_text,
            cta_url: data.cta_url,
            cta_secondary_text: data.cta_secondary_text,
            cta_secondary_url: data.cta_secondary_url,
            video_url: data.videos?.generated_url ?? null,
            video_name: data.videos?.name ?? null,
            password_hash: data.password_hash,
            views_count: data.views_count,
            brand: brand ? {
              primary_color: brand.primary_color,
              secondary_color: brand.secondary_color,
              primary_text_color: brand.primary_text_color,
              secondary_text_color: brand.secondary_text_color,
              cta_text: brand.cta_text,
              logo_url: brand.logo_url,
            } : null,
          })

          // Check if password protected
          if (data.password_hash) {
            setUnlocked(false)
          } else {
            setUnlocked(true)
            // Track view
            trackView(data.id)
          }
        } else {
          setError('Embed page not found')
        }
      } catch (err) {
        console.error('Failed to load embed:', err)
        setError('Failed to load embed page')
      } finally {
        setLoading(false)
      }
    }
    loadEmbed()
  }, [slug])

  const trackView = async (embedId: string) => {
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`
      await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'embed_view',
          metadata: { embed_id: embedId },
        }),
      })
    } catch (err) {
      // Silent fail for tracking
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (embed?.password_hash && btoa(password) === embed.password_hash) {
      setUnlocked(true)
      setAccessDenied(false)
      trackView(embed.id)
    } else {
      setAccessDenied(true)
    }
  }

  const brand = embed?.brand
  const primaryColor = brand?.primary_color ?? '#22d3ee'
  const textColor = brand?.primary_text_color ?? '#ffffff'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <Loader className="animate-spin text-cyan-400" size={32} />
      </div>
    )
  }

  if (error || !embed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <div className="text-center">
          <p className="text-2xl text-white font-semibold mb-2">{error ?? 'Not Found'}</p>
          <p className="text-secondary">This embed page may have been deactivated</p>
        </div>
      </div>
    )
  }

  // Password gate
  if (!unlocked && embed.password_hash) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <div className="max-w-sm w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
              <Lock size={32} style={{ color: primaryColor }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: textColor }}>Password Protected</h1>
            <p className="text-secondary text-sm mt-1">Enter the password to view this video</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-bg-card border border-border-color rounded-xl text-white placeholder:text-muted focus:outline-none"
              style={{ borderColor: accessDenied ? '#ef4444' : undefined }}
              autoFocus
            />
            {accessDenied && <p className="text-red-400 text-sm">Incorrect password</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-black transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Brand Logo */}
        {brand?.logo_url && (
          <div className="flex justify-center mb-6">
            <img src={brand.logo_url} alt="Brand" className="h-10 object-contain" />
          </div>
        )}

        {/* Title */}
        {embed.title && (
          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: textColor }}>
            {embed.title}
          </h1>
        )}
        {embed.description && (
          <p className="text-secondary text-center mb-8 max-w-lg mx-auto">{embed.description}</p>
        )}

        {/* Video Player */}
        <div className="rounded-2xl overflow-hidden bg-black mb-8 shadow-2xl">
          {embed.video_url ? (
            <video src={embed.video_url} controls className="w-full" autoPlay={false} />
          ) : (
            <div className="aspect-video flex items-center justify-center">
              <p className="text-muted">Video not available</p>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {embed.cta_url && (
            <a
              href={embed.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-black transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {embed.cta_text}
              <ExternalLink size={16} />
            </a>
          )}
          {embed.cta_secondary_url && embed.cta_secondary_text && (
            <a
              href={embed.cta_secondary_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold border transition-colors hover:bg-white/5"
              style={{ color: textColor, borderColor: textColor + '30' }}
            >
              {embed.cta_secondary_text}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-muted text-xs">
            Powered by <span style={{ color: primaryColor }}>VideoCo</span> • AI-Powered Video Generation
          </p>
        </div>
      </div>
    </div>
  )
}
