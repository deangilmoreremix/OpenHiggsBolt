#!/usr/bin/env node
/**
 * Index of the retired recipes kept so old saved projects still open (upstream demos/_legacy, frozen at
 * the 2026-10 library cut): `demosrc/_legacy/manifest.json` → `cards/legacy-index.ts`. They resolve by their
 * old `demo:<Stem>` id but are never offered in the library. Run: `npm run gen:legacy-index`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.resolve('src/apps/motion-director/demosrc/_legacy')
const OUT = path.resolve('src/apps/motion-director/cards/legacy-index.ts')
const cards = JSON.parse(readFileSync(path.join(DIR, 'manifest.json'), 'utf8')).cards
const stems = new Set()
for (const card of cards) {
  if (!card.stem || !card.path || !card.name || !card.nameEn || !card.category || !Number.isInteger(card.duration) || card.duration < 2 || stems.has(card.stem)) throw new Error(`invalid legacy recipe: ${card.stem}`)
  if (!new RegExp(`export (?:const|function) ${card.stem}\\b`).test(readFileSync(path.join(DIR, `${card.path}.tsx`), 'utf8'))) throw new Error(`legacy export missing: ${card.stem}`)
  stems.add(card.stem)
}
writeFileSync(
  OUT,
  '// Generated, do not edit: node scripts/gen-legacy-index.mjs\n' +
    'import type React from "react";\n' +
    cards.map((c, i) => `import { ${c.stem} as c${i} } from "../demosrc/_legacy/${c.path}";`).join('\n') +
    '\n\nexport const LEGACY_DEMO_MODULES: Array<{ stem: string; name: string; nameEn: string; category: string; duration: number; component: React.ComponentType<Record<string, unknown>> }> = [\n' +
    cards.map((c, i) => `  { ${JSON.stringify({ stem: c.stem, name: c.name, nameEn: c.nameEn, category: c.category, duration: c.duration }).slice(1, -1)}, component: c${i} as unknown as React.ComponentType<Record<string, unknown>> },`).join('\n') +
    '\n];\n',
)
console.log(`legacy index: ${cards.length} retired recipes`)
