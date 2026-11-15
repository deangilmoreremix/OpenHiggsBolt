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
      // Same reason as the webpack alias below: never resolve onnxruntime-node's native binaries.
      'onnxruntime-node': { browser: './scripts/empty-module.js', default: './scripts/empty-module.js' },
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
  // On-device background removal (@bg0/browser → @huggingface/transformers) imports `onnxruntime-node` for Node
  // use. The app only runs it in the browser (a Web Worker uses onnxruntime-web), but webpack still resolves the
  // import and then fails trying to parse onnxruntime-node's native `.node` binaries ("Module parse failed:
  // Unexpected character" on bin/napi-v3/*/onnxruntime_binding.node) — which broke every Netlify build after the
  // BG0 merge. Aliasing it to nothing is the documented Transformers.js + Next.js setup; nothing server-side
  // uses onnxruntime-node.
  webpack: (config, { isServer }) => {
    config.resolve.alias = { ...config.resolve.alias, 'onnxruntime-node$': false };
    if (isServer) {
      // Background removal only ever runs in the browser. The server (SSR) pass still walks the dynamic import,
      // which pulled @huggingface/transformers' whole Node build (and sharp) into the server compile: extra
      // memory, "Module not found" noise from sharp's optional native packages, and a bigger function bundle.
      // Nothing on the server executes it, so resolve it to nothing there.
      config.resolve.alias['@bg0/browser$'] = false;
    }
    return config;
  },
  // Motion Studio was removed; its old links open Motion Director.
  async redirects() {
    return [
      { source: '/studio/motion-studio', destination: '/studio/motion-director', permanent: false },
      { source: '/studio/motion-studio/:path*', destination: '/studio/motion-director', permanent: false },
    ];
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
