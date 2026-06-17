import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, Play, Loader, Send, CheckCircle, X, AlertCircle } from 'lucide-react'
import { useVidecoStore } from '@/stores/videcoStore'

interface CampaignRow {
  name: string
  prompt: string
}

const EXAMPLE_CSV = `name,prompt
"Welcome Video","A professional welcome video for new customers with warm lighting"
"Product Demo","Showcasing our main features with dynamic transitions"
"Thank You","A heartfelt thank you message with brand colors"
"Follow Up","Gentle follow-up video for prospects who haven't responded"
"Onboarding Tip","Quick tip video for new users getting started"`

export default function CampaignBuilder() {
  const [csvText, setCsvText] = useState('')
  const [parsedRows, setParsedRows] = useState<CampaignRow[]>([])
  const [parseError, setParseError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [result, setResult] = useState<{ total: number; rows: number } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { addVideo } = useVidecoStore()

  const parseCSV = useCallback((text: string): CampaignRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
    const nameIdx = headers.indexOf('name')
    const promptIdx = headers.indexOf('prompt')

    if (promptIdx === -1) throw new Error('CSV must have a "prompt" column')
    if (nameIdx === -1) throw new Error('CSV must have a "name" column')

    const rows: CampaignRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      if (cols.length >= 2 && cols[promptIdx]) {
        rows.push({
          name: nameIdx >= 0 ? cols[nameIdx] : `Video ${i}`,
          prompt: cols[promptIdx],
        })
      }
    }

    if (rows.length === 0) throw new Error('No valid data rows found')
    return rows
  }, [])

  const handleCSVChange = (text: string) => {
    setCsvText(text)
    setParseError('')
    setResult(null)

    if (!text.trim()) {
      setParsedRows([])
      return
    }

    try {
      const rows = parseCSV(text)
      setParsedRows(rows)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid CSV format')
      setParsedRows([])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        handleCSVChange(text)
      }
      reader.readAsText(f)
    }
  }

  const handleLoadExample = () => {
    handleCSVChange(EXAMPLE_CSV)
  }

  const handleSubmitCampaign = async () => {
    if (parsedRows.length === 0) return
    setUploading(true)
    setProgress('Creating campaign...')

    try {
      // Call edge function
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-csv`
      const response = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csv_text: csvText,
          source_video_url: sourceUrl || undefined,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Campaign creation failed: ${response.status}`)
      }

      const data = await response.json()

      // Add videos to store
      if (data.videos) {
        data.videos.forEach((v: { id: string }) => {
          addVideo({
            id: v.id,
            tenant_id: 'default',
            name: `Campaign Video`,
            type: 'campaign',
            status: 'processing',
            prompt: '',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        })
      }

      setResult({ total: data.video_count, rows: data.rows })
      setProgress('')
    } catch (err) {
      console.error('Campaign creation error:', err)
      setProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaign Builder</h1>
        <p className="text-secondary mt-1">Bulk generate personalized videos from a CSV file</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Input */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-cyan-400" />
                CSV Data
              </h3>
              <button
                onClick={handleLoadExample}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Load Example
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-3">
              <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">Upload CSV</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-bg-card border border-border-color rounded-lg cursor-pointer hover:border-cyan-500/30 transition-colors">
                  <Upload size={16} className="text-muted" />
                  <span className="text-sm text-secondary truncate">{file?.name || 'Choose CSV file...'}</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
                {file && (
                  <button onClick={() => { setFile(null); handleCSVChange('') }} className="p-2 rounded-lg hover:bg-red-500/20 text-muted">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Manual Input */}
            <div>
              <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1 block">
                Or paste CSV data
              </label>
              <textarea
                value={csvText}
                onChange={(e) => handleCSVChange(e.target.value)}
                placeholder={`name,prompt\n"Welcome","A warm welcome video"\n"Demo","Product demonstration"`}
                rows={10}
                className="w-full bg-bg-card border border-border-color rounded-lg px-3 py-2 text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none resize-none font-mono"
              />
            </div>

            {parseError && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                <AlertCircle size={14} />
                {parseError}
              </div>
            )}
          </div>

          {/* Source Video (optional for campaigns) */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Source Video (Optional)</h3>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://your-base-video.mp4"
              className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none"
            />
            <p className="text-xs text-muted mt-1">A base video used for personalization</p>
          </div>

          <button
            onClick={handleSubmitCampaign}
            disabled={uploading || parsedRows.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            {uploading ? 'Creating Campaign...' : `Create Campaign (${parsedRows.length} videos)`}
          </button>

          {progress && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Loader size={14} className="animate-spin" />
              {progress}
            </div>
          )}
        </div>

        {/* Preview & Results */}
        <div className="space-y-4">
          {/* Column Requirements */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 text-sm">Required Columns</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono">name</span>
                <span className="text-secondary">Video name/title</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono">prompt</span>
                <span className="text-secondary">Video generation prompt</span>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Preview ({parsedRows.length} videos)</h3>
              <div className="max-h-80 overflow-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-secondary text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Prompt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => (
                      <tr key={i} className="border-t border-border-color">
                        <td className="py-2 px-2 text-muted">{i + 1}</td>
                        <td className="py-2 px-2 text-white font-medium">{row.name}</td>
                        <td className="py-2 px-2 text-secondary truncate max-w-[200px]">{row.prompt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="glass-panel rounded-xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle size={20} />
                <h3 className="font-semibold">Campaign Created!</h3>
              </div>
              <p className="text-secondary text-sm">
                Successfully created campaign with <span className="text-white font-medium">{result.total} videos</span>.
                Check the Video Library to monitor processing status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
