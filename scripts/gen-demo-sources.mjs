#!/usr/bin/env node
/**
 * Publishes each Motion Director recipe's source as plain text, so the browser can send it to the
 * shot-adapter agent (the model rewrites a recipe for the person's site, as upstream's coding agent
 * does). Output: `public/motion-studio/sources/<Stem>.tsx.txt`, the recipe's shot card in full as
 * `<Stem>.card.md` (upstream's agent reads the card before it edits the shot), and `index.json` ({ Stem: bytes }).
 * Legacy recipes are skipped. Run by `prebuild`; the output is generated, not committed.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('src/apps/motion-director/demosrc')
const OUT = path.resolve('public/motion-studio/sources')
const CARDS = path.resolve('.claude/skills/video-shotcraft/references/shots')
// The English translation of the cards (docs/video-shotcraft-en), used when it exists.
const CARDS_EN = path.resolve('docs/video-shotcraft-en/references/shots')

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
const factsSource = fs.readFileSync(path.resolve('src/apps/motion-director/demosrc/_generated/shotFacts.ts'), 'utf8')
/** The generated facts of a recipe as readable text ("" when it has none). */
const shotFactsOf = (stem) => {
  const m = factsSource.match(new RegExp(`\\n "${stem}": \\{([\\s\\S]*?)\\n \\}`))
  return m ? m[1].split('\n').map((l) => l.trim()).filter(Boolean).join('\n') : ''
}
const stubbed = []
const index = {}
let cards = 0
for (const file of files.sort()) {
  const stem = path.basename(file, '.tsx')
  if (!new RegExp(`export\\s+(?:const|function)\\s+${stem}\\b`).test(fs.readFileSync(file, 'utf8'))) continue
  const text = fs.readFileSync(file, 'utf8')
  if (text.length > 60_000) continue
  fs.writeFileSync(path.join(OUT, `${stem}.tsx.txt`), text)
  index[stem] = text.length
  // demosrc/<category>/<slug>/<Stem>.tsx <-> references/shots/<category>/<slug>.md
  const rel = path.relative(ROOT, path.dirname(file)).split(path.sep)
  const english = path.join(CARDS_EN, `${rel.join('/')}.md`)
  const card = fs.existsSync(english) ? english : path.join(CARDS, `${rel.join('/')}.md`)
  if (rel.length === 2 && fs.existsSync(card)) {
    fs.copyFileSync(card, path.join(OUT, `${stem}.card.md`))
    cards++
  } else if (rel.length === 2) {
    // No shot card file upstream for this recipe: publish what the build knows (its generated facts), so the adapter
    // still reads a card, and say so. The build never ships a recipe with no card at all.
    const facts = shotFactsOf(stem)
    fs.writeFileSync(path.join(OUT, `${stem}.card.md`), `---\nname: ${rel[1]}\n---\n（no upstream card file; generated from the build's shot facts）\n\n${facts}\n`)
    cards++
    stubbed.push(stem)
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index))
console.log(`gen-demo-sources: ${Object.keys(index).length} recipes, ${cards} shot cards${stubbed.length ? ` (${stubbed.length} generated from shot facts: ${stubbed.join(', ')})` : ''}`)
