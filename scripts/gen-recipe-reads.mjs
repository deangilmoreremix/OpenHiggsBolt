#!/usr/bin/env node
/**
 * Which kinds of the person's material each Motion Director recipe reads, from its own source:
 *   brand    the company's name / logo / colours / lines (BRAND, PITCH, MotionStudioMark)
 *   textures captured pages and card crops (liveTexture / realPage / realCrop / liveCard / PageCam2D)
 *   fixtures the shared sample interface (FakeDashboard, TitleBlock, sample cards) that shows the site's page when one is supplied
 * A recipe that reads none of these and has no words of its own draws nothing of its own to replace.
 * Output: src/apps/motion-director/lib/_generated/recipeReads.json (committed). Run: node scripts/gen-recipe-reads.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('src/apps/motion-director/demosrc')
const OUT = path.resolve('src/apps/motion-director/lib/_generated/recipeReads.json')
const out = {}
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name !== '_fixtures' && e.name !== '_generated' && e.name !== '_legacy' && e.name !== '_textures') walk(p)
    } else if (e.name.endsWith('.tsx')) {
      const src = fs.readFileSync(p, 'utf8')
      const stem = e.name.replace(/\.tsx$/, '')
      out[stem] = {
        brand: /\bBRAND\b|\bPITCH\b|MotionStudioMark|MotionStudioWordmark/.test(src),
        textures: /liveTexture|realPage|realCrop|liveCard|realCard|layoutCard|PageCam2D|live-layout|useLiveLayout/.test(src),
        fixtures: /FakeDashboard|_fixtures\/Fixtures/.test(src),
      }
    }
  }
}
walk(ROOT)
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n')
console.log(`recipeReads: ${Object.keys(sorted).length} recipes`)
