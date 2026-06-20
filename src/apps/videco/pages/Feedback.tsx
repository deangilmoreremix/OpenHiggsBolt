import { useEffect, useState, useCallback } from 'react'
import { MessageSquare, Search, Loader, ChevronLeft, ChevronRight, Download } from 'lucide-react'

interface FeedbackItem {
  id: string
  video_id: string | null
  question: string | null
  answer: string | null
  user_id: string | null
  created_at: string
}

export default function Feedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const limit = 25

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-feedback?tenant_id=default&page=${page}&limit=${limit}`
      const response = await fetch(fnUrl)
      if (response.ok) {
        const result = await response.json()
        let filtered = result.feedback ?? []
        if (search) {
          const s = search.toLowerCase()
          filtered = filtered.filter((f: FeedbackItem) =>
            (f.question?.toLowerCase().includes(s) ||
            f.answer?.toLowerCase().includes(s))
          )
        }
        setFeedback(filtered)
        setTotal(result.total ?? 0)
        setTotalPages(result.total_pages ?? 1)
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, limit])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const handleExport = () => {
    if (feedback.length === 0) return
    const headers = ['Question', 'Answer', 'User ID', 'Date']
    const rows = feedback.map((f) => [
      f.question ?? '',
      (f.answer ?? '').replace(/,/g, ';'),
      f.user_id ?? '',
      new Date(f.created_at).toLocaleString(),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="text-secondary mt-1">{total} survey responses</p>
        </div>
        <button
          onClick={handleExport}
          disabled={feedback.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 font-medium rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-400" size={32} />
        </div>
      ) : feedback.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center">
          <MessageSquare size={48} className="text-muted mx-auto mb-4" />
          <p className="text-secondary text-lg">No feedback yet</p>
          <p className="text-muted text-sm mt-1">Survey responses from your video embeds will appear here</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-secondary text-xs uppercase tracking-wider border-b border-border-color">
                  <th className="text-left py-3 px-4">Question</th>
                  <th className="text-left py-3 px-4">Answer</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item) => (
                  <tr key={item.id} className="border-b border-border-color hover:bg-bg-card/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{item.question ?? '—'}</td>
                    <td className="py-3 px-4 text-secondary max-w-sm">{item.answer ?? '—'}</td>
                    <td className="py-3 px-4 text-muted">{item.user_id ?? '—'}</td>
                    <td className="py-3 px-4 text-muted">{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} className="text-secondary" />
          </button>
          <span className="text-sm text-secondary">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg hover:bg-bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} className="text-secondary" />
          </button>
        </div>
      )}
    </div>
  )
}
