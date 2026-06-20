import { useState, useCallback } from 'react'
import { supabase } from '@/shared/api/supabase'
import { Upload, Loader, CheckCircle, FileVideo, X } from 'lucide-react'
import { useVidecoStore } from '@/shared/api/videcoStore'

export default function VideoUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [results, setResults] = useState<{ name: string; url: string; error?: string }[]>([])
  const { addVideo } = useVidecoStore()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('video/')
    )
    setFiles((prev) => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return
    setUploading(true)
    setResults([])

    for (const file of files) {
      try {
        setProgress((prev) => ({ ...prev, [file.name]: 10 }))

        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('videco-videos')
          .upload(fileName, file, { upsert: false })

        if (uploadError) throw uploadError

        setProgress((prev) => ({ ...prev, [file.name]: 60 }))

        const { data: urlData } = supabase.storage
          .from('videco-videos')
          .getPublicUrl(fileName)

        const publicUrl = urlData.publicUrl

        setProgress((prev) => ({ ...prev, [file.name]: 80 }))

        // Create video record
        const { data: video, error: dbError } = await supabase
          .from('videco_videos')
          .insert({
            name: file.name,
            type: 'upload',
            status: 'completed',
            generated_url: publicUrl,
            thumbnail_url: publicUrl,
          })
          .select()
          .single()

        if (dbError) throw dbError
        if (video) addVideo(video)

        setProgress((prev) => ({ ...prev, [file.name]: 100 }))
        setResults((prev) => [...prev, { name: file.name, url: publicUrl }])
      } catch (err) {
        console.error('Upload error:', err)
        setResults((prev) => [
          ...prev,
          { name: file.name, url: '', error: err instanceof Error ? err.message : 'Upload failed' },
        ])
        setProgress((prev) => ({ ...prev, [file.name]: -1 }))
      }
    }

    setUploading(false)
    setFiles([])
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Videos</h1>
        <p className="text-secondary mt-1">Upload your video files to use in campaigns and clones</p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="glass-panel rounded-xl p-12 border-2 border-dashed border-border-color hover:border-cyan-500/50 transition-colors text-center cursor-pointer"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload size={48} className="text-muted mx-auto mb-4" />
        <p className="text-white font-medium text-lg">Drop video files here or click to browse</p>
        <p className="text-secondary text-sm mt-1">Supports MP4, MOV, WebM, AVI</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="glass-panel rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Files to upload ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 bg-bg-card rounded-lg">
                <FileVideo size={20} className="text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-muted">{formatSize(file.size)}</p>
                </div>
                {uploading ? (
                  <div className="w-20">
                    {(progress[file.name] ?? 0) >= 0 ? (
                      <div className="w-full bg-bg-panel rounded-full h-1.5">
                        <div
                          className="bg-cyan-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(progress[file.name] ?? 0, 100)}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="glass-panel rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Upload Results</h3>
          <div className="space-y-2">
            {results.map((result, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                result.error ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}>
                {result.error ? (
                  <X size={18} className="text-red-400 flex-shrink-0" />
                ) : (
                  <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                )}
                <span className="text-sm text-white flex-1 truncate">{result.name}</span>
                {result.error ? (
                  <span className="text-xs text-red-400">{result.error}</span>
                ) : (
                  <span className="text-xs text-green-400">Uploaded</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
