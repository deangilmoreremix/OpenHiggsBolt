import { uid } from '@/shared/utils/uid'

export interface Slide {
  id: string
  title: string
  bullets: string[]
  imageQuery?: string
  imageUrl?: string
}

export interface ParsedPresentation {
  title: string
  slides: Slide[]
}

function splitIntoSections(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Try XML <SECTION> first
  if (normalized.includes('<SECTION')) {
    const sections: string[] = []
    const regex = /<SECTION[^>]*>([\s\S]*?)<\/SECTION>/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(normalized)) !== null) {
      sections.push(match[1].trim())
    }
    if (sections.length > 0) return sections
  }

  // Markdown: split on headings like "# Slide 1" or "## Title"
  const headingRegex = /^#{1,2}\s+/m
  if (headingRegex.test(normalized)) {
    const parts = normalized.split(headingRegex).filter(Boolean)
    return parts.map((p) => p.trim())
  }

  // Fallback: split on double newlines where each section looks like a slide
  return normalized
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function extractTitle(section: string): string {
  // XML <H1>
  const h1Match = section.match(/<H1[^>]*>([\s\S]*?)<\/H1>/i)
  if (h1Match) return cleanText(h1Match[1])

  // Markdown heading
  const mdMatch = section.match(/^#{1,2}\s*(.+)$/m)
  if (mdMatch) return cleanText(mdMatch[1])

  // First non-empty line
  const firstLine = section.split('\n').find((line) => line.trim().length > 0)
  if (firstLine) return cleanText(firstLine)

  return 'Slide'
}

function extractBullets(section: string): string[] {
  const bullets: string[] = []

  // XML <BULLETS><DIV>...</DIV></BULLETS>
  const bulletsMatch = section.match(/<BULLETS[^>]*>([\s\S]*?)<\/BULLETS>/i)
  if (bulletsMatch) {
    const divRegex = /<DIV[^>]*>([\s\S]*?)<\/DIV>/gi
    let divMatch: RegExpExecArray | null
    while ((divMatch = divRegex.exec(bulletsMatch[1])) !== null) {
      const text = cleanText(divMatch[1])
      if (text) bullets.push(text)
    }
    if (bullets.length > 0) return bullets
  }

  // Markdown bullets
  const lines = section.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[-*•]\s+/.test(trimmed)) {
      const text = cleanText(trimmed.replace(/^[-*•]\s+/, ''))
      if (text) bullets.push(text)
    } else if (/^\d+[.)]\s+/.test(trimmed)) {
      const text = cleanText(trimmed.replace(/^\d+[.)]\s+/, ''))
      if (text) bullets.push(text)
    }
  }

  if (bullets.length > 0) return bullets

  // Fallback: any remaining non-heading lines
  for (const line of lines) {
    const trimmed = cleanText(line)
    if (!trimmed || /^#{1,2}\s+/.test(line)) continue
    bullets.push(trimmed)
  }

  return bullets
}

function extractImageQuery(section: string): string | undefined {
  const imgMatch = section.match(/<IMG[^>]*query=["']([^"']+)["'][^>]*>/i)
  if (imgMatch) return imgMatch[1]
  const imgAltMatch = section.match(/!\[[^\]]*\]\(([^)]+)\)/)
  if (imgAltMatch) return imgAltMatch[1]
  return undefined
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parsePresentation(text: string): ParsedPresentation {
  const sections = splitIntoSections(text)
  const slides: Slide[] = []

  for (const section of sections) {
    const title = extractTitle(section)
    const bullets = extractBullets(section)
    const imageQuery = extractImageQuery(section)

    // Skip empty sections
    if (title === 'Slide' && bullets.length === 0) continue

    slides.push({
      id: uid(),
      title,
      bullets,
      imageQuery,
    })
  }

  const title =
    text.match(/<TITLE[^>]*>([\s\S]*?)<\/TITLE>/i)?.[1] ??
    text.split('\n')[0]?.replace(/^#\s*/, '').trim() ??
    'Untitled Presentation'

  return { title: cleanText(title), slides }
}

export function parseOutline(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  const items: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cleaned = cleanText(trimmed.replace(/^[-*•]|^\d+[.)]\s*/, '').trim())
    if (cleaned) items.push(cleaned)
  }

  return items
}

export function slidesFromOutline(
  outline: string[],
  presentationTitle: string,
): Slide[] {
  return outline.map((title) => ({
    id: uid(),
    title,
    bullets: [],
  }))
}
