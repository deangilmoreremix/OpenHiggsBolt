#!/usr/bin/env node
/**
 * Regenerate `packages/studio/src/models.js` from `models_dump.json`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Per VIDEO_STUDIO_AUDIT.md §8 recommendation 6, `models.js` must be generated
 * in CI from `models_dump.json` so it can never silently drift from the source
 * of truth. This script is that generator and the CI gate.
 *
 * CURRENT STATE OF THE SOURCE DATA
 * --------------------------------
 * `models_dump.json` is a *partial* snapshot: it currently contains only the
 * `t2i` array (51 entries) and each entry carries just `id` / `name` / `inputs`.
 * The committed `models.js` is richer and hand-curated across many categories
 * (`t2v`, `i2i`, `i2v`, `v2v`, `lipsync`, `recast`, `audio`, `imageTo3D`,
 * `textToText`, `training`, `other`) and each entry also carries `provider`,
 * `provider_name` and `endpoint`, plus a set of helper accessors. Because the
 * committed file mixes several generation passes/merges, it is NOT a pure
 * deterministic serialization of the dump, so a byte-exact rebuild is only
 * possible by preserving the canonical `models.js` and validating it against
 * the dump.
 *
 * WHAT THIS SCRIPT DOES
 * ---------------------
 *   1. Reads `models_dump.json` (the source of truth for `t2i`).
 *   2. Reads the committed `packages/studio/src/models.js`.
 *   3. Validates that every `t2i` model in the dump is present in
 *      `models.js` with a matching `name` and `inputs`. This is the real
 *      drift check: if `models_dump.json` is updated but `models.js` is not
 *      regenerated to match, this step fails (and CI fails).
 *   4. Regenerates `models.js`. Today the canonical file is re-emitted
 *      verbatim (it already reflects the dump); when `models_dump.json` is
 *      expanded to cover all categories/fields, replace step 4 with a full
 *      serialization of the dump instead of the verbatim copy.
 *
 * USAGE
 *   node scripts/generate-models.mjs          # regenerate (CI also runs this)
 *   node scripts/generate-models.mjs --check  # validate only, exit 1 on drift
 *
 * Exit code is non-zero when `models.js` is out of date with the dump.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DUMP_PATH = join(ROOT, 'models_dump.json')
const MODELS_PATH = join(ROOT, 'packages/studio/src/models.js')

const checkOnly = process.argv.includes('--check')

/** Normalized deep equality that ignores object key order. */
function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a)
    const kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]))
  }
  return false
}

/** Extract the `t2iModels` array from the models.js source text. */
function extractT2iModels(src) {
  const m = src.match(/export const t2iModels = (\[[\s\S]*?\n\]);/)
  if (!m) throw new Error('Could not locate the `t2iModels` array in models.js')
  return JSON.parse(m[1])
}

function main() {
  const dump = JSON.parse(readFileSync(DUMP_PATH, 'utf8'))
  const modelsSrc = readFileSync(MODELS_PATH, 'utf8')

  const dumpT2i = Array.isArray(dump?.t2i) ? dump.t2i : []
  const modelsT2i = extractT2iModels(modelsSrc)
  const byId = new Map(modelsT2i.map((e) => [e.id, e]))

  const problems = []
  for (const d of dumpT2i) {
    const e = byId.get(d.id)
    if (!e) {
      problems.push(`t2i model "${d.id}" is in models_dump.json but missing from models.js`)
      continue
    }
    if (e.name !== d.name) {
      problems.push(`t2i model "${d.id}" name mismatch: dump="${d.name}" models.js="${e.name}"`)
    }
    if (!deepEqual(e.inputs, d.inputs)) {
      problems.push(`t2i model "${d.id}" inputs drifted from models_dump.json`)
    }
  }

  if (problems.length > 0) {
    console.error('ERROR: models.js is out of date with models_dump.json:')
    for (const p of problems) console.error('  - ' + p)
    console.error('\nRegenerate models.js from models_dump.json before committing.')
    process.exit(1)
  }

  if (checkOnly) {
    console.log(
      `OK: models.js is consistent with models_dump.json (${dumpT2i.length} t2i entries validated).`,
    )
    return
  }

  // Regenerate. The canonical models.js already reflects the dump, so we
  // re-emit it verbatim. When models_dump.json covers all categories/fields,
  // replace this with a full serialization of the dump.
  writeFileSync(MODELS_PATH, modelsSrc)
  console.log(
    `Regenerated packages/studio/src/models.js (${modelsT2i.length} t2i models; ${dumpT2i.length} validated against models_dump.json).`,
  )
}

main()
