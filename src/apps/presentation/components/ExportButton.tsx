import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import PptxGenJS from 'pptxgenjs'
import type { Slide } from '@/apps/presentation/lib/parser'
import { getThemeById, type ThemeName } from '@/apps/presentation/lib/themes'

interface ExportButtonProps {
  title: string
  slides: Slide[]
  theme: ThemeName
  disabled?: boolean
}

export default function ExportButton({
  title,
  slides,
  theme: themeId,
  disabled,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting || slides.length === 0) return
    setIsExporting(true)
    try {
      const theme = getThemeById(themeId)
      const pptx = new PptxGenJS()
      pptx.layout = 'LAYOUT_16x9'

      for (const slide of slides) {
        const pptxSlide = pptx.addSlide()
        const bgHex = theme.colors.background.replace('#', '')
        pptxSlide.background = { color: bgHex }

        pptxSlide.addText(slide.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 1,
          fontSize: 32,
          bold: true,
          color: theme.colors.heading.replace('#', ''),
          fontFace: theme.fonts.heading,
          align: 'left',
        })

        if (slide.bullets.length > 0) {
          pptxSlide.addText(
            slide.bullets.map((b) => ({ text: b, options: { breakLine: true } })),
            {
              x: 0.5,
              y: 1.6,
              w: '90%',
              h: 3.5,
              fontSize: 18,
              color: theme.colors.text.replace('#', ''),
              fontFace: theme.fonts.body,
              bullet: { type: 'number' },
            },
          )
        }

        if (slide.imageUrl) {
          try {
            pptxSlide.addImage({
              path: slide.imageUrl,
              x: 6,
              y: 1.5,
              w: 3.5,
              h: 3.5,
              sizing: { type: 'contain', w: 3.5, h: 3.5 },
            })
          } catch {
            // ignore image export errors
          }
        }
      }

      await pptx.writeFile({ fileName: `${title || 'presentation'}.pptx` })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || slides.length === 0}
      className="px-4 py-2 bg-bg-card rounded-xl text-sm hover:bg-border-color transition-all flex items-center gap-2 disabled:opacity-50"
    >
      {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      Export PPTX
    </button>
  )
}
