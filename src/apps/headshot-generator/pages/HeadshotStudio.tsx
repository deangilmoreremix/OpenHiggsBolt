import { useEffect, useRef, useState } from 'react'
import {
  Bolt,
  Download,
  Expand,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import {
  AspectRatio,
  buildCreationRecord,
  extractImageUrls,
  generateHeadshot,
  pollPredictionResult,
  saveCreation,
  updateCreation,
} from '../api/headshots'
import { downloadImage, fileToDataUrl, headshotsExamples } from '../utils/headshot'

const ASPECT_RATIOS: AspectRatio[] = [
  { label: '1:1 Square', value: '1:1' },
  { label: '4:3 Classic', value: '4:3' },
  { label: '3:4 Portrait', value: '3:4' },
  { label: '16:9 Landscape', value: '16:9' },
  { label: '9:16 Portrait', value: '9:16' },
]

const PHOTO_CATEGORIES: string[] = [
  'LinkedIn',
  'Tinder',
  'Bumble',
  'OldMoney',
  'Cyberpunk',
  'CEO',
  'CleanGirl',
  'DarkAcademia',
  'Anime',
  'Doctor',
  'Lawyer',
  'MobWife',
  'Bali',
  '90s',
  'Fitness',
  'Christmas',
  'Halloween',
  'EuropeanElegance',
  'ChampionSportsMoment',
  'JobSwapDaydream',
  'TravelTheWorld',
  'DatingPack',
  'FlashPosePerfection',
  'CapAndGown',
  'CorporateBoss',
  'RocknRollLuxury',
  'TheBigWeddingDay',
  'RusticCharm',
  'DressedToImpress',
  'IdentificationPhoto',
  'DontMissYourProm',
  'GoddessOfNature',
  'BlackAndWhiteMagic',
  'HomelyComforts',
  'BalloonsBalloonsBalloons',
  'BeautyBlooms',
  'SuperheroAdventure',
  'BoldFashionStatements',
  'FantasyOutfits',
  'OnTheCatwalk',
  'HalloweenHorror',
  'CosplayGalore',
  'Ghibli',
  'Pixar',
  'SpiderVerse',
].sort()

function ExampleCarousel() {
  return (
    <div className="w-full overflow-hidden relative py-6">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg-app to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg-app to-transparent z-10 pointer-events-none" />
      <div className="flex gap-4 w-max animate-scroll hover:[animation-play-state:paused]">
        {[...headshotsExamples, ...headshotsExamples].map((example, idx) => (
          <div
            key={idx}
            className="w-36 md:w-44 aspect-[3/4] rounded-2xl overflow-hidden relative group border border-border-color bg-bg-card shrink-0"
          >
            <img
              src={example.url}
              alt={example.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1.5 shadow-xl">
              <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">
                AI Generated
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HeadshotStudio() {
  const [category, setCategory] = useState<string>(PHOTO_CATEGORIES[0] ?? 'LinkedIn')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0] ?? { label: '1:1 Square', value: '1:1' })
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [resultUrls, setResultUrls] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Please upload only PNG, JPG, or JPEG images.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.')
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      const dataUrl = await fileToDataUrl(file)
      setReferenceImage(dataUrl)
    } catch (err) {
      setError('Failed to read image. Try a URL instead.')
      console.error(err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    const finalImageUrl = referenceImage || imageUrlInput.trim()
    if (!finalImageUrl) {
      setError('Please provide a reference image.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResultUrls(null)
    setStatusMessage('CALIBRATING SESSION...')
    abortRef.current = new AbortController()

    try {
      const requestId = await generateHeadshot({
        image_url: finalImageUrl,
        category,
        aspect_ratio: aspectRatio.value,
      })

      const record = buildCreationRecord(requestId, category, aspectRatio.value)
      await saveCreation(record)

      setStatusMessage('DEVELOPING PORTRAIT...')
      const result = await pollPredictionResult(requestId, abortRef.current.signal)
      const urls = extractImageUrls(result)

      if (urls.length === 0) {
        throw new Error('Generation completed but no image URLs were returned.')
      }

      record.status = 'completed'
      record.imageUrl = urls.length > 1 ? JSON.stringify(urls) : urls[0]
      record.isPack = urls.length > 1
      await updateCreation(record)

      setResultUrls(urls)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      if (message !== 'Polling cancelled') {
        setError(message)
      }
    } finally {
      setIsGenerating(false)
      setStatusMessage('')
      abortRef.current = null
    }
  }

  const handleDownloadAll = async () => {
    if (!resultUrls || resultUrls.length === 0) return
    setIsDownloading(true)
    for (let i = 0; i < resultUrls.length; i++) {
      await downloadImage(resultUrls[i], `headshot-${category}-${i + 1}.jpg`)
    }
    setIsDownloading(false)
  }

  const clearReference = () => {
    setReferenceImage(null)
    setImageUrlInput('')
  }

  const canGenerate = !isGenerating && (referenceImage || imageUrlInput.trim())

  return (
    <div className="flex flex-col-reverse lg:flex-row flex-1 h-full w-full overflow-y-auto lg:overflow-hidden">
      <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-r border-border-color bg-bg-card/40 backdrop-blur-xl flex flex-col shrink-0 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-border-color space-y-2">
          <h2 className="text-lg font-black tracking-tight text-white">PORTRAIT STUDIO</h2>
          <p className="text-[10px] text-secondary font-medium uppercase tracking-[0.2em]">
            Professional AI Engine
          </p>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Style Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none p-3 bg-bg-card border border-border-color hover:bg-black/30 rounded-xl text-sm font-semibold text-white outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {PHOTO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Wand2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={16} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Reference Image
            </label>

            {!referenceImage ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Reference Image URL..."
                    className="flex-1 bg-bg-card border border-border-color rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary text-white placeholder:text-muted"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept=".png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-11 h-11 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-black transition-all disabled:opacity-50"
                    aria-label="Upload reference image"
                    title="Upload reference image"
                  >
                    {isUploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ImagePlus size={18} />
                    )}
                  </button>
                </div>
                <div className="p-6 border-2 border-dashed border-border-color rounded-xl flex flex-col items-center justify-center gap-2 bg-bg-card/30">
                  <ImagePlus className="text-secondary text-2xl opacity-30" />
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                    Single Photo Required
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative aspect-square rounded-2xl bg-bg-card overflow-hidden group border-2 border-primary/20">
                <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearReference}
                  className="absolute top-2 right-2 bg-danger p-2 rounded-xl text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                  aria-label="Remove reference image"
                  title="Remove reference image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Aspect Ratio
            </label>
            <div className="relative">
              <select
                value={aspectRatio.value}
                onChange={(e) => {
                  const selected = ASPECT_RATIOS.find((r) => r.value === e.target.value)
                  if (selected) setAspectRatio(selected)
                }}
                className="w-full appearance-none p-3 bg-bg-card border border-border-color hover:bg-black/30 rounded-xl text-sm font-semibold text-white outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </option>
                ))}
              </select>
              <Expand className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border-color mt-auto">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full bg-primary text-black rounded-xl py-4 font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-3 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {isGenerating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Bolt size={18} />
            )}
            {isGenerating ? 'Processing...' : 'Generate Headshots'}
          </button>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden min-h-[50vh] lg:min-h-0 shrink-0">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px]" />
        </div>

        <div className="flex-1 relative z-10 p-6 md:p-12 overflow-y-auto flex items-center justify-center custom-scrollbar">
          {!resultUrls && !isGenerating && !error && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-12 space-y-12 animate-fade-in-up">
              <div className="max-w-md w-full text-center space-y-8">
                <div className="relative w-28 h-28 mx-auto group">
                  <div className="absolute inset-0 bg-primary/10 blur-[30px] rounded-full" />
                  <div className="relative w-full h-full bg-bg-card border border-border-color rounded-3xl flex items-center justify-center shadow-sm transition-transform duration-700 group-hover:rotate-12">
                    <Sparkles className="text-3xl text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold tracking-tight uppercase text-white">Studio Ready.</h2>
                  <p className="text-secondary font-medium text-[10px] uppercase tracking-widest leading-loose">
                    Upload your reference and select a category <br />
                    to manifest your professional portrait.
                  </p>
                </div>
              </div>

              <div className="w-full max-w-6xl mx-auto">
                <ExampleCarousel />
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in-up">
              <div className="relative">
                <div className="w-48 h-48 border-2 border-primary/10 rounded-full border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bolt className="text-primary animate-pulse text-2xl" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="text-2xl font-black italic uppercase animate-pulse text-white drop-shadow-sm">
                  {statusMessage}
                </div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                  Session Active
                </div>
              </div>
            </div>
          )}

          {error && !isGenerating && (
            <div className="max-w-sm w-full p-10 bg-danger/5 border-2 border-danger/10 rounded-3xl text-center space-y-4 animate-fade-in-up">
              <div className="text-danger font-black uppercase tracking-[0.4em] text-[10px]">Processing Error</div>
              <p className="text-secondary text-xs font-bold leading-loose text-center">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-4 py-2 rounded-xl bg-bg-card hover:bg-white/5 text-xs font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {resultUrls && !isGenerating && (
            <div className="w-full max-w-5xl animate-fade-in-up">
              {resultUrls.length > 1 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-black uppercase tracking-widest text-white">
                      {category} Pack Generated
                    </h3>
                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      disabled={isDownloading}
                      className="px-6 py-2.5 bg-primary text-black rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      {isDownloading ? 'Downloading...' : 'Download Entire Pack'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {resultUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-2xl overflow-hidden border border-border-color aspect-[3/4] bg-bg-card"
                      >
                        <img src={url} alt={`Result ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => downloadImage(url, `headshot-${category}-${idx + 1}.jpg`)}
                            className="p-3 bg-white text-black rounded-lg transform scale-90 group-hover:scale-100 transition-transform"
                            aria-label={`Download headshot ${idx + 1}`}
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-border-color inline-block max-w-full">
                  <img src={resultUrls[0]} alt="Generated portrait" className="max-h-[80vh] w-auto h-auto" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                    <div className="flex items-end justify-between gap-4">
                      <div className="space-y-3">
                        <h3 className="text-white text-lg font-bold tracking-tight uppercase">{category} Portrait</h3>
                        <div className="px-3 py-1.5 inline-block rounded-lg bg-bg-card/80 backdrop-blur-md text-[10px] font-semibold text-white">
                          {aspectRatio.label}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadImage(resultUrls[0], `headshot-${category}-${Date.now()}.jpg`)}
                        disabled={isDownloading}
                        className="p-3 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                        aria-label="Download portrait"
                      >
                        {isDownloading ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Download size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .animate-scroll {
          animation: scroll 100s linear infinite;
        }
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
