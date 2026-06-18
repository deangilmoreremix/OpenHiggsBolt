import { useEffect, useState } from 'react'
import { CalendarDays, Download, Expand, Loader2, Sparkles, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  clearCreations,
  CreationRecord,
  loadCreations,
  parseImageUrls,
} from '../api/headshots'
import { downloadImage } from '../utils/headshot'

export default function HeadshotHistory() {
  const navigate = useNavigate()
  const [creations, setCreations] = useState<CreationRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selected, setSelected] = useState<CreationRecord | null>(null)
  const [downloading, setDownloading] = useState<boolean>(false)
  const [clearing, setClearing] = useState<boolean>(false)

  const fetchCreations = async () => {
    try {
      setLoading(true)
      const data = await loadCreations()
      setCreations(data)
    } catch (err) {
      console.error('Error fetching creations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCreations()
  }, [])

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear your headshot history?')) return
    try {
      setClearing(true)
      await clearCreations()
      setCreations([])
      setSelected(null)
    } catch (err) {
      console.error('Error clearing creations:', err)
    } finally {
      setClearing(false)
    }
  }

  const handleDownloadAll = async (urls: string[]) => {
    if (urls.length === 0) return
    setDownloading(true)
    for (let i = 0; i < urls.length; i++) {
      await downloadImage(urls[i], `headshot-${selected?.category ?? 'creation'}-${i + 1}.jpg`)
    }
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-10 space-y-3">
        <div className="flex items-center gap-3 text-primary mb-1">
          <CalendarDays size={16} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em]">Historical Archive</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">MY HEADSHOTS</h1>
            <p className="text-secondary font-medium text-xs uppercase tracking-widest leading-loose max-w-xl mt-3">
              Your generative legacy, manifested and stored. Quick access to your visual nodes.
            </p>
          </div>
          {creations.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Clear history
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {creations.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-bg-card border border-border-color flex items-center justify-center shadow-sm">
              <Sparkles className="text-3xl text-secondary" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold italic text-white">COLLECTION EMPTY</h3>
              <button
                type="button"
                onClick={() => navigate('/headshot-generator')}
                className="px-8 py-3 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-primary-hover shadow-lg shadow-primary/20"
              >
                Start your first manifestation
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creations.map((item, index) => {
              const urls = parseImageUrls(item.imageUrl)
              const thumbnail = urls[0]
              const isPack = urls.length > 1

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className="group relative rounded-xl bg-bg-card border border-border-color aspect-square cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-all text-left animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {item.status === 'completed' ? (
                    <div className="w-full h-full relative">
                      <img
                        src={thumbnail}
                        alt={item.category}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {isPack && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-md text-[8px] font-black text-white uppercase tracking-widest backdrop-blur-md">
                          Pack of {urls.length}
                        </div>
                      )}
                    </div>
                  ) : item.status === 'failed' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-danger/10 gap-3">
                      <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center text-danger">
                        <X size={18} />
                      </div>
                      <span className="text-[10px] font-black text-danger uppercase tracking-widest">Failed</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card gap-4">
                      <Loader2 size={32} className="text-primary animate-spin" />
                      <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] animate-pulse">
                        Manifesting...
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-4 flex flex-col justify-end">
                    <p className="text-white text-xs font-semibold tracking-tight truncate mb-1 uppercase">
                      {item.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-primary uppercase tracking-widest">
                        {item.aspectRatio}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-bg-card/80 backdrop-blur-md flex items-center justify-center text-white">
                        <Expand size={12} />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 md:p-12 flex flex-col items-center justify-center"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Creation details"
        >
          <div
            className="relative max-w-6xl w-full max-h-full bg-bg-card border border-border-color rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-secondary hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="flex w-full md:w-1/2 h-[50vh] md:h-auto p-2 bg-bg-card border-b md:border-b-0 md:border-r border-border-color overflow-y-auto custom-scrollbar">
              <CreationImages creation={selected} />
            </div>

            <div className="flex w-full md:w-1/2 p-6 md:p-8 flex-col bg-bg-card overflow-y-auto custom-scrollbar">
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <div className="text-[9px] font-semibold text-secondary uppercase tracking-widest flex items-center gap-2">
                    {parseImageUrls(selected.imageUrl).length > 1 ? 'Headshot Pack' : 'Single Portrait'}
                  </div>
                  <p className="text-sm font-medium text-white">{selected.category}</p>
                </div>

                <div className="space-y-6 border-t border-white/5 pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-semibold text-secondary uppercase tracking-widest">Ratio</div>
                      <div className="text-xs text-white font-medium">{selected.aspectRatio}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-semibold text-secondary uppercase tracking-widest">Resolution</div>
                      <div className="text-xs text-white font-medium">Professional HD</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[9px] font-semibold text-secondary uppercase tracking-widest">Timestamp</div>
                    <div className="text-[11px] text-secondary">
                      {new Date(selected.createdAt).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleDownloadAll(parseImageUrls(selected.imageUrl))}
                  disabled={downloading || selected.status !== 'completed'}
                  className="w-full py-3 bg-primary text-black rounded-xl font-bold tracking-wider uppercase text-[10px] flex items-center justify-center gap-3 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {downloading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {selected.status === 'completed'
                    ? downloading
                      ? 'Extracting...'
                      : parseImageUrls(selected.imageUrl).length > 1
                        ? 'Download All'
                        : 'Download Piece'
                    : 'Generating...'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreationImages({ creation }: { creation: CreationRecord }) {
  const urls = parseImageUrls(creation.imageUrl)

  if (creation.status === 'completed') {
    return (
      <div className="w-full flex flex-col gap-4">
        {urls.length > 1 ? (
          <div className="grid grid-cols-2 gap-2">
            {urls.map((url, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-border-color aspect-[3/4]">
                <img src={url} className="w-full h-full object-cover" alt={`Result ${idx + 1}`} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => downloadImage(url, `creation-${creation.category}-${idx + 1}.jpg`)}
                    className="p-2 bg-white text-black rounded-lg transform scale-90 group-hover:scale-100 transition-transform shadow-xl"
                    aria-label={`Download creation ${idx + 1}`}
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <img src={urls[0]} className="h-full w-full object-contain" alt="Creation" />
        )}
      </div>
    )
  }

  if (creation.status === 'failed') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-danger/5 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center text-danger">
          <X size={28} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-sm font-bold text-danger uppercase tracking-widest">Generation Failed</h3>
          <p className="text-xs text-secondary max-w-xs">{creation.error || 'An unknown error occurred.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card gap-6">
      <Loader2 size={48} className="text-primary animate-spin" />
      <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] animate-pulse">
        Manifesting...
      </span>
    </div>
  )
}
