import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const script = path.resolve('scripts/verify-motion-sources.mjs')
const run = (cwd: string) => spawnSync('node', [script], { cwd, encoding: 'utf8' })

describe('verify-motion-sources (the build guard for the recipe sources)', () => {
  it('fails the build when the generator output is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-sources-'))
    const r = run(dir)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/index\.json is missing/)
  })

  it('fails when a catalog recipe has no published source', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-sources-'))
    fs.mkdirSync(path.join(dir, 'public/motion-studio/sources'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'public/motion-studio/sources/index.json'), '{}')
    fs.mkdirSync(path.join(dir, 'src/data'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'src/data/motionRecipeCatalog.ts'), Array.from({ length: 120 }, (_, i) => `componentName: 'Recipe${i}'`).join('\n'))
    const r = run(dir)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/120 catalog recipes have no published source/)
  })

  it('passes on this repository once the sources are generated', () => {
    const gen = spawnSync('node', [path.resolve('scripts/gen-demo-sources.mjs')], { encoding: 'utf8' })
    expect(gen.status).toBe(0)
    const r = run(process.cwd())
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/catalog recipes each have a source and a shot card/)
  })
})
