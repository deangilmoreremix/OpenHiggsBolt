import { chatCompletion } from '@/shared/api/openai'
import type { Slide } from '@/apps/presentation/lib/parser'
import { uid } from '@/shared/utils/uid'

function buildOutlineSystemPrompt(language: string): string {
  return `You are an expert presentation designer. Create a concise, well-structured outline for a presentation.
Respond ONLY with a numbered list of slide titles (one per line). Do not add extra commentary.
Use language: ${language}.`
}

function buildOutlineUserPrompt(
  topic: string,
  numSlides: number,
  language: string,
): string {
  return `Create an outline for a ${numSlides}-slide presentation about: ${topic}
Language: ${language}
Return exactly ${numSlides} slide titles, one per line.`
}

function buildSlideSystemPrompt(
  language: string,
  themeDescription: string,
): string {
  return `You are an expert presentation designer. Generate content for ONE slide.
Theme: ${themeDescription}
Language: ${language}
Return ONLY a JSON object with this shape:
{
  "title": "Slide Title",
  "bullets": ["bullet 1", "bullet 2", "bullet 3"]
}
Do not include markdown code fences or extra commentary.`
}

function buildSlideUserPrompt(
  presentationTitle: string,
  slideTitle: string,
): string {
  return `Presentation: ${presentationTitle}
Slide topic: ${slideTitle}
Generate a clear, engaging slide with a title and 3-5 concise bullet points.`
}

export async function generateOutline(
  topic: string,
  numSlides: number,
  language: string,
  model = 'gpt-4o-mini',
): Promise<string[]> {
  const response = await chatCompletion({
    model,
    messages: [
      { role: 'system', content: buildOutlineSystemPrompt(language) },
      { role: 'user', content: buildOutlineUserPrompt(topic, numSlides, language) },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  })

  return response.text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
}

export async function generateSlideContent(
  presentationTitle: string,
  slideTitle: string,
  language: string,
  themeDescription: string,
  model = 'gpt-4o-mini',
): Promise<Slide> {
  const response = await chatCompletion({
    model,
    messages: [
      { role: 'system', content: buildSlideSystemPrompt(language, themeDescription) },
      { role: 'user', content: buildSlideUserPrompt(presentationTitle, slideTitle) },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  })

  let parsed: { title?: string; bullets?: string[] } = {}
  try {
    const cleaned = response.text.replace(/^```json\s*|\s*```$/gi, '').trim()
    parsed = JSON.parse(cleaned) as typeof parsed
  } catch {
    // Fallback: treat the whole response as a title and split into bullets
    const lines = response.text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    parsed = {
      title: lines[0] ?? slideTitle,
      bullets: lines.slice(1).map((l) => l.replace(/^[-*•]\s*/, '')),
    }
  }

  return {
    id: uid(),
    title: parsed.title?.trim() || slideTitle,
    bullets: parsed.bullets?.filter(Boolean) ?? [],
  }
}

export async function regenerateSingleSlide(
  presentationTitle: string,
  slide: Slide,
  language: string,
  themeDescription: string,
  model = 'gpt-4o-mini',
): Promise<Slide> {
  const fresh = await generateSlideContent(
    presentationTitle,
    slide.title,
    language,
    themeDescription,
    model,
  )
  return { ...fresh, id: slide.id }
}
