/**
 * Draws a DesignProject onto a 2D context. The context is passed in (and only a small subset of it is
 * used) so the same code serves the live stage, the exporter and unit tests with a recording context.
 */
import { fontString, isHighlighted, textLayout, toRad, type DesignProject, type ImageLayer, type Layer, type ShapeLayer, type TextLayer } from './model'

export type DrawableImage = CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }
/** Loaded pictures keyed by their `src` (layer image or background image). */
export type RenderAssets = Record<string, DrawableImage | undefined>

export interface RenderOptions {
  /** Safe-area guide and selection outline; never part of an export. */
  guides?: boolean
  selectedId?: string | null
}

const sizeOf = (img: DrawableImage) => ({ w: img.naturalWidth ?? (img.width as number) ?? 0, h: img.naturalHeight ?? (img.height as number) ?? 0 })

function backgroundFilter(p: DesignProject): string {
  const b = p.background
  const parts: string[] = []
  if (b.blur > 0) parts.push(`blur(${b.blur}px)`)
  if (b.brightness !== 100) parts.push(`brightness(${b.brightness}%)`)
  if (b.contrast !== 100) parts.push(`contrast(${b.contrast}%)`)
  if (b.saturation !== 100) parts.push(`saturate(${b.saturation}%)`)
  return parts.join(' ')
}

/** Cover-fit an image into the canvas; the blur edge is bled outwards so the filter does not leave a halo. */
function drawBackground(ctx: CanvasRenderingContext2D, p: DesignProject, assets: RenderAssets) {
  const b = p.background
  ctx.save()
  const filter = backgroundFilter(p)
  if (filter && 'filter' in ctx) (ctx as unknown as { filter: string }).filter = filter
  if (b.mode === 'image' && b.imageSrc && assets[b.imageSrc]) {
    const img = assets[b.imageSrc] as DrawableImage
    const { w, h } = sizeOf(img)
    if (w > 0 && h > 0) {
      const bleed = Math.ceil(b.blur * 2)
      const scale = Math.max((p.width + bleed * 2) / w, (p.height + bleed * 2) / h)
      const dw = w * scale
      const dh = h * scale
      ctx.drawImage(img, (p.width - dw) / 2, (p.height - dh) / 2, dw, dh)
    }
  } else if (b.mode === 'gradient') {
    const a = toRad(b.angle)
    const cx = p.width / 2
    const cy = p.height / 2
    const half = (Math.abs(Math.cos(a)) * p.width + Math.abs(Math.sin(a)) * p.height) / 2
    const g = ctx.createLinearGradient(cx - Math.cos(a) * half, cy - Math.sin(a) * half, cx + Math.cos(a) * half, cy + Math.sin(a) * half)
    g.addColorStop(0, b.from)
    g.addColorStop(1, b.to)
    ctx.fillStyle = g
    ctx.fillRect(-2, -2, p.width + 4, p.height + 4)
  } else {
    ctx.fillStyle = b.color
    ctx.fillRect(-2, -2, p.width + 4, p.height + 4)
  }
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.arcTo(x + w, y, x + w, y + rr, rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
  ctx.lineTo(x + rr, y + h)
  ctx.arcTo(x, y + h, x, y + h - rr, rr)
  ctx.lineTo(x, y + rr)
  ctx.arcTo(x, y, x + rr, y, rr)
  ctx.closePath()
}

function drawImageLayer(ctx: CanvasRenderingContext2D, l: ImageLayer, assets: RenderAssets) {
  const img = assets[l.src]
  if (!img) return
  const { w, h } = sizeOf(img)
  if (w <= 0 || h <= 0) return
  const scale = (l.fit === 'cover' ? Math.max : Math.min)(l.w / w, l.h / h)
  const dw = w * scale
  const dh = h * scale
  const dx = -dw / 2
  const dy = -dh / 2
  if (l.fit === 'cover') {
    ctx.beginPath()
    ctx.rect(-l.w / 2, -l.h / 2, l.w, l.h)
    ctx.clip()
  }
  if (l.outline === 'white') {
    // the shadow of a cut-out is its silhouette: offset copies make a crisp outline
    const t = Math.max(3, Math.round(Math.min(l.w, l.h) * 0.012))
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 0
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      ctx.shadowOffsetX = Math.cos(a) * t
      ctx.shadowOffsetY = Math.sin(a) * t
      ctx.drawImage(img, dx, dy, dw, dh)
    }
  } else if (l.outline === 'glow') {
    ctx.shadowColor = 'rgba(255,255,255,0.95)'
    ctx.shadowBlur = Math.max(10, Math.round(Math.min(l.w, l.h) * 0.05))
    ctx.drawImage(img, dx, dy, dw, dh)
  }
  ctx.shadowColor = 'rgba(0,0,0,0)'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.drawImage(img, dx, dy, dw, dh)
}

