// Canvas layout model: three text blocks (headline, body, CTA) that can sit in any of nine positions.
export const POSITIONS = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const
export const SIZES = ['small', 'medium', 'large', 'huge'] as const
export const ALIGNS = ['left', 'center', 'right'] as const
export type Position = (typeof POSITIONS)[number]
export type BlockKey = 'headline' | 'body' | 'cta'
export type Block = { text: string; position: Position; size: (typeof SIZES)[number]; color: string; fontFamily: string; align: (typeof ALIGNS)[number]; bg: string | null }
export type Layout = Record<BlockKey, Block>

/** Font size as a percentage of the canvas width, so the text scales with the preview and the export. */
export const SIZE_CQW = { small: 2.2, medium: 3.2, large: 5, huge: 7.5 } as const

export function defaultLayout(headline: string, body: string, cta: string, fontFamily: string, accent?: string): Layout {
  return {
    headline: { text: headline, position: 'bottom-left', size: 'huge', color: '#ffffff', fontFamily, align: 'left', bg: null },
    body: { text: body, position: 'bottom-left', size: 'small', color: '#ffffff', fontFamily, align: 'left', bg: null },
    cta: { text: cta, position: 'bottom-left', size: 'medium', color: '#000000', fontFamily, align: 'left', bg: accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#ffffff' },
  }
}

export function positionStyle(pos: Position): { justifyContent: string; alignItems: string } {
  const [v, h] = pos.split('-') as ['top' | 'middle' | 'bottom', 'left' | 'center' | 'right']
  return {
    justifyContent: v === 'top' ? 'flex-start' : v === 'middle' ? 'center' : 'flex-end',
    alignItems: h === 'left' ? 'flex-start' : h === 'center' ? 'center' : 'flex-end',
  }
}
