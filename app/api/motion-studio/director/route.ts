import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimit429 } from '../../../../lib/rateLimit'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import {
  BRIEF_JSON_SCHEMA,
  DIRECTION_JSON_SCHEMA,
  EDIT_JSON_SCHEMA,
  MAPPING_JSON_SCHEMA,
  PLAN_JSON_SCHEMA,
  PLAN_LIMITS,
  RETEXT_JSON_SCHEMA,
  RETEXT_MAX_CHARS,
  buildCatalogBrief,
  targetSceneCount,
  validateBrief,
  validateDirections,
  validateEditOps,
  validateMapping,
  validatePlan,
  validateRetext,
} from '@/apps/motion-director/lib/directorPlan'
import { DEMO_TEXTS } from '@/apps/motion-director/demosrc/_generated/demoTexts'
import { resolveMotionTemplate } from '@/data/motionRecipeCatalog'
import { requireMotionStudioUser } from '../lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/motion-studio/director
 *
 *   { mode: 'plan', prompt, durationSec, aspectRatio, capture?: { title, url, brand, cropCount }, brandKit? }
 *     → { plan }   a storyboard of existing ShotCraft recipes + copy + timing
 *   { mode: 'brief' | 'direction' | 'mapping', prompt, capture?, notes?, brief?, direction?, requiredRecipes? }
 *     → { brief } | { options } | { mapping }   the co-creation steps (video-shotcraft's guided flow)
 *   { mode: 'chat', message, plan, capture? }
 *     → { reply, revise }   the director answers a question about the storyboard
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
- SAMPLE-UI shots draw a made-up app screen. For a captured site and an empty requiredRecipes avoid them: prefer PRODUCT-PAGE shots, BRAND-SCENE ids and typography / camera / transition shots. Use a SAMPLE-UI shot only when the person named it.
- Shot-card rules (from the upstream cards; they are enforced after you answer): each recipe plays ONCE per film; tags in the catalog: OPENING recipes go first, OUTRO recipes last; DARK / LIGHT is the look family the recipe was designed in - keep the whole film in ONE family (a mixed film looks pasted together); "light≤2" style tags are limits for that kind of recipe across the film (e.g. at most 2 light effects, 1 outro kind, 3 whole-frame hits, 2 big camera moves, 2 title-entrance kinds); TEXT-FIXED recipes have words that are part of the technique; NEEDS-SOUND recipes must be given sound. Build the film on this arc: brand open (hold the name ≥1 s) -> one hero shot -> features, with a breathing title card (about 1.8 s) after every one or two feature shots (2-4 per film) -> a finale with a hold. A recipe's native length (catalog column) is the scene length: never plan a scene shorter than it unless it is a technique card.
- SLOW-EXPORT shots take several times longer to export than the rest. Avoid them unless the person named them, and never fill a film with them.
- BRAND-SCENE ids (brand/url-scan, brand/hub, brand/feature-zoom, brand/logo-reveal) tell the product's story from the captured site. When a site was captured and requiredRecipes is empty, use the story arc: brand/url-scan or a title as the hook, brand/hub for the feature overview, several brand/feature-zoom (one per real section/feature) mixed with PRODUCT-PAGE recipes, and brand/logo-reveal last (headline = its call to action). Brand scenes are shot scenes with kind "shot".
- One motion idea per scene; do not repeat a recipe. Let key moments breathe (hold ≥ 1s after a reveal).
- headline: short, punchy on-screen line (≤ ${PLAN_LIMITS.headlineChars} chars). caption: optional small strip (≤ ${PLAN_LIMITS.captionChars} chars) or "".
- transition: "flash" for a beat-like white flash before the next scene, otherwise "cut". Use "flash" sparingly (≤ 3).
- palette: hex colours taken from the brand when given (background, text, accent).
- Scene durations in seconds should sum to the requested length. Keep scenes short: 2–6 s each (a title card ≤ 3 s), and use one shot for each part of the page the person asked to show.
- Each scene also fills the storyboard row: feature (the one message this scene carries), action (its main motion in a few words), asset (which part of the site's captured page or images it shows, e.g. "hero section of your page"; "sample page" when nothing was captured), sfx (the sound cue, e.g. "whoosh on the cut", "impact on the flash"; "" for none).
- When the request carries a Brief, a chosen visual Direction, a shot Mapping or the person's notes, follow them: they are decisions the person already confirmed.
- Craft rules: one main motion idea per shot and never the same technique twice as the lead; the brand name holds on screen ≥ 1 s; no repeated taglines; real captured pages beat mock UI.
- targetScenes: plan about this many scenes (title cards included), 2–6 s each, one scene per feature or part of the page the person asked to show. Fewer scenes stretch each one too long.
- requiredRecipes: when this list is NOT empty the person picked these shots by name. Use ONLY these shots — never another recipe. Use each at least once, in that order first, and REPEAT them for as many scenes as targetScenes needs, each repeat with different copy and a different part of the site. You may add one opening title card and one closing call-to-action title card. When the list is empty, choose the shots yourself from the catalog.
- template "inkpress": follow the Ink Press structure — a title card, real-page PRODUCT-PAGE shots with caption strips, flash cuts on key beats, a call-to-action title, and an Outro shot. Keep the paper/ink palette (#f7f4ee background, #1c1a17 text, #b5651d accent) unless brand colours are given.

Catalog (id | title | category | native length | flags | what it does):
${CATALOG_BRIEF}`


const COCREATE_RULES = `Method: video-shotcraft. Work only from evidence in the request: the person's words and productCapture (what the site says about itself, its brand colours and fonts, its pages). Never claim features the site does not mention. If nothing was captured, say what is missing instead of guessing.`

const BRIEF_INSTRUCTIONS = `You run the product check that opens a short product film. ${COCREATE_RULES}
Return JSON {rows, questions}.
- rows: one per item, in this order when you can: Positioning, Target user, Purpose of the video, Core selling points, Features to show, Pages and states available, First-screen claim, Length / aspect / language, Music, Data rules, Visual cues. judgment = your call in one sentence (or "Can't tell from what I have"); evidence = what in the site or the request supports it.
- questions: at most 3, only what cannot be decided from the material, each starting with your recommendation and why (e.g. "Open on the headline "…"? I'd recommend yes because the site leads with it."). Empty when nothing needs confirming.`

const DIRECTION_INSTRUCTIONS = `You propose the visual direction of a short product film. ${COCREATE_RULES}
Return JSON {directions, recommended}: at most 3 directions grown from the product's own design (productCapture.brand colours and font, the site's tone). Each has name, claim (one sentence), keywords (3–5), look (fonts, colours, material), motion (camera and motion character), why (why it fits this product), tradeoff. Offer the paper-and-ink Ink Press look only when the product suits an editorial feel. recommended = the index (0-based) of your pick.`

const MAPPING_INSTRUCTIONS = `You map the features a film must show to shot recipes. ${COCREATE_RULES}
Return JSON {rows}: one row per feature, in film order, 3–8 rows. firstShot and altShot are recipe ids from the catalog (first column) — never invent ids. expresses = what the picture should make the viewer understand. pageState = the part of the site's page or the state it needs (hero, features, pricing…), or "sample page" when nothing was captured. Rules: one main motion idea per shot; never use the same technique as the lead twice; prefer PRODUCT-PAGE shots when a site was captured. When requiredRecipes is not empty, the first choices are exactly those shots, in that order.

Catalog (id | title | category | native length | flags | what it does):
${CATALOG_BRIEF}`

const RETEXT_INSTRUCTIONS = `You rewrite the words a film's shot recipes draw, so each shot speaks for the person's product instead of the template's sample content. ${COCREATE_RULES}
You receive scenes: each has an index, its headline and message, and strings = the exact words that recipe draws today (template words).
Return JSON {scenes:[{index, pairs:[{from, to}]}]}. from = one of the scene's strings, copied exactly; to = the words to draw instead.
- Write from the site's own words (productCapture.content: headline, headings, calls to action, menu) and the scene's headline / message. Never invent features, prices, numbers or claims the site does not give.
- Keep the same kind and length class: a short label stays a short label (a menu entry or feature name), a sentence stays one sentence of similar length. The layout is drawn for the template's words: stay within about 1.25× the template line's characters (never above ${RETEXT_MAX_CHARS}); longer text overflows the shot. Plain text only: no markdown, no quotes around it.
- Replace every string that names the template's sample product, people, data or features. Leave generic interface words (Home, Settings, Search) as they are unless the site has its own equivalent.
- Skip a string by leaving it out. Cover every scene you are given.`

const CHAT_INSTRUCTIONS = `You are the director of a cinematic product video, talking with the person who asked for it.
You receive their message, the storyboard on the table (title, summary, scenes) and what the product's site says (productCapture.content, when present).
Return JSON {reply, revise}.
- reply: one to three friendly sentences, in plain words. Answer their question or explain why the shots, order and copy were chosen, using the site's own words when you have them. Never invent features the site does not mention.
- revise: true only when the message asks you to CHANGE the film (different shots, copy, length, colours, order). Then reply says in one sentence what you will change. For a question or comment, revise is false.`

const CHAT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'revise'],
  properties: { reply: { type: 'string' }, revise: { type: 'boolean' } },
} as const

const EDIT_INSTRUCTIONS = `You edit a Motion Studio film. You receive the instruction and the current clips.
Return JSON {reply, ops}. Each op has every field; fill unused ones with "" or 0.
- set_text {clipId, text}: change a clip's on-screen text.
- set_duration {clipId, seconds}.
- remove {clipId}.
- replace_recipe {clipId, recipeId}: swap the motion recipe (catalog ids only).
- add_shot {clipId: the clip to insert after ("" = at the end), recipeId, seconds, text}.
- set_texts {clipId, from, to}: change one line a shot draws; from = one of the clip's strings, copied exactly; to = the new words (≤ 80 chars). One op per line.
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
        strings: (Array.isArray(c?.strings) ? c.strings : []).slice(0, 40).map((v: unknown) => str(v, 120)).filter(Boolean),
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

    if (body.mode === 'retext') {
      const capture = body.capture && typeof body.capture === 'object' ? (body.capture as Record<string, unknown>) : null
      const allowed = new Map<number, Set<string>>()
      const scenes: Array<Record<string, unknown>> = []
      for (const sc of (Array.isArray(body.scenes) ? body.scenes : []).slice(0, PLAN_LIMITS.maxScenes) as any[]) {
        const index = typeof sc?.index === 'number' ? Math.round(sc.index) : -1
        const template = resolveMotionTemplate(str(sc?.recipeId, 120))
        const strings = template ? (DEMO_TEXTS[template.componentName] ?? []).slice(0, 40) : []
        if (index < 0 || !strings.length) continue
        allowed.set(index, new Set(strings))
        scenes.push({ index, recipe: template?.nameEn ?? '', headline: str(sc?.headline, 120), message: str(sc?.feature, 160), strings })
      }
      if (!scenes.length) return NextResponse.json({ texts: {} })
      const raw = await callDirector(
        key,
        RETEXT_INSTRUCTIONS,
        JSON.stringify({
          product: str(body.product, 80),
          filmTitle: str(body.title, 120),
          productCapture: capture ? { title: str(capture.title, 200), url: str(capture.url, 300), content: siteContent(capture.content) } : null,
          scenes,
        }),
        'motion_studio_retext',
        RETEXT_JSON_SCHEMA,
      )
      return NextResponse.json({ texts: validateRetext(raw, allowed) })
    }

    if (body.mode === 'chat') {
      const message = str(body.message, 1000).trim()
      if (!message) return NextResponse.json({ error: 'A message is required', code: 'BAD_REQUEST' }, { status: 400 })
      const plan = body.plan && typeof body.plan === 'object' ? (body.plan as Record<string, unknown>) : {}
      const scenes = (Array.isArray(plan.scenes) ? plan.scenes : []).slice(0, PLAN_LIMITS.maxScenes).map((sc: any) => ({
        kind: str(sc?.kind, 8),
        recipe: str(sc?.recipeId, 120),
        seconds: typeof sc?.durationSec === 'number' ? Math.round(sc.durationSec * 10) / 10 : 0,
        headline: str(sc?.headline, 90),
        caption: str(sc?.caption, 110),
      }))
      const capture = body.capture && typeof body.capture === 'object' ? (body.capture as Record<string, unknown>) : null
      const raw = await callDirector(
        key,
        CHAT_INSTRUCTIONS,
        JSON.stringify({
          message,
          storyboard: { title: str(plan.title, 120), summary: str(plan.summary, 400), scenes },
          productCapture: capture ? { title: str(capture.title, 200), url: str(capture.url, 300), content: siteContent(capture.content) } : null,
        }),
        'motion_studio_chat',
        CHAT_JSON_SCHEMA,
      )
      return NextResponse.json({ reply: str(raw?.reply, 700), revise: raw?.revise === true })
    }

    if (body.mode === 'brief' || body.mode === 'direction' || body.mode === 'mapping') {
      const prompt = str(body.prompt, 2000).trim()
      if (!prompt) return NextResponse.json({ error: 'Describe the film first', code: 'BAD_REQUEST' }, { status: 400 })
      const capture = body.capture && typeof body.capture === 'object' ? (body.capture as Record<string, unknown>) : null
      const context = {
        prompt,
        durationSec: typeof body.durationSec === 'number' ? body.durationSec : 20,
        aspectRatio: str(body.aspectRatio, 8) || '16:9',
        productCapture: capture
          ? {
              title: str(capture.title, 200),
              url: str(capture.url, 300),
              brand: capture.brand ?? null,
              pages: (Array.isArray(capture.pages) ? capture.pages : []).slice(0, 4).map((p) => str(p, 120)),
              content: siteContent(capture.content),
            }
          : null,
        brandKit: body.brandKit && typeof body.brandKit === 'object' ? body.brandKit : null,
        notes: (Array.isArray(body.notes) ? body.notes : []).slice(0, 8).map((n) => str(n, 400)).filter(Boolean),
        brief: str(body.brief, 2000),
        direction: str(body.direction, 600),
        requiredRecipes: (Array.isArray(body.requiredRecipes) ? body.requiredRecipes : []).slice(0, PLAN_LIMITS.maxScenes).map((r) => str(r, 120)).filter(Boolean),
      }
      if (body.mode === 'brief') {
        return NextResponse.json({ brief: validateBrief(await callDirector(key, BRIEF_INSTRUCTIONS, JSON.stringify(context), 'motion_studio_brief', BRIEF_JSON_SCHEMA)) })
      }
      if (body.mode === 'direction') {
        return NextResponse.json({ options: validateDirections(await callDirector(key, DIRECTION_INSTRUCTIONS, JSON.stringify(context), 'motion_studio_direction', DIRECTION_JSON_SCHEMA)) })
      }
      return NextResponse.json({ mapping: validateMapping(await callDirector(key, MAPPING_INSTRUCTIONS, JSON.stringify(context), 'motion_studio_mapping', MAPPING_JSON_SCHEMA)) })
    }

    const prompt = str(body.prompt, 4000).trim()
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
    const targetScenes = targetSceneCount(durationSec)
    const started = Date.now()
    let raw = await callDirector(key, PLAN_INSTRUCTIONS, JSON.stringify({ ...brief, targetScenes }), 'motion_studio_plan', PLAN_JSON_SCHEMA)
    // Too few scenes for the length: ask once more, if there is time left before the host cuts the request off.
    const got = Array.isArray(raw?.scenes) ? raw.scenes.length : 0
    if (got < Math.ceil(targetScenes * 0.7) && Date.now() - started < 12_000) {
      const again = await callDirector(
        key,
        PLAN_INSTRUCTIONS,
        JSON.stringify({ ...brief, targetScenes, feedback: `Your plan had ${got} scenes; the length needs about ${targetScenes}. Return about ${targetScenes} scenes of 2–6 s, one per feature or part of the page.` }),
        'motion_studio_plan',
        PLAN_JSON_SCHEMA,
      ).catch(() => null)
      if (Array.isArray(again?.scenes) && again.scenes.length > got) raw = again
    }
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