function drawShapeLayer(ctx: CanvasRenderingContext2D, l: ShapeLayer) {
  const hw = l.w / 2
  const hh = l.h / 2
  ctx.fillStyle = l.fill
  ctx.strokeStyle = l.stroke
  ctx.lineWidth = l.strokeWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  switch (l.shape) {
    case 'circle':
      ctx.beginPath()
      ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2)
      ctx.fill()
      if (l.strokeWidth > 0) ctx.stroke()
      break
    case 'arrow': {
      const head = Math.min(l.h * 0.5, l.w * 0.4)
      ctx.beginPath()
      ctx.moveTo(-hw, 0)
      ctx.lineTo(hw, 0)
      ctx.moveTo(hw - head, -head)
      ctx.lineTo(hw, 0)
      ctx.lineTo(hw - head, head)
      ctx.stroke()
      break
    }
    case 'divider':
      ctx.fillRect(-hw, -hh, l.w, l.h)
      break
    case 'badge':
    case 'rect':
    default:
      roundRect(ctx, -hw, -hh, l.w, l.h, l.shape === 'badge' ? l.h / 2 : l.h * 0.12)
      ctx.fill()
      if (l.strokeWidth > 0 && l.stroke !== 'rgba(0,0,0,0)') ctx.stroke()
      if (l.shape === 'badge' && l.label) {
        ctx.fillStyle = '#ffffff'
        ctx.font = `800 ${Math.round(l.h * 0.5)}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(l.label, 0, 0)
      }
  }
}

function drawTextLayer(ctx: CanvasRenderingContext2D, l: TextLayer) {
  const font = fontString(l)
  ctx.font = font
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${l.letterSpacing}px`
  const measure = (t: string) => ctx.measureText(t).width
  const layout = textLayout(l, (t) => measure(t))
  const pad = l.box ? l.box.padding : 0
  if (l.box) {
    ctx.fillStyle = l.box.color
    roundRect(ctx, -l.w / 2, -l.h / 2, l.w, l.h, l.box.radius)
    ctx.fill()
  }
  const innerW = l.w - pad * 2
  const top = -l.h / 2 + pad + (l.box ? 0 : 0)
  const space = measure(' ')
  layout.lines.forEach((line, i) => {
    const y = top + i * layout.lineHeightPx + (layout.lineHeightPx - l.fontSize) / 2
    const lineW = measure(line)
    const startX = -l.w / 2 + pad + (l.align === 'center' ? (innerW - lineW) / 2 : l.align === 'right' ? innerW - lineW : 0)
    const words = line.split(' ')
    let x = startX
    for (const word of words) {
      const color = isHighlighted(l, word) ? l.highlight.color : l.color
      if (l.strokeWidth > 0) {
        ctx.save()
        if (l.shadow) {
          ctx.shadowColor = l.shadow.color
          ctx.shadowBlur = l.shadow.blur
          ctx.shadowOffsetX = l.shadow.offsetX
          ctx.shadowOffsetY = l.shadow.offsetY
        }
        ctx.lineWidth = l.strokeWidth * 2
        ctx.lineJoin = 'round'
        ctx.strokeStyle = l.strokeColor
        ctx.strokeText(word, x, y)
        ctx.restore()
        ctx.fillStyle = color
        ctx.fillText(word, x, y)
      } else {
        ctx.save()
        if (l.shadow) {
          ctx.shadowColor = l.shadow.color
          ctx.shadowBlur = l.shadow.blur
          ctx.shadowOffsetX = l.shadow.offsetX
          ctx.shadowOffsetY = l.shadow.offsetY
        }
        ctx.fillStyle = color
        ctx.fillText(word, x, y)
        ctx.restore()
      }
      x += measure(word) + space
    }
  })
}

function drawLayer(ctx: CanvasRenderingContext2D, l: Layer, assets: RenderAssets) {
  ctx.save()
  ctx.translate(l.x + l.w / 2, l.y + l.h / 2)
  ctx.rotate(toRad(l.rotation))
  ctx.globalAlpha = Math.max(0, Math.min(1, l.opacity))
  if (l.kind === 'image') drawImageLayer(ctx, l, assets)
  else if (l.kind === 'shape') drawShapeLayer(ctx, l)
  else drawTextLayer(ctx, l)
  ctx.restore()
}

export function renderProject(ctx: CanvasRenderingContext2D, p: DesignProject, assets: RenderAssets, opts: RenderOptions = {}) {
  ctx.clearRect(0, 0, p.width, p.height)
  drawBackground(ctx, p, assets)
  for (const l of p.layers) if (!l.hidden) drawLayer(ctx, l, assets)
  if (opts.guides) {
    ctx.save()
    ctx.setLineDash([8, 6])
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(34,211,238,0.8)'
    const m = Math.round(Math.min(p.width, p.height) * 0.04)
    ctx.strokeRect(m, m, p.width - m * 2, p.height - m * 2)
    const sel = opts.selectedId ? p.layers.find((l) => l.id === opts.selectedId) : null
    if (sel && !sel.hidden) {
      ctx.translate(sel.x + sel.w / 2, sel.y + sel.h / 2)
      ctx.rotate(toRad(sel.rotation))
      ctx.setLineDash([])
      ctx.strokeStyle = '#22d3ee'
      ctx.strokeRect(-sel.w / 2, -sel.h / 2, sel.w, sel.h)
    }
    ctx.restore()
  }
}
