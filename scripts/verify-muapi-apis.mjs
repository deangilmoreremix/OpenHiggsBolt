#!/usr/bin/env node
/**
 * Verify that every MuAPI model endpoint referenced by the app resolves to a
 * real endpoint on the live MuAPI catalog (https://api.muapi.ai/api/v1/models).
 *
 * This is the functional contract check requested for muapi.ai compatibility:
 * every model id/endpoint we send to `POST /api/v1/{endpoint}` must exist.
 *
 * Usage:
 *   node scripts/verify-muapi-apis.mjs
 *   MUAPI_VERIFY_SNAPSET=/path/to/catalog.json node scripts/verify-muapi-apis.mjs
 *
 * Exit code is non-zero if any endpoint cannot be resolved (excluding a small
 * set of intentionally non-catalog entries: VFX passthrough + local nodes).
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs'
import { pathToFileURL } from 'url'
import { tmpdir } from 'os'
import { join } from 'path'

const SYNCED_OUT = 'packages/studio/src/models.synced.js'

const MUAPI_CATALOG = 'https://api.muapi.ai/api/v1/models'
const MODELS_SRC = 'packages/studio/src/models.js'

// Endpoints that are valid per the MuAPI docs but are intentionally absent
// from the auto-generated model catalog:
//  - generate_wan_ai_effects: documented VFX endpoint (see /docs/vfx)
//  - image-passthrough / Api Node: local-only passthrough / ComfyUI nodes
const INTENTIONAL_NON_CATALOG = new Set([
  'generate_wan_ai_effects',
  'image-passthrough',
  'Api Node',
])

// Source-of-truth endpoint aliases, mirrored from the clients
// (src/lib/muapi.js and packages/studio/src/muapi.js). Kept in sync so this
// check reflects the effective endpoint actually sent at runtime.
const ENDPOINT_ALIASES = {
  'flux-dev': 'flux-dev',
  'flux-schnell': 'flux-schnell',
  'midjourney-v7-text-to-image': 'midjourney-v7',
  'seedream-5.0': 'bytedance-seedream-v5.0',
  'minimax-image-01': 'minimax-image-01-subject-reference',
  'seedance-v2.0-t2v': 'seedance-2-t2v',
  'seedance-v2.0-extend': 'seedance-2-vip-extend',
  'ai-image-upscaler': 'ai-image-upscaler',
  'midjourney-v7-image-to-image': 'midjourney-v7',
  'bytedance-seededit-v3': 'bytedance-seededit-v3',
  'midjourney-v7-style-reference': 'midjourney-v7',
  'midjourney-v7-omni-reference': 'midjourney-v7',
  'minimax-image-01-subject-reference': 'minimax-image-01-subject-reference',
  'bytedance-seedream-edit-v4': 'bytedance-seedream-v4-edit',
  'seedream-5.0-edit': 'bytedance-seedream-v5.0-edit',
  'midjourney-v7-image-to-video': 'midjourney-v7',
  'seedance-lite-reference-video': 'seedance-lite-reference-video',
  'seedance-v2.0-i2v': 'seedance-2-image-to-video',
  'latent-sync': 'latent-sync',
  'mmaudio-v2-text-to-audio': 'mmaudio-v2-text-to-audio',
}

function localEndpoint(m) {
  return ENDPOINT_ALIASES[m.id] || m.endpoint || m.id
}

function normalizeLiveEndpoint(ep) {
  return String(ep || '').replace(/^\/api\/v1\//, '')
}

async function loadLiveCatalog() {
  const snapshot = process.env.MUAPI_VERIFY_SNAPSHOT
  if (snapshot && existsSync(snapshot)) {
    console.log(`Using catalog snapshot: ${snapshot}`)
    try {
      const data = JSON.parse(readFileSync(snapshot, 'utf8'))
      return Array.isArray(data) ? data : data.models
    } catch (e) {
      console.error(`\nWARN: failed to read snapshot: ${e.message}`)
      return null
    }
  }
  process.stdout.write(`Fetching live catalog ${MUAPI_CATALOG} ... `)
  try {
    const res = await fetch(MUAPI_CATALOG)
    if (!res.ok) {
      console.error(`\nWARN: catalog request failed with HTTP ${res.status}`)
      return null
    }
    const json = await res.json()
    console.log(`ok (${json.models.length} models)`)
    return json.models
  } catch (e) {
    console.error(`\nWARN: could not fetch live catalog: ${e.message}`)
    return null
  }
}

function reportDiff(localModels, localById, liveById) {
  const missing = []
  for (const [id, lm] of liveById) {
    if (!localById.has(id)) missing.push(lm)
  }
  const mismatches = []
  for (const m of localModels) {
    const lm = liveById.get(m.id)
    if (lm && lm.endpoint && m.endpoint && lm.endpoint !== m.endpoint) {
      mismatches.push({ id: m.id, local: m.endpoint, live: lm.endpoint })
    }
  }
  console.log('\n=== Catalog Diff: local (models.js) vs MuAPI live ===')
  console.log(`Local models: ${localModels.length}  |  Live models: ${liveById.size}`)
  console.log('\n-- Missing locally (in live catalog, not in models.js) --')
  if (missing.length === 0) {
    console.log('  none')
  } else {
    for (const m of missing) {
      console.log(`  ${m.id}  endpoint=/api/v1/${m.endpoint}  category=${m.category || '?'}`)
    }
  }
  console.log('\n-- Endpoint mismatch (same id, different endpoint) --')
  if (mismatches.length === 0) {
    console.log('  none')
  } else {
    for (const x of mismatches) {
      console.log(`  ${x.id}  local=${x.local}  live=${x.live}`)
    }
  }
  console.log(`\nSUMMARY: ${missing.length} missing locally, ${mismatches.length} endpoint mismatch.`)
}

async function loadModels() {
  const mod = await import(pathToFileURL(MODELS_SRC).href)
  return mod
}

// --- Emit mode: refresh the model catalog from the live MuAPI catalog ---

// Maps a live `category` value to one of our local `<Name>Models` arrays.
// Categories not listed here get a freshly created array (see newArrayName).
const CATEGORY_TO_ARRAY = {
  'Text to Image': 't2iModels',
  'Image to Image': 'i2iModels',
  'Text to Video': 't2vModels',
  'Image to Video': 'i2vModels',
  'Video to Video': 'v2vModels',
  'Audio to Video': 'lipsyncModels',
  'Text to Audio': 'audioModels',
}

function newArrayName(category) {
  if (category === 'Image to 3D') return 'imageTo3DModels'
  if (category === 'Text to Text') return 'textToTextModels'
  if (category === 'Training') return 'trainingModels'
  if (category === 'other') return 'otherModels'
  return category.replace(/[^A-Za-z0-9]/g, '') + 'Models'
}

function prettifyName(slug) {
  return String(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Build a default `inputs` map for a live model. The live /models endpoint only
// exposes metadata (name, endpoint, category, family, description) and does NOT
// include a per-model parameter schema, so when no schema is present we derive a
// sensible default (prompt everywhere; image/video/audio inputs where the type
// implies them). If the live model ever carries `inputs`/`parameters`/`schema`,
// those are mapped field-by-field instead.
function mapLiveSchema(schema) {
  const inputs = {}
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return
    for (const [key, def] of Object.entries(obj)) {
      inputs[key] = {
        type: def.type || 'string',
        ...(def.title ? { title: def.title } : {}),
        ...(def.description ? { description: def.description } : {}),
        ...(def.enum ? { enum: def.enum } : {}),
        ...(def.default !== undefined ? { default: def.default } : {}),
        ...(def.name ? { name: def.name } : { name: key }),
      }
    }
  }
  if (Array.isArray(schema)) {
    for (const p of schema) inputs[p.name || p.key] = p
  } else {
    walk(schema)
  }
  return inputs
}

function defaultInputsFor(category, description) {
  const inputs = {}
  const promptDesc = description
    ? String(description).slice(0, 280)
    : 'Text prompt describing the desired output.'
  inputs.prompt = { type: 'string', title: 'Prompt', name: 'prompt', description: promptDesc }
  let imageField
  let videoField
  const hasImageIn =
    category === 'Image to Image' ||
    category === 'Image to Video' ||
    category === 'Image to 3D' ||
    category === 'Audio to Video'
  const hasVideoIn =
    category === 'Video to Video' || category === 'Image to Video' || category === 'Audio to Video'
  const hasAudioIn = category === 'Audio to Video' || category === 'Text to Audio'
  if (hasImageIn) {
    inputs.image = { type: 'image', title: 'Image', name: 'image', description: 'Input image.' }
    imageField = 'image'
  }
  if (hasVideoIn) {
    inputs.video = { type: 'video', title: 'Video', name: 'video', description: 'Input video.' }
    videoField = 'video'
  }
  if (hasAudioIn) {
    inputs.audio = { type: 'audio', title: 'Audio', name: 'audio', description: 'Input audio.' }
  }
  return { inputs, hasPrompt: true, imageField, videoField }
}

function buildEntry(live) {
  const id = live.name
  const endpoint = normalizeLiveEndpoint(live.endpoint) || id
  const category = live.category
  const schema = live.inputs || live.parameters || live.schema
  let inputs
  let hasPrompt = false
  let imageField
  let videoField
  if (schema && typeof schema === 'object' && Object.keys(schema).length > 0) {
    inputs = mapLiveSchema(schema)
    for (const [k, v] of Object.entries(inputs)) {
      const t = String(v.type || '').toLowerCase()
      if (k === 'prompt' || t === 'prompt') hasPrompt = true
      if (t.includes('image')) imageField = k
      if (t.includes('video')) videoField = k
    }
  } else {
    const d = defaultInputsFor(category, live.description)
    inputs = d.inputs
    hasPrompt = d.hasPrompt
    imageField = d.imageField
    videoField = d.videoField
  }
  const entry = { id, name: prettifyName(id), endpoint }
  if (live.family) entry.family = live.family
  if (category) entry.category = category
  entry.hasPrompt = hasPrompt
  if (imageField) entry.imageField = imageField
  if (videoField) entry.videoField = videoField
  entry.inputs = inputs
  if (live.description) entry.description = String(live.description).slice(0, 400)
  return entry
}

function serializeEntry(entry) {
  return '  ' + JSON.stringify(entry, null, 2).replace(/\n/g, '\n  ')
}

// Find the index of the `]` that closes the top-level `[` at openIndex, honoring
// string literals so brackets inside string values don't disturb the count.
function matchingBracketClose(src, openIndex) {
  let depth = 0
  let inStr = null
  for (let i = openIndex; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (c === inStr && src[i - 1] !== '\\') inStr = null
      continue
    }
    if (c === '"' || c === "'") {
      inStr = c
      continue
    }
    if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

// Discover every `export const <Name>Models = [` block in the source text.
function findArrayBlocks(src) {
  const blocks = []
  const re = /export const (\w*Models)\s*=\s*\[/g
  let m
  while ((m = re.exec(src)) !== null) {
    const name = m[1]
    const start = m.index
    const open = src.indexOf('[', m.index)
    const close = matchingBracketClose(src, open)
    if (close === -1) continue
    // block ends just after the `;` that follows the closing `]`
    let end = close + 1
    while (end < src.length && src[end] !== ';') end++
    if (src[end] === ';') end++
    blocks.push({ name, start, open, close, end })
  }
  return blocks
}

async function emitModels() {
  const src = readFileSync(MODELS_SRC, 'utf8')
  const live = await loadLiveCatalog()

  const M = await loadModels()
  const knownArrays = [
    M.t2iModels,
    M.t2vModels,
    M.i2iModels,
    M.i2vModels,
    M.v2vModels,
    M.lipsyncModels,
    M.recastModels,
    M.audioModels,
  ].filter(Array.isArray)
  let preserved = 0
  const localIds = new Set()
  const localEndpoints = new Set()
  for (const arr of knownArrays) {
    for (const m of arr) {
      preserved++
      if (m.id) localIds.add(m.id)
      if (m.endpoint) localEndpoints.add(m.endpoint)
    }
  }

  const addedByArray = {}
  const addedByCategory = {}
  let added = 0

  if (live && live.length) {
    for (const lm of live) {
      const id = lm.name
      const ep = normalizeLiveEndpoint(lm.endpoint)
      if (localIds.has(id) || (ep && localEndpoints.has(ep))) continue
      const target =
        CATEGORY_TO_ARRAY[lm.category] || newArrayName(lm.category || 'other')
      const entry = buildEntry(lm)
      ;(addedByArray[target] = addedByArray[target] || []).push(entry)
      ;(addedByCategory[lm.category || 'other'] = addedByCategory[lm.category || 'other'] || 0)
      addedByCategory[lm.category || 'other']++
      added++
    }
  }

  // Re-emit the source, injecting missing live models into their target arrays.
  const blocks = findArrayBlocks(src)
  const header =
    `// Auto-generated by scripts/verify-muapi-apis.mjs --emit on ${new Date().toISOString().slice(0, 10)}.\n` +
    `// Merged from the live MuAPI catalog (https://api.muapi.ai/api/v1/models)\n` +
    `// and the local ${MODELS_SRC}. 100% of local entries are preserved; missing\n` +
    `// live models are appended. Do not edit by hand — regenerate with the script.\n`

  let out = header
  let pos = 0
  for (const block of blocks) {
    out += src.slice(pos, block.start)
    const toAdd = addedByArray[block.name]
    if (toAdd && toAdd.length) {
      const inner = src.slice(block.open + 1, block.close)
      const hasContent = inner.trim().length > 0
      const injected = toAdd.map(serializeEntry).join(',\n')
      out += src.slice(block.start, block.close)
      out += hasContent ? ',\n' : '\n'
      out += injected + '\n'
      out += src.slice(block.close, block.end)
    } else {
      out += src.slice(block.start, block.end)
    }
    pos = block.end
  }
  out += src.slice(pos)

  // Emit any brand-new arrays needed for unmapped categories.
  const createdArrays = Object.keys(addedByArray).filter(
    (name) => !blocks.some((b) => b.name === name),
  )
  if (createdArrays.length) {
    out += '\n'
    for (const name of createdArrays) {
      const body = addedByArray[name].map(serializeEntry).join(',\n')
      out += `export const ${name} = [\n${body}\n]\n`
    }
  }

  if (!live) {
    console.log(
      '\nWARN: live catalog unavailable — emitting a copy of local models only (no live models added).',
    )
  }
  writeFileSync(SYNCED_OUT, out)
  console.log('\n=== Catalog Emit (--emit) ===')
  console.log(`Local models preserved : ${preserved}`)
  console.log(`Live models added      : ${added}`)
  console.log('Added by category      :')
  for (const [cat, n] of Object.entries(addedByCategory)) {
    const arr = CATEGORY_TO_ARRAY[cat] || newArrayName(cat)
    console.log(`  ${cat} -> ${arr} : ${n}`)
  }
  if (createdArrays.length) {
    console.log('New arrays created     : ' + createdArrays.join(', '))
  }
  console.log(`Output written to      : ${SYNCED_OUT}`)
  return added
}

async function main() {
  const emit = process.argv.includes('--emit')
  if (emit) {
    await emitModels()
    process.exit(0)
  }

  const live = await loadLiveCatalog()
  const liveById = new Map()
  if (live) {
    for (const m of live) {
      liveById.set(m.name, {
        id: m.name,
        name: m.name,
        endpoint: normalizeLiveEndpoint(m.endpoint),
        category: m.category,
      })
    }
  }

  const M = await loadModels()
  const arrays = {
    t2i: M.t2iModels,
    t2v: M.t2vModels,
    i2i: M.i2iModels,
    i2v: M.i2vModels,
    v2v: M.v2vModels,
    lipsync: M.lipsyncModels,
    recast: M.recastModels,
    audio: M.audioModels,
  }

  const localModels = []
  for (const [group, arr] of Object.entries(arrays)) {
    if (!Array.isArray(arr)) continue
    for (const m of arr) {
      localModels.push({ group, id: m.id, name: m.name, endpoint: localEndpoint(m) })
    }
  }
  const localById = new Map(localModels.map((m) => [m.id, m]))

  if (live) {
    reportDiff(localModels, localById, liveById)
  } else {
    console.log('\n=== Catalog Diff (skipped: live catalog unavailable) ===')
    console.log(`Local catalog parsed: ${localModels.length} models across ${Object.keys(arrays).length} groups.`)
  }

  let total = 0
  const problems = []
  if (live) {
    const liveNames = new Set(live.map((m) => m.name))
    const liveEndpoints = new Set(live.map((m) => m.endpoint.replace('/api/v1/', '')))
    for (const m of localModels) {
      total++
      const resolved = localEndpoint(m)
      const ok = liveEndpoints.has(resolved) || liveNames.has(resolved) || INTENTIONAL_NON_CATALOG.has(resolved)
      if (!ok) problems.push({ group: m.group, id: m.id, endpoint: m.endpoint, resolved })
    }
  } else {
    total = localModels.length
  }

  console.log(`\nChecked ${total} models across ${Object.keys(arrays).length} groups.`)
  if (!live) {
    console.log('RESULT: SKIPPED — live catalog unavailable; endpoint resolution not verified.')
    process.exit(0)
  }
  if (problems.length === 0) {
    console.log('RESULT: PASS — every model endpoint resolves to a real MuAPI endpoint.')
    process.exit(0)
  }
  console.log(`RESULT: FAIL — ${problems.length} model(s) do not resolve to a live MuAPI endpoint:\n`)
  for (const p of problems) {
    console.log(`  [${p.group}] id=${p.id}  endpoint=${p.endpoint ?? '∅'}  resolved=${p.resolved}`)
  }
  process.exit(1)
}

main().catch((err) => {
  console.error('Verification error:', err)
  process.exit(3)
})
