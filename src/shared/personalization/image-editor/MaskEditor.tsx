'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Brush, Eraser, RotateCcw, Square, Wand2 } from 'lucide-react'

type Tool = 'brush' | 'eraser' | 'rectangle'

type Props = {
  imageUrl: string
  active: boolean
  onMaskChange: (mask: Blob | null) => void
}

const C = {
  border: 'rgba(255,255,255,.12)',
  muted: 'rgba(255,255,255,.58)',
  cyan: '#29d3f2',
  cyanSoft: 'rgba(41,211,242,.12)',
  panel: '#12171c',
}

export default function MaskEditor({ imageUrl, active, onMaskChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [tool, setTool] = useState<Tool>('brush')
  const [brushSize, setBrushSize] = useState(64)
  const [drawing, setDrawing] = useState(false)
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null)
  const [hasMask, setHasMask] = useState(false)

  const initialize = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasMask(false)
    onMaskChange(null)
  }, [onMaskChange])

  useEffect(() => {
    if (!active) {
      setDrawing(false)
      setRectStart(null)
    }
  }, [active])

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const exportMask = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      onMaskChange(blob)
      setHasMask(true)
    }, 'image/png')
  }, [onMaskChange])

  const drawPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || tool === 'rectangle') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = pointFromEvent(event)
    ctx.save()
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.fillStyle = 'rgba(255,255,255,1)'
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrawing(true)
    if (tool === 'rectangle') {
      setRectStart(pointFromEvent(event))
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = pointFromEvent(event)
    ctx.save()
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.fillStyle = 'rgba(255,255,255,1)'
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawPoint(event)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    if (tool === 'rectangle' && rectStart) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        const end = pointFromEvent(event)
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(255,255,255,1)'
        ctx.fillRect(rectStart.x, rectStart.y, end.x - rectStart.x, end.y - rectStart.y)
        ctx.restore()
      }
    }
    setDrawing(false)
    setRectStart(null)
    exportMask()
  }

  const clearMask = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasMask(false)
    onMaskChange(null)
  }

  const invertMask = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < image.data.length; i += 4) {
      const alpha = image.data[i + 3]
      image.data[i] = 255
      image.data[i + 1] = 255
      image.data[i + 2] = 255
      image.data[i + 3] = 255 - alpha
    }
    ctx.putImageData(image, 0, 0)
    exportMask()
  }

  if (!active) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl p-2" style={{ background: C.panel, border: '1px solid ' + C.border }}>
        <button type="button" onClick={() => setTool('brush')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold" style={{ background: tool === 'brush' ? C.cyanSoft : 'transparent', color: tool === 'brush' ? C.cyan : C.muted }}>
          <Brush size={13} /> Brush
        </button>
        <button type="button" onClick={() => setTool('eraser')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold" style={{ background: tool === 'eraser' ? C.cyanSoft : 'transparent', color: tool === 'eraser' ? C.cyan : C.muted }}>
          <Eraser size={13} /> Erase
        </button>
        <button type="button" onClick={() => setTool('rectangle')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold" style={{ background: tool === 'rectangle' ? C.cyanSoft : 'transparent', color: tool === 'rectangle' ? C.cyan : C.muted }}>
          <Square size={13} /> Box
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px]" style={{ color: C.muted }}>Brush</span>
          <input type="range" min={8} max={240} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24 accent-cyan-400" />
        </div>
        <button type="button" onClick={invertMask} disabled={!hasMask} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold disabled:opacity-40" style={{ color: C.muted, border: '1px solid ' + C.border }}>
          <Wand2 size={13} /> Invert
        </button>
        <button type="button" onClick={clearMask} disabled={!hasMask} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold disabled:opacity-40" style={{ color: C.muted, border: '1px solid ' + C.border }}>
          <RotateCcw size={13} /> Clear
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-black">
        <img ref={imageRef} src={imageUrl} alt="Mask target" className="block max-h-[60vh] w-full object-contain" onLoad={initialize} />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
          style={{ opacity: 0.48, filter: 'drop-shadow(0 0 4px rgba(41,211,242,.8))' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <p className="text-[10px] leading-4" style={{ color: C.muted }}>
        Paint the region you want SmartVideo GO AI to change. The generated PNG mask keeps the source image dimensions and alpha channel required by the image edit API.
      </p>
    </div>
  )
}
