import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabase'
import { BarChart3, Play, Eye, FileText, MessageSquare, Calendar, TrendingUp, Loader } from 'lucide-react'

const DATE_RANGES = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
]

interface AnalyticsData {
  total_plays: number
  total_views: number
  total_forms: number
  total_surveys: number
  top_videos: { id: string; name: string; count: number }[]
  daily: { date: string; plays: number; views: number; clicks: number }[]
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      try {
        const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-analytics?tenant_id=default&days=${days}${selectedVideo ? `&video_id=${selectedVideo}` : ''}`
        const response = await fetch(fnUrl)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [days, selectedVideo])

  const maxDaily = Math.max(...(data?.daily?.map((d) => Math.max(d.plays, d.views)) ?? [1]), 1)

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-secondary mt-1">Track video performance and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted" />
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setDays(range.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                days === range.value
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-secondary hover:bg-bg-card'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Total Plays</p>
              <p className="text-3xl font-bold text-white mt-1">{data?.total_plays ?? 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Play size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Total Views</p>
              <p className="text-3xl font-bold text-white mt-1">{data?.total_views ?? 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Eye size={24} className="text-purple-400" />
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Form Submissions</p>
              <p className="text-3xl font-bold text-white mt-1">{data?.total_forms ?? 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <FileText size={24} className="text-green-400" />
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Survey Responses</p>
              <p className="text-3xl font-bold text-white mt-1">{data?.total_surveys ?? 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <MessageSquare size={24} className="text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-cyan-400" />
          Activity Over Time
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-cyan-400" size={32} />
          </div>
        ) : !data?.daily?.length ? (
          <div className="text-center py-12">
            <BarChart3 size={40} className="text-muted mx-auto mb-3" />
            <p className="text-secondary">No analytics data yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Simple bar chart */}
            <div className="flex items-end gap-1 h-48">
              {data.daily.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 min-w-0" title={day.date}>
                  <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100%', justifyContent: 'flex-end' }}>
                    <div
                      className="w-full max-w-6 bg-cyan-500/60 rounded-t transition-all"
                      style={{ height: `${(day.plays / maxDaily) * 80}%`, minHeight: day.plays > 0 ? '2px' : '0' }}
                    />
                    <div
                      className="w-full max-w-6 bg-purple-500/60 rounded-t transition-all"
                      style={{ height: `${(day.views / maxDaily) * 80}%`, minHeight: day.views > 0 ? '2px' : '0' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted">
              {data.daily.length > 0 && (
                <>
                  <span>{data.daily[0].date}</span>
                  <span>{data.daily[data.daily.length - 1].date}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-cyan-500/60" />
                <span className="text-xs text-secondary">Plays</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-purple-500/60" />
                <span className="text-xs text-secondary">Views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-500/60" />
                <span className="text-xs text-secondary">Clicks</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Videos */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Top Videos by Plays</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-cyan-400" size={24} />
          </div>
        ) : !data?.top_videos?.length ? (
          <p className="text-secondary text-sm text-center py-8">No video data yet</p>
        ) : (
          <div className="space-y-2">
            {data.top_videos.map((video, i) => (
              <div
                key={video.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-card cursor-pointer transition-colors"
                onClick={() => setSelectedVideo(selectedVideo === video.id ? null : video.id)}
              >
                <span className="text-sm text-muted w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{video.name}</p>
                </div>
                <div className="w-32 bg-bg-panel rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${(video.count / (data.top_videos[0]?.count ?? 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-secondary w-12 text-right">{video.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
