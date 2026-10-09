import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const cwd = process.cwd()

// html-encoding-sniffer@6.0.0 is a direct dependency of jsdom@29. Resolve it
// from jsdom's package root so this check works under both npm's flat
// node_modules layout and pnpm's isolated node_modules/.pnpm layout.
function candidatePaths() {
  const paths = [
    // npm flat layout: hoisted to the root of node_modules
    join(cwd, 'node_modules', 'html-encoding-sniffer', 'lib', 'html-encoding-sniffer.js'),
  ]
  try {
    const jsdomPkgJson = require.resolve('jsdom/package.json', { paths: [cwd] })
    const jsdomRoot = dirname(jsdomPkgJson)
    // pnpm isolated layout: jsdom's dependencies are symlinked next to it
    paths.push(join(jsdomRoot, '..', 'html-encoding-sniffer', 'lib', 'html-encoding-sniffer.js'))
  } catch {
    // jsdom is not installed; the root path above is the only candidate
  }
  return paths
}

function checkPatch() {
  for (const path of candidatePaths()) {
    let content
    try {
      content = readFileSync(path, 'utf8')
    } catch {
      continue
    }
    if (!content.includes('require("@exodus/bytes/encoding-lite.js")')) {
      return { patched: true, path }
    }
    return { patched: false, path }
  }
  return { patched: false, path: null }
}

const BAD_REQUIRE = 'require("@exodus/bytes/encoding-lite.js")'

let result = checkPatch()

if (!result.patched && result.path && result.path.startsWith(join(cwd, 'node_modules', 'html-encoding-sniffer'))) {
  // npm flat layout: apply the patch with patch-package (patches/ directory)
  console.log('[patch-check] Patch missing or outdated, attempting to apply...')
  try {
    execSync('npx patch-package html-encoding-sniffer', {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, PATH: process.env.PATH },
    })
    result = checkPatch()
  } catch (err) {
    console.error('[patch-check] Failed to apply patch:', err.message)
  }
}

if (result.patched) {
  console.log(`[patch-check] html-encoding-sniffer patch: PASS (${result.path})`)
} else if (result.path) {
  console.error(`[patch-check] html-encoding-sniffer patch: FAIL — unpatched file still contains ${BAD_REQUIRE}`)
  console.error('[patch-check] Under pnpm the patch is applied at install time via patchedDependencies in pnpm-workspace.yaml.')
  console.error('[patch-check] Reinstall dependencies (pnpm install) so the patch is applied, then rebuild.')
  process.exit(1)
} else {
  console.error('[patch-check] html-encoding-sniffer patch: FAIL — package not found in node_modules')
  process.exit(1)
}
