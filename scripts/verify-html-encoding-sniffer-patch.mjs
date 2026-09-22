import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const target = join(process.cwd(), 'node_modules', 'html-encoding-sniffer', 'lib', 'html-encoding-sniffer.js')

let content
try {
  content = readFileSync(target, 'utf8')
} catch (err) {
  console.error(`[patch-check] html-encoding-sniffer patch: FAIL — missing file: ${target}`)
  process.exit(1)
}

if (content.includes('require("@exodus/bytes/encoding-lite.js")')) {
  console.error('[patch-check] html-encoding-sniffer patch: FAIL — old @exodus/bytes require still present')
  process.exit(1)
}

console.log('[patch-check] html-encoding-sniffer patch: PASS')
