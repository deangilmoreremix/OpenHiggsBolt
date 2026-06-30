'use client'
import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import {
  Music, Loader2, Download, Play, Pause, SkipBack, SkipForward,
  Heart, Plus, Trash2, Wand2, ChevronDown, ChevronUp, List,
  Volume2, VolumeX, RefreshCw, Clock, Mic, Sliders
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Track {
  id: string
  title: string
  prompt: string
  style: string
  lyrics: string
  duration: number
  model: string
  url: string
  coverColor: string
  liked: boolean
  createdAt: string
  bpm?: number
  key?: string
}

interface Playlist {
  id: string
  name: string
  trackIds: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MODELS = [
  { value: 'music-3.0', label: 'Music 3.0', description: 'Best quality, full songs' },
  { value: 'audiogen-2.0', label: 'AudioGen 2.0', description: 'Sound effects & ambient' },
  { value: 'ria', label: 'RIA', description: 'Rhythmic & instrumental' },
  { value: 'musicgen-large', label: 'MusicGen Large', description: 'High fidelity generation' },
]

const DURATIONS = [15, 30, 60, 90, 120, 180, 240]

const STYLE_PRESETS = [
  'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical',
  'R&B', 'Country', 'Metal', 'Lo-fi', 'Ambient', 'Cinematic',
  'Folk', 'Reggae', 'Soul', 'Punk', 'Blues', 'Funk'
]

const MOOD_TAGS = [
  'Upbeat', 'Melancholic', 'Energetic', 'Calm', 'Dark', 'Uplifting',
  'Romantic', 'Aggressive', 'Dreamy', 'Mysterious', 'Happy', 'Epic'
]

const COVER_COLORS = [
  'from-purple-600 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-green-400 to-teal-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-blue-400 to-indigo-600',
  'from-teal-400 to-cyan-500',
  'from-violet-500 to-purple-700',
]

// ── API helpers ───────────────────────────────────────────────────────────────
// The Vite/Electron build doesn't inline NEXT_PUBLIC_* env vars at runtime,
// so we also fall back to the muapi_key stored in localStorage by the
// StandaloneShell so this app works in both web and desktop builds.
const MUAPI_KEY =
  process.env.NEXT_PUBLIC_MUAPI_KEY ||
  (typeof localStorage !== 'undefined' ? localStorage.getItem('muapi_key') : null) ||
  ''
const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
const MUAPI_BASE = 'https://api.muapi.ai/api/v1'

async function generateMusicAPI(params: {
  prompt: string; model: string; duration: number;
  lyrics?: string; bpm?: number; key?: string;
}): Promise<{ url: string; id: string }> {
  const res = await fetch(`${MUAPI_BASE}/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MUAPI_KEY}` },
    body: JSON.stringify({
      prompt: params.prompt,
      model: params.model,
      duration: params.duration,
      ...(params.lyrics && { lyrics: params.lyrics }),
      ...(params.bpm && { bpm: params.bpm }),
      ...(params.key && { key: params.key }),
    })
  })
  if (!res.ok) throw new Error(`MuAPI error: ${res.statusText}`)
  const data = await res.json()
  // Poll if async
  if (data.task_id) {
    return await pollAudio(data.task_id)
  }
  return { url: data.url || data.audio_url, id: data.id || Date.now().toString() }
}

async function pollAudio(taskId: string, attempts = 0): Promise<{ url: string; id: string }> {
  if (attempts > 60) throw new Error('Generation timed out')
  await new Promise(r => setTimeout(r, 3000))
  const res = await fetch(`${MUAPI_BASE}/audio/status/${taskId}`, {
    headers: { 'Authorization': `Bearer ${MUAPI_KEY}` }
  })
  const data = await res.json()
  if (data.status === 'completed' || data.url || data.audio_url) {
    return { url: data.url || data.audio_url, id: taskId }
  }
  if (data.status === 'failed') throw new Error('Generation failed')
  return pollAudio(taskId, attempts + 1)
}

async function enhancePromptWithAI(prompt: string, style: string): Promise<string> {
  if (!OPENAI_KEY) return prompt
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      input: `You are a music production expert. Enhance this music generation prompt to be more detailed and specific for AI music generation. Include specific instrumentation, tempo feel, mood, and production style. Keep it under 200 words.\n\nStyle: ${style}\nOriginal prompt: ${prompt}\n\nEnhanced prompt:`,
      max_output_tokens: 300,
    })
  })
  const data = await res.json()
  return data.output?.[0]?.content?.[0]?.text || prompt
}

