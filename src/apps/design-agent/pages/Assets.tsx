import { useState, useEffect } from 'react'
import { Download, Image as ImageIcon, ExternalLink, Check, X } from 'lucide-react'
import { getSessionAssets, approveJob, rejectJob, getSessionJobs } from '../../../shared/api/designAgent'
import { Asset, Job } from '../../../shared/types/designAgent'

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssets()
    loadJobs()
  }, [])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const sessionId = localStorage.getItem('design_agent_session_id')
      if (sessionId) {
        const sessionAssets = await getSessionAssets(sessionId)
        setAssets(sessionAssets)
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadJobs = async () => {
    try {
      const sessionId = localStorage.getItem('design_agent_session_id')
      if (sessionId) {
        const sessionJobs = await getSessionJobs(sessionId)
        setJobs(sessionJobs.filter(job => job.status === 'pending'))
      }
    } catch (error) {
      console.error('Failed to load jobs:', error)
    }
  }

  const downloadAsset = (url: string, label: string) => {
    window.open(url, '_blank')
  }

  const handleApprove = async (jobId: string) => {
    try {
      await approveJob(jobId)
      setJobs(jobs.filter(j => j.id !== jobId))
    } catch (error) {
      console.error('Failed to approve job:', error)
    }
  }

  const handleReject = async (jobId: string) => {
    try {
      await rejectJob(jobId)
      setJobs(jobs.filter(j => j.id !== jobId))
    } catch (error) {
      console.error('Failed to reject job:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">Loading assets...</p>
        </div>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="glass p-8 rounded-xl text-center">
          <ImageIcon size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Assets Yet</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Your uploaded images will appear here
          </p>
          <a href="/design-agent/chat" className="px-4 py-2 bg-primary text-black rounded-xl text-sm font-semibold">
            Go to Chat
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Assets</h1>
          <span className="text-sm text-[var(--text-secondary)]">{assets.length} items</span>
        </div>

        {jobs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Pending Approvals ({jobs.length})</h2>
            <div className="space-y-2">
              {jobs.map(job => (
                <div key={job.id} className="glass p-3 rounded-lg flex items-center justify-between">
                  <span className="text-sm">{job.user_message?.slice(0, 50)}...</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(job.id)}
                      className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleReject(job.id)}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map(asset => (
            <div key={asset.asset_label} className="group relative aspect-square bg-[var(--bg-card)] rounded-xl overflow-hidden">
              {asset.url ? (
                asset.kind === 'video' ? (
                  <video
                    src={asset.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.asset_label}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={32} className="text-[var(--text-secondary)]" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => downloadAsset(asset.url, asset.asset_label)}
                  className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30 transition-all"
                  title="Download"
                >
                  <Download size={16} className="text-primary" />
                </button>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30 transition-all"
                  title="View"
                >
                  <ExternalLink size={16} className="text-primary" />
                </a>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                <p className="text-xs text-white truncate">{asset.asset_label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{asset.kind} • {asset.source_tool}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}