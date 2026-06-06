import { useState, useEffect } from 'react'
import { Download, Trash2, Image as ImageIcon } from 'lucide-react'
import { getSessionAssets, deleteSession } from '@/api/designAgent'
import { Asset, Session } from '@/types/designAgent'

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const sessionId = localStorage.getItem('design_agent_session_id')
      if (sessionId) {
        setSession({ id: sessionId, createdAt: '', updatedAt: '', status: 'active' })
        const sessionAssets = await getSessionAssets(sessionId)
        setAssets(sessionAssets)
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadAsset = async (url: string, label: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = label
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch {
      window.open(url, '_blank')
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map(asset => (
            <div key={asset.label} className="group relative aspect-square bg-[var(--bg-card)] rounded-xl overflow-hidden">
              {asset.thumbnailUrl ? (
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={32} className="text-[var(--text-secondary)]" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => downloadAsset(asset.url, asset.label)}
                  className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30 transition-all"
                  title="Download"
                >
                  <Download size={16} className="text-primary" />
                </button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                <p className="text-xs text-white truncate">{asset.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}