async function generateAlbumArt(prompt: string): Promise<string> {
  if (!OPENAI_KEY) return ''
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Album cover art for music: ${prompt}. Abstract, artistic, music-themed. Dark background, vibrant colors.`,
      size: '1024x1024', quality: 'standard', n: 1
    })
  })
  const data = await res.json()
  return data.data?.[0]?.url || ''
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = 'music_studio_tracks'
const PLAYLIST_KEY = 'music_studio_playlists'

function loadTracks(): Track[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveTracks(tracks: Track[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks))
}
function loadPlaylists(): Playlist[] {
  try { return JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]') } catch { return [] }
}
function savePlaylists(playlists: Playlist[]) {
  localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlists))
}

// ── Mini waveform component ───────────────────────────────────────────────────
function Waveform({ isPlaying, progress }: { isPlaying: boolean; progress: number }) {
  const bars = 40
  return (
    <div className="flex items-center gap-[2px] h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const height = 20 + Math.sin(i * 0.8) * 12 + Math.cos(i * 0.3) * 8
        const isFilled = (i / bars) < progress
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-150 ${
              isFilled ? 'bg-cyan-400' : 'bg-white/20'
            } ${isPlaying ? 'animate-pulse' : ''}`}
            style={{
              height: `${height}px`,
              animationDelay: `${i * 50}ms`,
              animationDuration: `${600 + (i % 5) * 100}ms`
            }}
          />
        )
      })}
    </div>
  )
}

