import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import { rateLimit, rateLimit429 } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 120

const RESPONSES_URL = 'https://api.openai.com/v1/responses'
const ORCHESTRATOR_MODEL = process.env.SMARTVIDEO_RESPONSES_MODEL || 'gpt-6-astra'
const MAX_REFERENCES = 6
const MAX_DATA_URL_CHARS = 14_000_000

type SmartEditBody = {
  imageUrl?: string
  referenceImages?: string[]
  prompt: string
  previousResponseId?: string
  imageModel?: 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst'
  action?: 'auto' | 'edit' | 'generate'
  quality?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'auto'
  size?: string
  background?: 'transparent' | 'opaque' | 'auto'
  businessContext?: {
    businessName?: string
    industry?: string
    productService?: string
    targetRole?: string
    preserve?: string[]
  }
}

function validImageReference(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_DATA_URL_CHARS) return false
  if (value.startsWith('data:image/')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
  }

  const limit = rateLimit(`personalization-smart-edit:${userId}`, { windowMs: 60_000, max: 10 })
  if (!limit.allowed) return rateLimit429(limit.retryAfterMs)

  const key = await getOpenAiKeyForUser()
  if (!key) {
    return NextResponse.json(
      { error: 'OPENAI_KEY_REQUIRED', message: 'Add your OpenAI API key in SmartVideo GO Settings.' },
      { status: 401 },
    )
  }

  try {
    const body = (await req.json()) as SmartEditBody
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 })

    const previousResponseId =
      typeof body.previousResponseId === 'string' && body.previousResponseId.startsWith('resp_')
        ? body.previousResponseId
        : undefined

    if (!previousResponseId && !validImageReference(body.imageUrl)) {
      return NextResponse.json({ error: 'A valid source image is required for the first Smart Edit turn.' }, { status: 400 })
    }

    const references = Array.isArray(body.referenceImages)
      ? body.referenceImages.filter(validImageReference).slice(0, MAX_REFERENCES)
      : []

    const preserve = Array.isArray(body.businessContext?.preserve)
      ? body.businessContext!.preserve!.map(String).filter(Boolean).slice(0, 20)
      : []

    const context = [
      body.businessContext?.businessName ? `Business: ${body.businessContext.businessName}.` : '',
      body.businessContext?.industry ? `Industry: ${body.businessContext.industry}.` : '',
      body.businessContext?.productService ? `Product/service: ${body.businessContext.productService}.` : '',
      body.businessContext?.targetRole ? `Target SmartVideo GO role: ${body.businessContext.targetRole}.` : '',
      preserve.length ? `Preserve as closely as possible: ${preserve.join(', ')}.` : '',
    ].filter(Boolean).join(' ')

    const instruction =
      'Edit the image for SmartVideo GO according to the user request. ' +
      'Preserve everything that is not explicitly requested to change. ' +
      'Do not unnecessarily redesign real people, logos, products, packaging, signage, printed text, phone numbers, URLs, or brand colors. ' +
      context + ' User request: ' + prompt

    const input = previousResponseId
      ? instruction
      : [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: instruction },
              { type: 'input_text', text: 'Primary image to edit:' },
              { type: 'input_image', image_url: body.imageUrl, detail: 'original' },
              ...references.flatMap((imageUrl, index) => [
                { type: 'input_text', text: `Reference image ${index + 1}. Use only as relevant context; do not replace the primary subject unless requested.` },
                { type: 'input_image', image_url: imageUrl, detail: 'high' },
              ]),
            ],
          },
        ]

    const imageModel =
      body.imageModel === 'gpt-image-2.5-flare'
        ? 'gpt-image-2.5-flare'
        : 'gpt-image-2.5-sunburst'

    const tool: Record<string, unknown> = {
      type: 'image_generation',
      model: imageModel,
      action: body.action || 'edit',
      quality: body.quality || 'auto',
      background: body.background || 'auto',
    }
    if (body.size && body.size !== 'original') tool.size = body.size

    const upstream = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ORCHESTRATOR_MODEL,
        ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
        input,
        tools: [tool],
        tool_choice: { type: 'image_generation' },
      }),
      signal: AbortSignal.timeout(110_000),
    })

    const payload = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: payload?.error?.message || payload?.error || 'Smart Edit failed.',
          upstreamStatus: upstream.status,
        },
        { status: upstream.status },
      )
    }

    const calls = Array.isArray(payload?.output)
      ? payload.output.filter((item: any) => item?.type === 'image_generation_call')
      : []
    const call = calls[0]
    const result = typeof call?.result === 'string' ? call.result : ''

    if (!result) {
      return NextResponse.json({ error: 'The Responses API returned no edited image.' }, { status: 502 })
    }

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${result}`,
      responseId: payload.id || null,
      imageGenerationCallId: call?.id || null,
      revisedPrompt: call?.revised_prompt || null,
      model: imageModel,
      orchestratorModel: ORCHESTRATOR_MODEL,
      usage: payload?.usage || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Smart Edit failed.' },
      { status: 500 },
    )
  }
}
