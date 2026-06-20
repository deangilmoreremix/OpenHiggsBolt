import { useEffect, useState } from 'react'
import { supabase } from '@/shared/api/supabase'
import { Sparkles, Play, Share, Loader, Video } from 'lucide-react'

interface AIVideo {
  id: string
  contact_name: string | null
  contact_email: string | null
  generated_url: string | null
  thumbnail_url: string | null
  status: string
  created_at: string
}

export default function AIVideos() {
  const [videos, setVideos] = useState<AIVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState<AIVideo | null>(null)

  useEffect(() => {
    async function loadAIVideos() {
      try {
        const { data } = await supabase
          .from('videco_ai_videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (data) setVideos(data)
      } catch (err) {
        console.error('Failed to load AI videos:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAIVideos()
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={24} className="text-cyan-400" />
          AI Personalized Videos
        </h1>
        <p className="text-secondary mt-1">AI-generated personalized videos for your contacts</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-400" size={32} />
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center">
          <Sparkles size={48} className="text-muted mx-auto mb-4" />
          <p className="text-secondary text-lg">No AI videos yet</p>
          <p className="text-muted text-sm mt-1">Create personalized AI videos from the Campaign or Clone pages</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="glass-panel rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all group">
              <div
                className="aspect-video bg-bg-card relative overflow-hidden cursor-pointer"
                onClick={() => setPlayingVideo(video)}
              >
                {video.thumbnail_url || video.generated_url ? (
                  <img
                    src={video.thumbnail_url || video.generated_url || ''}
                    alt={video.contact_name ?? 'AI Video'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={40} className="text-muted" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Play size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  video.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  video.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {video.status}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-white truncate text-sm">{video.contact_name ?? 'Unnamed'}</h3>
                <p className="text-xs text-muted mt-0.5">{video.contact_email ?? ''}</p>
                <p className="text-xs text-muted mt-0.5">{new Date(video.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="w-full max-w-4xl glass-panel rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-color">
              <h3 className="font-semibold text-white">{playingVideo.contact_name ?? 'AI Video'}</h3>
              <button onClick={() => setPlayingVideo(null)} className="text-secondary hover:text-white transition-colors text-xl">×</button>
            </div>
            <div className="aspect-video bg-black">
              {playingVideo.generated_url ? (
                <video src={playingVideo.generated_url} controls autoPlay className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted">Video not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
