#!/usr/bin/env node
/**
 * Compiles the Motion Studio background capture (`src/server/motionCaptureWorker.ts`) to CommonJS for
 * the `motion-studio-capture-background` Netlify function, the same way `build-fast-discovery.mjs` does
 * for the discovery worker: the function is bundled with Netlify's default bundler, which cannot run
 * TypeScript. Packages stay external so the bundler traces and ships them (Chromium's binary included).
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const requireFromRoot = createRequire(path.join(root, 'package.json'))
const esbuild = createRequire(requireFromRoot.resolve('tsx/package.json'))('esbuild')

const outfile = path.join(root, 'netlify/lib/motion-capture.cjs')

await esbuild.build({
  entryPoints: [path.join(root, 'src/server/motionCaptureWorker.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  packages: 'external',
  tsconfig: path.join(root, 'tsconfig.json'),
  logLevel: 'warning',
})

console.log(`[build-motion-capture] wrote ${path.relative(root, outfile)}`)
