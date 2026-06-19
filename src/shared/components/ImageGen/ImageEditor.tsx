'use client'
/**
 * ImageEditor — reference image upload + mask-based inpainting
 * Uses OpenAI /v1/images/edits endpoint (gpt-image-2)
 */
import { useState, useRef, useCallback } from 'react'
import { Upload, X, Brush, Eraser, RotateCcw } from 'lucide-react'
import { panels, buttons, semantic } from '@/shared/styles/designTokens'

interface Props {
  onImageSelected: (file: File) => void
  onMaskCreated: (maskBlob: Blob) => void
  onClear: () => void
  selectedImage: File | null
}

export default function ImageEditor({ onImageSelected, onMaskCreated, onClear, selectedImage }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showMask, setShowMask] = useState(false)
  const [brushSize, setBrushSize] = useState(30)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onImageSelected(file)
    setShowMask(false)
  }, [onImageSelected])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onImageSelected(file)
  }, [onImageSelected])

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.fillStyle = 'rgba(0,0,0,1)'
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const endDraw = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    exportMask()
  }

  const exportMask = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => {
      if (blob) onMaskCreated(blob)
    }, 'image/png')
  }

  const clearMask = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onMaskCreated(new Blob())
  }

  const handleClear = () => {
    setPreviewUrl(null)
    setShowMask(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClear()
  }

  if (!selectedImage || !previewUrl) {
    return (
      <div
        className="rounded-xl p-6 text-center cursor-pointer transition-all"
        style={{ ...panels.glass, borderStyle: 'dashed' }}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm font-medium">Drop an image or click to upload</p>
        <p className="text-xs mt-1" style={{ color: semantic.textMuted }}>
          Use as reference or edit specific regions with a mask
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Image preview with optional mask canvas */}
      <div className="relative rounded-xl overflow-hidden" style={panels.card}>
        <img
          ref={imgRef}
          src={previewUrl}
          alt="Reference"
          className="w-full object-cover"
          style={{ maxHeight: '200px' }}
          onLoad={initCanvas}
        />
        {showMask && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ opacity: 0.6 }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
          />
        )}
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 p-1.5 rounded-lg transition-all"
          style={buttons.iconOverlay}
        >
          <X size={12} />
        </button>
      </div>

      {/* Mask controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowMask(!showMask)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
          style={showMask ? buttons.activePill : buttons.ghost}
        >
          <Brush size={12} />
          {showMask ? 'Mask on' : 'Add mask'}
        </button>

        {showMask && (
          <>
            <button
              onClick={() => setTool('brush')}
              className="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5"
              style={tool === 'brush' ? buttons.activePill : buttons.ghost}
            >
              <Brush size={12} /> Paint
            </button>
            <button
              onClick={() => setTool('eraser')}
              className="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5"
              style={tool === 'eraser' ? buttons.activePill : buttons.ghost}
            >
              <Eraser size={12} /> Erase
            </button>
            <button onClick={clearMask} className="p-1.5 rounded-lg transition-all" style={buttons.ghost}>
              <RotateCcw size={12} />
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs" style={{ color: semantic.textMuted }}>Brush</span>
              <input
                type="range" min={5} max={80} value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="w-20 accent-cyan-400"
              />
            </div>
          </>
        )}
      </div>

      {showMask && (
        <p className="text-xs" style={{ color: semantic.textMuted }}>
          Paint over the areas you want to change. The AI will edit only those regions.
        </p>
      )}
    </div>
  )
}
