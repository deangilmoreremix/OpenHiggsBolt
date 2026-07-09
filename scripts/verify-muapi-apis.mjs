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
import { readFileSync, copyFileSync, existsSync } from 'fs'
import { pathToFileURL } from 'url'
import { tmpdir } from 'os'
import { join } from 'path'

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

async function loadLiveCatalog() {
  const snapshot = process.env.MUAPI_VERIFY_SNAPSHOT
  if (snapshot && existsSync(snapshot)) {
    console.log(`Using catalog snapshot: ${snapshot}`)
    return JSON.parse(readFileSync(snapshot, 'utf8')).models
  }
  process.stdout.write(`Fetching live catalog ${MUAPI_CATALOG} ... `)
  const res = await fetch(MUAPI_CATALOG)
  if (!res.ok) {
    console.error(`\nFATAL: catalog request failed with HTTP ${res.status}`)
    process.exit(2)
  }
  const json = await res.json()
  console.log(`ok (${json.models.length} models)`)
  return json.models
}

async function loadModels() {
  const tmp = join(tmpdir(), 'muapi_models_verify.mjs')
  copyFileSync(MODELS_SRC, tmp)
  const mod = await import(pathToFileURL(tmp).href)
  return mod
}

async function main() {
  const live = await loadLiveCatalog()
  const liveNames = new Set(live.map((m) => m.name))
  const liveEndpoints = new Set(live.map((m) => m.endpoint.replace('/api/v1/', '')))

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

  let total = 0
  const problems = []
  for (const [group, arr] of Object.entries(arrays)) {
    if (!Array.isArray(arr)) continue
    for (const m of arr) {
      total++
      const resolved = ENDPOINT_ALIASES[m.id] || m.endpoint || m.id
      const ok = liveEndpoints.has(resolved) || liveNames.has(resolved) || INTENTIONAL_NON_CATALOG.has(resolved)
      if (!ok) problems.push({ group, id: m.id, endpoint: m.endpoint, resolved })
    }
  }

  console.log(`\nChecked ${total} models across ${Object.keys(arrays).length} groups.`)
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
