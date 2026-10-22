/**
 * Find every bare-module import in the repo's source that is NOT declared in
 * package.json dependencies/devDependencies. These resolve locally only by
 * accident and break any clean install (CI / Netlify).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const ROOT = process.cwd()
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const declared = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
])

const SCAN_ROOTS = ['src', 'app', 'components', 'packages/studio/src', 'lib', 'scripts']
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', '.netlify', 'build', 'out', 'coverage'])

const IMPORT_RE =
  /(?:^|[\s;{(])(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,.]+\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/gm

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) out.push(p)
  }
  return out
}

const bare = new Map() // module -> Set(files)
for (const root of SCAN_ROOTS) {
  for (const file of walk(join(ROOT, root))) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(IMPORT_RE)) {
      const spec = m[1] || m[2]
      if (!spec) continue
      if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('@/') || spec.startsWith('~/')) continue
      if (spec.startsWith('node:')) continue
      // scoped packages
      const parts = spec.split('/')
      const pkgName = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
      if (pkgName.startsWith('next/') || pkgName === 'next') continue
      if (declared.has(pkgName)) continue
      if (!bare.has(pkgName)) bare.set(pkgName, new Set())
      bare.get(pkgName).add(file.replace(ROOT + '/', ''))
    }
  }
}

if (bare.size === 0) {
  console.log('OK: every bare import is declared in package.json')
} else {
  console.log('UNDECLARED PACKAGES (imported in source but absent from package.json):\n')
  for (const [name, files] of [...bare].sort()) {
    console.log(`  ${name}`)
    for (const f of [...files].slice(0, 4)) console.log(`      ${f}`)
    if (files.size > 4) console.log(`      ... +${files.size - 4} more`)
  }
}

// Also report versions of the offending packages if they are present locally
console.log('\nLOCAL RESOLUTION (are they installed by accident?):')
for (const name of bare.keys()) {
  const p = join(ROOT, 'node_modules', name, 'package.json')
  let v = 'not installed'
  if (existsSync(p)) {
    try { v = JSON.parse(readFileSync(p, 'utf8')).version } catch { v = 'unreadable' }
  }
  console.log(`  ${name}: ${v}`)
}
