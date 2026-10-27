import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimit429 } from '../../../../lib/rateLimit'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import {
  EDIT_JSON_SCHEMA,
  PLAN_JSON_SCHEMA,
  PLAN_LIMITS,
  buildCatalogBrief,
  validateEditOps,
  validatePlan,
} from '@/apps/motion-director/lib/directorPlan'
import { requireMotionStudioUser } from '../lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/motion-studio/director
 *
 *   { mode: 'plan', prompt, durationSec, aspectRatio, capture?: { title, url, brand, cropCount }, brandKit? }
 *     → { plan }   a storyboard of existing ShotCraft recipes + copy + timing
 *   { mode: 'edit', instruction, clips: [{ id, recipe, label, text, seconds }] }
 *     → { reply, ops }   data edits against the current project
 *
 * The model only chooses among catalog recipes and a fixed set of edit
 * operations; its output is validated (`directorPlan.ts`) before it is
 * returned, and the browser validates again before applying it.
 */
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const DIRECTOR_MODEL = process.env.MOTION_STUDIO_DIRECTOR_MODEL || 'gpt-6-astra'
const ALLOWED_MODELS = new Set(['gpt-6-astra', 'gpt-4o', 'gpt-4o-mini'])

const CATALOG_BRIEF = buildCatalogBrief()

const PLAN_INSTRUCTIONS = `You are the director of a cinematic product video made from ShotCraft shot recipes.
Return a storyboard as JSON. Rules:
- Use ONLY recipe ids from the catalog below (first column). Never invent ids.
- Scene kinds: "shot" plays a recipe; "title" is a full-screen typographic card (recipeId "").
- Open with a title or an Opening shot; end with an Outro shot or a title card with the call to action.
- When a product capture is provided, use several PRODUCT-PAGE recipes: they show the captured site.
- productCapture.content is what the site says about itself (its headline, section headings, calls to action). Write headlines and captions from those words; never claim features the site does not mention. End on its call to action when it has one.
- One motion idea per scene; do not repeat a recipe. Let key moments breathe (hold ≥ 1s after a reveal).
- headline: short, punchy on-screen line (≤ ${PLAN_LIMITS.headlineChars} chars). caption: optional small strip (≤ ${PLAN_LIMITS.captionChars} chars) or "".
- transition: "flash" for a beat-like white flash before the next scene, otherwise "cut". Use "flash" sparingly (≤ 3).
- palette: hex colours taken from the brand when given (background, text, accent).
- Scene durations in seconds should sum to the requested length.
- requiredRecipes: when this list is NOT empty the user picked these shots by name. The film is made of ONLY these shots: use every one, exactly once, in that order, and add NO other shot recipe. You may add one opening title card and one closing call-to-action title card. Spread the requested length across them. When the list is empty, choose the shots yourself from the catalog.
- Upstream craft rules: prefer real captured pages over mock UI; one hero per opening shot; stable camera; captions legible; give key moments a ≥ 1 s hold; at most 3 flash cuts; end with a call to action.
- template "inkpress": follow the Ink Press structure — a title card, real-page PRODUCT-PAGE shots with caption strips, flash cuts on key beats, a call-to-action title, and an Outro shot. Keep the paper/ink palette (#f7f4ee background, #1c1a17 text, #b5651d accent) unless brand colours are given.

Catalog (id | title | category | native length | flags | what it does):
${CATALOG_BRIEF}`

const EDIT_INSTRUCTIONS = `You edit a Motion Studio film. You receive the instruction and the current clips.
Return JSON {reply, ops}. Each op has every field; fill unused ones with "" or 0.
- set_text {clipId, text}: change a clip's on-screen text.
- set_duration {clipId, seconds}.
- remove {clipId}.
- replace_recipe {clipId, recipeId}: swap the motion recipe (catalog ids only).
- add_shot {clipId: the clip to insert after ("" = at the end), recipeId, seconds, text}.
- set_palette {background, text: text colour hex, accent}.
Use only clip ids from the list and recipe ids from the catalog. Keep the film's rhythm: key moments hold ≥ 1 s, ≤ 3 flash cuts. reply: one or two sentences describing what you changed.

Catalog (id | title | category | native length | flags | what it does):
${CATALOG_BRIEF}`

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === 'output_text' && typeof content?.text === 'string') return content.text
    }
  }
  return ''
}

