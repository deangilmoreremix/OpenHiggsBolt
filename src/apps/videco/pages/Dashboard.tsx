import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/api/supabase'
import { Video as VideoIcon, Upload, Sparkles, Film, TrendingUp, Clock, CheckCircle, Loader, BarChart3, Users, MessageSquare, Settings, Plug, Sparkles as SparklesIcon } from 'lucide-react'
import { useVidecoStore } from '@/stores/videcoStore'
import type { Video } from '@/stores/videcoStore'

const typeIcons: Record<string, React.ReactNode> = {
  generation: <Sparkles size={16} />,
  upload: <Upload size={16} />,
  clone: <Film size={16} />,
  campaign: <TrendingUp size={16} />,
}

const typeColors: Record<string, string> = {
  generation: 'text-cyan-400',
  upload: 'text-purple-400',
  clone: 'text-green-400',
  campaign: 'text-orange-400',
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    byType: {} as Record<string, number>,
  })
  const [recentVideos, setRecentVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: videos } = await supabase
          .from('videos')
          .select('id, type, status, name, generated_url, thumbnail_url, created_at')
          .order('created_at', { ascending: false })
          .limit(50)

        if (videos) {
          const typedVideos = videos as Video[]
          const byType: Record<string, number> = {}
          let completed = 0, processing = 0, failed = 0

          typedVideos.forEach((v: Video) => {
            byType[v.type] = (byType[v.type] || 0) + 1
            if (v.status === 'completed') completed++
            else if (v.status === 'processing') processing++
            else if (v.status === 'failed') failed++
          })

          setStats({
            total: typedVideos.length,
            completed,
            processing,
            failed,
            byType,
          })
          setRecentVideos(typedVideos.slice(0, 6))
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const quickActions = [
    { to: '/videco/generate', icon: <Sparkles size={24} />, label: 'Generate Video', desc: 'Create AI videos from text prompts', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
    { to: '/videco/upload', icon: <Upload size={24} />, label: 'Upload Video', desc: 'Upload and manage your videos', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
    { to: '/videco/clone', icon: <Film size={24} />, label: 'AI Clone', desc: 'Create personalized AI clone videos', color: 'from-green-500/20 to-green-600/10 border-green-500/30' },
    { to: '/videco/campaign', icon: <TrendingUp size={24} />, label: 'Campaign', desc: 'Batch generate from CSV data', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30' },
    { to: '/videco/ai-videos', icon: <SparklesIcon size={24} />, label: 'AI Videos', desc: 'View personalized AI videos', color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30' },
    { to: '/videco/analytics', icon: <BarChart3 size={24} />, label: 'Analytics', desc: 'Track video performance', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
    { to: '/videco/leads', icon: <Users size={24} />, label: 'Leads', desc: 'View form submissions', color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30' },
    { to: '/videco/settings', icon: <Settings size={24} />, label: 'Settings', desc: 'Brand kit and preferences', color: 'from-gray-500/20 to-gray-600/10 border-gray-500/30' },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">VideoCo Dashboard</h1>
        <p className="text-secondary mt-1">AI-powered personalized video generation platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Total Videos</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <VideoIcon size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Completed</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-400" />
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Processing</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.processing}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Loader size={24} className="text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Failed</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{stats.failed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Clock size={24} className="text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`glass-panel rounded-xl p-5 border bg-gradient-to-br ${action.color} hover:scale-[1.02] transition-all cursor-pointer group`}
            >
              <div className="text-white mb-3 group-hover:scale-110 transition-transform">{action.icon}</div>
              <h3 className="font-semibold text-white">{action.label}</h3>
              <p className="text-sm text-secondary mt-1">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Videos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Videos</h2>
          <Link to="/videco/library" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-cyan-400" size={32} />
          </div>
        ) : recentVideos.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <VideoIcon size={48} className="text-muted mx-auto mb-4" />
            <p className="text-secondary">No videos yet. Start by generating or uploading a video!</p>
            <Link to="/videco/generate" className="inline-block mt-4 px-6 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
              Generate Your First Video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VideoCard({ video }: { video: Video }) {
  return (
    <Link to={`/videco/editor/${video.id}`} className="glass-panel rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all group">
      <div className="aspect-video bg-bg-card relative overflow-hidden">
        {video.thumbnail_url || video.generated_url ? (
          <img
            src={video.thumbnail_url || video.generated_url}
            alt={video.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoIcon size={40} className="text-muted" />
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
          video.status === 'completed' ? 'bg-green-500/20 text-green-400' :
          video.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {video.status}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className={typeColors[video.type] || 'text-secondary'}>{typeIcons[video.type] || <VideoIcon size={16} />}</span>
          <h3 className="font-medium text-white truncate text-sm">{video.name}</h3>
        </div>
        <p className="text-xs text-muted mt-1">
          {new Date(video.created_at).toLocaleDateString()}
        </p>
      </div>
    </Link>
  )
}
