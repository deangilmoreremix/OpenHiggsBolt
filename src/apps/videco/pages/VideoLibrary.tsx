import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/api/supabase'
import { Video, Trash2, Play, Filter, Loader, ChevronLeft, ChevronRight, Search, Grid, List } from 'lucide-react'
import { useVidecoStore } from '@/stores/videcoStore'
import type { Video as VideoType } from '@/stores/videcoStore'

const typeFilters = [
  { value: null, label: 'All' },
  { value: 'generation', label: 'Generated' },
  { value: 'upload', label: 'Uploaded' },
  { value: 'clone', label: 'Clones' },
  { value: 'campaign', label: 'Campaigns' },
]

const statusFilters = [
  { value: null, label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
]

export default function VideoLibrary() {
  const {
    videos, total, page, totalPages, loading,
    filterType, filterStatus,
    setVideos, setLoading, setFilterType, setFilterStatus, removeVideo, nextPage, resetPage,
  } = useVidecoStore()

  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1)

      if (filterType) query = query.eq('type', filterType)
      if (filterStatus) query = query.eq('status', filterStatus)
      if (search) query = query.ilike('name', `%${search}%`)

      const { data, count } = await query
      if (data) {
        setVideos({
          videos: data,
          total: count ?? 0,
          page,
          limit: 20,
          total_pages: Math.ceil((count ?? 0) / 20),
        })
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    } finally {
      setLoading(false)
    }
  }, [page, filterType, filterStatus, search, setVideos, setLoading])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleDelete = async (id: string) => {
    try {
      // Call edge function to delete
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-video?id=${id}`
      await fetch(fnUrl, { method: 'DELETE' })
      removeVideo(id)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete video:', err)
    }
  }

  const handleFilterType = (type: string | null) => {
    setFilterType(type)
    resetPage()
  }

  const handleFilterStatus = (status: string | null) => {
    setFilterStatus(status)
    resetPage()
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Video Library</h1>
          <p className="text-secondary mt-1">{total} videos total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-secondary hover:bg-bg-card'}`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-secondary hover:bg-bg-card'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={16} className="text-muted mr-1" />
          {typeFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => handleFilterType(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterType === f.value
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-secondary hover:bg-bg-card'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={filterStatus ?? ''}
          onChange={(e) => handleFilterStatus(e.target.value || null)}
          className="px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
        >
          {statusFilters.map((f) => (
            <option key={f.label} value={f.value ?? ''}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Video Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-400" size={32} />
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center">
          <Video size={48} className="text-muted mx-auto mb-4" />
          <p className="text-secondary text-lg">No videos found</p>
          <p className="text-muted text-sm mt-1">Try adjusting your filters or generate a new video</p>
          <Link to="/videco/generate" className="inline-block mt-4 px-6 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
            Generate Video
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoGridCard
              key={video.id}
              video={video}
              onPlay={() => setPlayingVideo(video)}
              onDelete={() => setDeleteConfirm(video.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((video) => (
            <VideoListRow
              key={video.id}
              video={video}
              onPlay={() => setPlayingVideo(video)}
              onDelete={() => setDeleteConfirm(video.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { if (page > 1) { /* handled by store */ } }}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} className="text-secondary" />
          </button>
          <span className="text-sm text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => { if (page < totalPages) nextPage() }}
            disabled={page >= totalPages}
            className="p-2 rounded-lg hover:bg-bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} className="text-secondary" />
          </button>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="w-full max-w-4xl glass-panel rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-color">
              <h3 className="font-semibold text-white">{playingVideo.name}</h3>
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

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-panel rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Delete Video?</h3>
            <p className="text-secondary text-sm mb-6">This action cannot be undone. The video and its files will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-secondary hover:bg-bg-card transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-400 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VideoGridCard({ video, onPlay, onDelete }: { video: VideoType; onPlay: () => void; onDelete: () => void }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all group">
      <div className="aspect-video bg-bg-card relative overflow-hidden cursor-pointer" onClick={onPlay}>
        {video.thumbnail_url || video.generated_url ? (
          <img
            src={video.thumbnail_url || video.generated_url}
            alt={video.name}
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
        <Link to={`/videco/editor/${video.id}`} className="font-medium text-white truncate text-sm hover:text-cyan-400 transition-colors block">
          {video.name}
        </Link>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted">{new Date(video.created_at).toLocaleDateString()}</span>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function VideoListRow({ video, onPlay, onDelete }: { video: VideoType; onPlay: () => void; onDelete: () => void }) {
  return (
    <div className="glass-panel rounded-xl p-3 flex items-center gap-4 hover:border-cyan-500/30 transition-all">
      <div className="w-24 h-16 bg-bg-card rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onClick={onPlay}>
        {video.thumbnail_url || video.generated_url ? (
          <img src={video.thumbnail_url || video.generated_url} alt={video.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video size={20} className="text-muted" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link to={`/videco/editor/${video.id}`} className="font-medium text-white truncate hover:text-cyan-400 transition-colors">
          {video.name}
        </Link>
        <p className="text-xs text-muted mt-0.5 truncate">{video.prompt || 'No prompt'}</p>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
        video.status === 'completed' ? 'bg-green-500/20 text-green-400' :
        video.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-red-500/20 text-red-400'
      }`}>
        {video.status}
      </span>
      <span className="text-xs text-muted flex-shrink-0">{new Date(video.created_at).toLocaleDateString()}</span>
      <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors flex-shrink-0">
        <Trash2 size={16} />
      </button>
    </div>
  )
}