async function callDirector(key: string, instructions: string, input: string, schemaName: string, schema: object) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DIRECTOR_MODEL,
      instructions,
      input: [{ role: 'user', content: [{ type: 'input_text', text: input }] }],
      text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
    }),
    signal: AbortSignal.timeout(55_000),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(String(payload?.error?.message || `OpenAI request failed (HTTP ${response.status})`)) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return JSON.parse(extractOutputText(payload) || '{}')
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')

/** The capture's product check, trimmed to what the brief needs. */
function siteContent(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const list = (items: unknown, max: number, len: number) => (Array.isArray(items) ? items : []).slice(0, max).map((item) => str(item, len)).filter(Boolean)
  return {
    description: str(v.description, 300),
    headline: str(v.headline, 160),
    headings: list(v.headings, 8, 120),
    ctas: list(v.ctas, 4, 32),
    nav: list(v.nav, 10, 40),
  }
}

export async function POST(req: NextRequest) {
  const user = await requireMotionStudioUser(req)
  if (!user.ok) return user.response

  const limit = rateLimit(`motion-studio-director:${user.userId}`, { windowMs: 60_000, max: 12 })
  if (!limit.allowed) return rateLimit429(limit.retryAfterMs)

  if (!ALLOWED_MODELS.has(DIRECTOR_MODEL)) {
    return NextResponse.json({ error: 'Director model is not allowed', code: 'MODEL_NOT_ALLOWED' }, { status: 500 })
  }
  // BYOK only: the dev-only bypass has no stored key and so gets OPENAI_KEY_REQUIRED.
  const key = user.bypass ? null : await getOpenAiKeyForUser()
  if (!key) {
    return NextResponse.json(
      { error: 'OPENAI_KEY_REQUIRED', message: 'Add your OpenAI API key in SmartVideo GO Settings to use the Motion Studio director.' },
      { status: 401 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 })
  }

  try {
    if (body.mode === 'edit') {
      const clips = (Array.isArray(body.clips) ? body.clips : []).slice(0, 60).map((c: any) => ({
        id: str(c?.id, 64),
        recipe: str(c?.recipe, 120),
        label: str(c?.label, 80),
        text: str(c?.text, 120),
        seconds: typeof c?.seconds === 'number' ? Math.round(c.seconds * 10) / 10 : 0,
      }))
      const instruction = str(body.instruction, 1000).trim()
      if (!instruction) return NextResponse.json({ error: 'An instruction is required', code: 'BAD_REQUEST' }, { status: 400 })
      const raw = await callDirector(
        key,
        EDIT_INSTRUCTIONS,
        JSON.stringify({ instruction, clips }),
        'motion_studio_edit',
        EDIT_JSON_SCHEMA,
      )
      return NextResponse.json(validateEditOps(raw, new Set(clips.map((c) => c.id))))
    }

    const prompt = str(body.prompt, 2000).trim()
    if (!prompt) return NextResponse.json({ error: 'Describe the film first', code: 'BAD_REQUEST' }, { status: 400 })
    const durationSec = typeof body.durationSec === 'number' ? body.durationSec : 20
    const capture = body.capture && typeof body.capture === 'object' ? (body.capture as Record<string, unknown>) : null
    const brief = {
      prompt,
      durationSec,
      aspectRatio: str(body.aspectRatio, 8) || '16:9',
      productCapture: capture
        ? {
            title: str(capture.title, 200),
            url: str(capture.url, 300),
            brand: capture.brand ?? null,
            cropCount: Number(capture.cropCount) || 0,
            pages: (Array.isArray(capture.pages) ? capture.pages : []).slice(0, 4).map((p) => str(p, 120)),
            content: siteContent(capture.content),
          }
        : null,
      brandKit: body.brandKit && typeof body.brandKit === 'object' ? body.brandKit : null,
      requiredRecipes: (Array.isArray(body.requiredRecipes) ? body.requiredRecipes : []).slice(0, PLAN_LIMITS.maxScenes).map((r) => str(r, 120)).filter(Boolean),
      template: body.template === 'inkpress' ? 'inkpress' : null,
    }
    const raw = await callDirector(key, PLAN_INSTRUCTIONS, JSON.stringify(brief), 'motion_studio_plan', PLAN_JSON_SCHEMA)
    return NextResponse.json({ plan: validatePlan(raw, { targetSec: durationSec }) })
  } catch (err) {
    const status = (err as { status?: number })?.status
    console.warn('[motion-studio/director] failed', err instanceof Error ? err.message : String(err))
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: 'OpenAI rejected the API key', code: 'OPENAI_KEY_REJECTED' }, { status: 401 })
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'The director failed', code: 'DIRECTOR_FAILED' }, { status: 502 })
  }
}
