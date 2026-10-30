import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */

// Pin the app root to this config's own directory. Without it Next.js infers
// the workspace root from the first lockfile it finds and wrongly picks the
// parent monorepo (this worktree has its own pnpm-lock.yaml).
const rootDir = fileURLToPath(new URL('.', import.meta.url))

// Serverless Chromium (src/server/browserDiscovery.ts) decompresses its browser
// from @sparticuz/chromium/bin at launch. Nothing require()s those files, so
// the file tracer leaves them out of the server bundle, and on Netlify every
// capture failed with 'The input directory ".../@sparticuz/chromium/bin" does
// not exist'. List them explicitly for Motion Director's capture route. Both
// spellings: the hoisted symlink and pnpm's real path, which is where the
// package resolves from inside the bundle.
const CHROMIUM_BIN = [
  './node_modules/@sparticuz/chromium/bin/**',
  './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**',
]

const nextConfig = {
  experimental: {
    cacheComponents: false,
  },
  turbopack: {
    root: rootDir,
    resolveAlias: {
      '@': ['./src', './'],
      '@/components': ['./components', './src/shared/components'],
      '@/components/*': ['./components/*', './src/shared/components/*'],
      '@/api': ['./src/shared/api'],
      '@/api/*': ['./src/shared/api/*'],
      '@/types': ['./src/types', './src/shared/types'],
      '@/types/*': ['./src/types/*', './src/shared/types/*'],
      '@/stores': ['./src/stores'],
      '@/stores/*': ['./src/stores/*'],
    },
  },
  transpilePackages: [
    'studio',
    'ai-agent',
    'workflow-builder',
    'design-agent',
    // Remotion ships untranspiled ESM; the Personalization Modal preview
    // (Player + composition) is imported by client components, so the packages
    // must go through the Next.js compiler.
    // `@remotion/web-renderer` is deliberately NOT listed and NOT externalized:
    // it is dynamically imported from a client component only, so it is code
    // split out of the main bundle by the client boundary instead.
    'remotion',
    '@remotion/player',
  ],
  serverExternalPackages: [
    'electron',
    'app-builder-bin',
    '@typescript-eslint',
    'figlet',
    '7zip-bin',
    'es-abstract',
    'playwright',
    'got-scraping',
    'get-stream',
    '@crawlee/cheerio',
  ],
  // Same root as turbopack.root: tracing must resolve against this worktree,
  // not the parent monorepo whose lockfile Next.js otherwise prefers.
  outputFileTracingRoot: rootDir,
  outputFileTracingIncludes: {
    '/api/motion-studio/capture': CHROMIUM_BIN,
  },
  outputFileTracingExcludes: {
    '*': [
      'node_modules/playwright/**',
      'node_modules/@playwright/**',
      'node_modules/electron/**',
      'node_modules/electron-builder/**',
      'node_modules/app-builder-bin/**',
      'node_modules/7zip-bin/**',
      'node_modules/**/*.map',
      // --- Function bundle size control (Netlify 250 MB limit) ---
      //
      // The traced server bundle used to be ~773 MB, which is far over the
      // Netlify function size limit. The function then fails to boot and every
      // SSR route answers 502. The two dominant contributors were a webpack
      // filesystem cache and Next.js' own build-time toolchain; neither is
      // reachable from the production server, so both are excluded here.
      //
      // 1. Webpack filesystem cache. Remotion writes its bundler cache to
      //    node_modules/.cache/webpack/remotion-production-<version>/ while
      //    `next build` prerenders the studio compositions. The three .pack
      //    files are 622 MB of build cache and have zero runtime value; the
      //    file tracer picks them up only because they sit inside node_modules.
      'node_modules/.cache/**',
      // 2. Next.js' build toolchain. These are dependencies of the `next`
      //    package, so the file tracer pulls them in, but the production
      //    server never requires them: `next/dist/server/**` has no
      //    require() of webpack/esbuild/rspack/typescript/postcss outside
      //    next/dist/{build,compiled,dev}/** (Next uses its own inlined
      //    copies of webpack, postcss and styled-jsx at runtime). Removing
      //    them from a packaged bundle and booting it was verified to leave
      //    every SSR route working.
      'node_modules/webpack/**',
      'node_modules/esbuild/**',
      'node_modules/@esbuild/**',
      'node_modules/@rspack/**',
      'node_modules/typescript/**',
      'node_modules/postcss/**',
      'node_modules/lightningcss/**',
      'node_modules/caniuse-lite/**',
      'node_modules/terser/**',
      // NOT excluded on purpose: playwright-core, chromium-bidi, @sparticuz/
      // chromium and @crawlee/* ARE imported at runtime by the
      // app/api/personalization/discover-assets route (src/server/
      // browserDiscovery.ts and src/server/crawleeProvider.ts). They add only
      // ~8 MB to the bundle, and the separate netlify/functions/browser-probe.js
      // and netlify/functions/personalization-browser-discovery.js functions
      // resolve them from the repository's node_modules, not from this
      // traced bundle.
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.103:3000',
    // Add any additional origins you use during development
    // e.g., 'http://localhost:3001', 'http://127.0.0.1:3001'
  ],
};

export default nextConfig;
