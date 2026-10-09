import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const target = join(process.cwd(), 'node_modules', 'html-encoding-sniffer', 'lib', 'html-encoding-sniffer.js')
const patchFile = join(process.cwd(), 'patches', 'html-encoding-sniffer+6.0.0.patch')

function checkPatch() {
  let content
  try {
    content = readFileSync(target, 'utf8')
  } catch (err) {
    return false
  }
  return !content.includes('require("@exodus/bytes/encoding-lite.js")')
}

function applyPatch() {
  try {
    execSync(`npx patch-package html-encoding-sniffer`, {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, PATH: process.env.PATH },
    })
    return true
  } catch (err) {
    console.error('[patch-check] Failed to apply patch:', err.message)
    return false
  }
}

if (!checkPatch()) {
  console.log('[patch-check] Patch missing or outdated, attempting to apply...')
  if (!applyPatch()) {
    console.error('[patch-check] html-encoding-sniffer patch: FAIL — could not apply patch')
    process.exit(1)
  }
  // Re-check after applying
  if (!checkPatch()) {
    console.error('[patch-check] html-encoding-sniffer patch: FAIL — patch still not applied')
    process.exit(1)
  }
}

console.log('[patch-check] html-encoding-sniffer patch: PASS')
