#!/usr/bin/env node
/**
 * Compiles the free discovery layers (static HTTP → sitemap → Crawlee/Cheerio,
 * `src/server/fastDiscovery.ts`) to CommonJS for the
 * `personalization-browser-discovery` Netlify function.
 *
 * That function is bundled with Netlify's default bundler, which copies files
 * as they are and cannot run TypeScript, so without this step the worker
 * could never load the free layers. Packages stay external: the bundler
 * traces the `require()` calls in the output and ships those packages (and
 * Chromium's binary files) exactly as it does for the worker itself.
 *
 * esbuild is resolved through tsx, a root devDependency that depends on it.
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const requireFromRoot = createRequire(path.join(root, 'package.json'))
const esbuild = createRequire(requireFromRoot.resolve('tsx/package.json'))('esbuild')

const outfile = path.join(root, 'netlify/lib/fast-discovery.cjs')

await esbuild.build({
  entryPoints: [path.join(root, 'src/server/fastDiscovery.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  packages: 'external',
  tsconfig: path.join(root, 'tsconfig.json'),
  logLevel: 'warning',
})

console.log(`[build-fast-discovery] wrote ${path.relative(root, outfile)}`)