// ── Album cover component ─────────────────────────────────────────────────────
function AlbumCover({ track, size = 'md' }: { track: Track; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-48 h-48' }
  return (
    <div className={`${sizes[size]} rounded-lg bg-gradient-to-br ${track.coverColor} flex items-center justify-center flex-shrink-0`}>
      <Music className="text-white/70" size={size === 'lg' ? 48 : size === 'md' ? 20 : 14} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MusicStudio() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'generate' | 'library' | 'playlists'>('generate')

  // Generation state
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [duration, setDuration] = useState(30)
  const [model, setModel] = useState('music-3.0')
  const [bpm, setBpm] = useState<number | ''>('')
  const [musicalKey, setMusicalKey] = useState('')
  const [batchCount, setBatchCount] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState('')

  // Library state
  const [tracks, setTracks] = useState<Track[]>(loadTracks)
  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylists)
  const [searchQuery, setSearchQuery] = useState('')
  const [newPlaylistName, setNewPlaylistName] = useState('')

  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Persist tracks
  useEffect(() => { saveTracks(tracks) }, [tracks])
  useEffect(() => { savePlaylists(playlists) }, [playlists])

  // Audio player sync
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
    }
    const onLoadedMetadata = () => setTotalTime(audio.duration || 0)
    const onEnded = () => { setIsPlaying(false); setProgress(0) }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [currentTrack])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const playTrack = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
      else { audioRef.current?.play(); setIsPlaying(true) }
    } else {
      setCurrentTrack(track)
      setIsPlaying(true)
      setTimeout(() => { audioRef.current?.play().catch(() => {}) }, 100)
    }
  }, [currentTrack, isPlaying])

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
  }

  const skipTrack = (direction: 'prev' | 'next') => {
    if (!currentTrack) return
    const idx = tracks.findIndex(t => t.id === currentTrack.id)
    const nextIdx = direction === 'next' ? (idx + 1) % tracks.length : (idx - 1 + tracks.length) % tracks.length
    if (tracks[nextIdx]) playTrack(tracks[nextIdx])
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  // Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setGenerationProgress(0)

    const steps = [
      'Preparing generation...',
      'Processing music parameters...',
      'Generating audio...',
      'Applying style and mood...',
      'Finalizing track...'
    ]

    let stepIdx = 0
    const progressTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1)
      setGenerationStep(steps[stepIdx])
      setGenerationProgress(prev => Math.min(prev + (100 / (batchCount * 20)), 90))
    }, 3000)

    try {
      const fullPrompt = [prompt, style].filter(Boolean).join('. ')
      const results = await Promise.all(
        Array.from({ length: batchCount }).map(() =>
          generateMusicAPI({
            prompt: fullPrompt,
            model,
            duration,
            lyrics: lyrics || undefined,
            bpm: bpm || undefined,
            key: musicalKey || undefined,
          })
        )
      )

      const newTracks: Track[] = results.map((r, i) => ({
        id: `${Date.now()}-${i}`,
        title: prompt.slice(0, 40) + (batchCount > 1 ? ` (v${i + 1})` : ''),
        prompt: fullPrompt,
        style,
        lyrics,
        duration,
        model,
        url: r.url,
        coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
        liked: false,
        createdAt: new Date().toISOString(),
        bpm: bpm || undefined,
        key: musicalKey || undefined,
      }))

      setTracks(prev => [...newTracks, ...prev])
      setCurrentTrack(newTracks[0])
      setIsPlaying(true)
      setTimeout(() => { audioRef.current?.play().catch(() => {}) }, 200)
      setGenerationProgress(100)
      setGenerationStep('Done!')
      setActiveTab('library')
    } catch (err) {
      console.error(err)
      setGenerationStep('Generation failed. Please try again.')
    } finally {
      clearInterval(progressTimer)
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
        setGenerationStep('')
      }, 1500)
    }
  }

  const handleEnhance = async () => {
    if (!prompt.trim()) return
    setIsEnhancing(true)
    try {
      const enhanced = await enhancePromptWithAI(prompt, style)
      setPrompt(enhanced)
    } catch (err) { console.error(err) }
    finally { setIsEnhancing(false) }
  }

  const toggleLike = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, liked: !t.liked } : t))
  }

  const deleteTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id))
    if (currentTrack?.id === id) { setCurrentTrack(null); setIsPlaying(false) }
  }

  const addToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] }
        : p
    ))
  }

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return
    setPlaylists(prev => [...prev, { id: Date.now().toString(), name: newPlaylistName, trackIds: [] }])
    setNewPlaylistName('')
  }

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.style.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const likedTracks = tracks.filter(t => t.liked)

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Hidden audio element */}
      {currentTrack && <audio ref={audioRef} src={currentTrack.url} preload="metadata" />}

      {/* Header */}
      <div className="flex-none border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold">Music Studio</h1>
          </div>
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['generate', 'library', 'playlists'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  activeTab === tab ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {tab} {tab === 'library' && `(${tracks.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── GENERATE TAB ── */}
        {activeTab === 'generate' && (
          <div className="max-w-2xl mx-auto p-6 space-y-4">

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Music Prompt</label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="An upbeat pop song about summer adventures with catchy hooks and energetic drums..."
                  className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-3 pr-12 resize-none text-sm focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleEnhance}
                  disabled={isEnhancing || !prompt.trim()}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-40"
                  title="AI Enhance prompt"
                >
                  {isEnhancing ? <Loader2 size={14} className="animate-spin text-cyan-400" /> : <Wand2 size={14} className="text-cyan-400" />}
                </button>
              </div>
              <p className="text-xs text-white/30 mt-1">Click ✨ to AI-enhance your prompt with OpenAI</p>
            </div>

            {/* Style tags */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Style Tags</label>
              <input
                value={style}
                onChange={e => setStyle(e.target.value)}
                placeholder="pop, upbeat, catchy, drums, guitar..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500/50"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[...STYLE_PRESETS, ...MOOD_TAGS].slice(0, 12).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setStyle(prev => prev ? `${prev}, ${tag.toLowerCase()}` : tag.toLowerCase())}
                    className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all border border-white/10"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Model + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Model</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  {DURATIONS.map(d => (
                    <option key={d} value={d}>{d < 60 ? `${d}s` : `${d / 60}min`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lyrics toggle */}
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-all"
            >
              <Mic size={14} />
              {showLyrics ? 'Hide' : 'Add'} Lyrics
              {showLyrics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showLyrics && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Lyrics</label>
                <textarea
                  value={lyrics}
                  onChange={e => setLyrics(e.target.value)}
                  placeholder="[Verse 1]&#10;Your lyrics here...&#10;&#10;[Chorus]&#10;Catchy hook..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            )}

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-all"
            >
              <Sliders size={14} />
              Advanced Parameters
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-3 gap-3 p-4 bg-white/5 rounded-xl">
                <div>
                  <label className="block text-xs text-white/50 mb-1">BPM</label>
                  <input
                    type="number" min={60} max={200} value={bpm}
                    onChange={e => setBpm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="120"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Key</label>
                  <select
                    value={musicalKey}
                    onChange={e => setMusicalKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none"
                  >
                    <option value="">Auto</option>
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                      <Fragment key={k}>
                        <option value={`${k} major`}>{k} major</option>
                        <option value={`${k} minor`}>{k} minor</option>
                      </Fragment>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Variations</label>
                  <select
                    value={batchCount}
                    onChange={e => setBatchCount(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none"
                  >
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{generationStep || 'Generating...'}</span>
                </>
              ) : (
                <>
                  <Music size={20} />
                  Generate {batchCount > 1 ? `${batchCount} Variations` : 'Music'}
                </>
              )}
            </button>

            {/* Progress bar */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 text-center">{generationStep}</p>
              </div>
            )}
          </div>
        )}

        {/* ── LIBRARY TAB ── */}
        {activeTab === 'library' && (
          <div className="p-4 space-y-3">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tracks..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500/50"
            />
            {filteredTracks.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <Music size={48} className="mx-auto mb-4 opacity-30" />
                <p>No tracks yet. Generate some music!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group ${
                      currentTrack?.id === track.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-8 text-center text-white/30 text-sm group-hover:hidden">
                      {idx + 1}
                    </div>
                    <button className="w-8 hidden group-hover:flex items-center justify-center">
                      {currentTrack?.id === track.id && isPlaying
                        ? <Pause size={14} className="text-cyan-400" />
                        : <Play size={14} className="text-white" />
                      }
                    </button>
                    <AlbumCover track={track} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.title}</p>
                      <p className="text-xs text-white/40 truncate">{track.style || track.model}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={e => { e.stopPropagation(); toggleLike(track.id) }}
                        className={`p-1.5 rounded-lg transition-all ${track.liked ? 'text-pink-400' : 'text-white/30 hover:text-pink-400'}`}
                      >
                        <Heart size={14} fill={track.liked ? 'currentColor' : 'none'} />
                      </button>
                      <a
                        href={track.url}
                        download={`${track.title}.mp3`}
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white transition-all"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={e => { e.stopPropagation(); deleteTrack(track.id) }}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <span className="text-xs text-white/30 ml-2">
                      {formatTime(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLAYLISTS TAB ── */}
        {activeTab === 'playlists' && (
          <div className="p-4 space-y-4">
            {/* Liked songs */}
            <div className="p-4 bg-gradient-to-br from-pink-900/40 to-purple-900/40 rounded-xl border border-pink-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Heart size={20} className="text-pink-400" fill="currentColor" />
                <h3 className="font-semibold">Liked Songs</h3>
                <span className="text-white/40 text-sm">{likedTracks.length} tracks</span>
              </div>
              {likedTracks.length > 0 && (
                <button
                  onClick={() => { if (likedTracks[0]) playTrack(likedTracks[0]) }}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Play size={14} /> Play All
                </button>
              )}
            </div>

            {/* Create playlist */}
            <div className="flex gap-2">
              <input
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="New playlist name..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && createPlaylist()}
              />
              <button
                onClick={createPlaylist}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Create
              </button>
            </div>

            {/* Playlists */}
            {playlists.map(playlist => (
              <div key={playlist.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <List size={16} className="text-cyan-400" />
                    <h3 className="font-medium">{playlist.name}</h3>
                    <span className="text-white/40 text-sm">{playlist.trackIds.length} tracks</span>
                  </div>
                </div>
                {playlist.trackIds.length === 0 ? (
                  <p className="text-xs text-white/30">No tracks yet. Add from your library.</p>
                ) : (
                  <div className="space-y-1 mt-2">
                    {playlist.trackIds.map(tid => {
                      const t = tracks.find(x => x.id === tid)
                      if (!t) return null
                      return (
                        <div key={tid} onClick={() => playTrack(t)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                          <AlbumCover track={t} size="sm" />
                          <span className="text-sm truncate">{t.title}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM PLAYER ── */}
      {currentTrack && (
        <div className="flex-none border-t border-white/10 bg-black/80 backdrop-blur-xl p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Waveform / progress */}
            <div
              className="cursor-pointer"
              onClick={seekTo}
            >
              <Waveform isPlaying={isPlaying} progress={progress} />
            </div>

            <div className="flex items-center gap-4">
              {/* Track info */}
              <div className="flex items-center gap-3 w-1/3 min-w-0">
                <AlbumCover track={currentTrack} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                  <p className="text-xs text-white/40 truncate">{currentTrack.style || currentTrack.model}</p>
                </div>
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className={`flex-shrink-0 p-1 ${currentTrack.liked ? 'text-pink-400' : 'text-white/30 hover:text-pink-400'} transition-all`}
                >
                  <Heart size={16} fill={currentTrack.liked ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 flex-1 justify-center">
                <button onClick={() => skipTrack('prev')} className="text-white/50 hover:text-white transition-all">
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={() => {
                    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
                    else { audioRef.current?.play(); setIsPlaying(true) }
                  }}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-white/90 transition-all"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button onClick={() => skipTrack('next')} className="text-white/50 hover:text-white transition-all">
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Time + Volume */}
              <div className="flex items-center gap-3 w-1/3 justify-end">
                <span className="text-xs text-white/40 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(totalTime)}
                </span>
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white transition-all">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false) }}
                  className="w-20 accent-cyan-400"
                />
                <a
                  href={currentTrack.url}
                  download={`${currentTrack.title}.mp3`}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white transition-all"
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
