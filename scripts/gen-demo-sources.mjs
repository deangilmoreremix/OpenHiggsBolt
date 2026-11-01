#!/usr/bin/env node
/**
 * Publishes each Motion Director recipe's source as plain text, so the browser can send it to the
 * shot-adapter agent (the model rewrites a recipe for the person's site, as upstream's coding agent
 * does). Output: `public/motion-studio/sources/<Stem>.tsx.txt` and `index.json` ({ Stem: bytes }).
 * Legacy recipes are skipped. Run by `prebuild`; the output is generated, not committed.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('src/apps/motion-director/demosrc')
const OUT = path.resolve('public/motion-studio/sources')

const files = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!['_fixtures', '_generated', '_legacy', '_textures'].includes(e.name)) walk(p)
    } else if (e.name.endsWith('.tsx')) files.push(p)
  }
}
walk(ROOT)

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const index = {}
for (const file of files.sort()) {
  const stem = path.basename(file, '.tsx')
  if (!new RegExp(`export\\s+(?:const|function)\\s+${stem}\\b`).test(fs.readFileSync(file, 'utf8'))) continue
  const text = fs.readFileSync(file, 'utf8')
  if (text.length > 60_000) continue
  fs.writeFileSync(path.join(OUT, `${stem}.tsx.txt`), text)
  index[stem] = text.length
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index))
console.log(`gen-demo-sources: ${Object.keys(index).length} recipes`)
