import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Resolve aliases from this config file's location so the suite runs on any
// machine/CI checkout (previously hardcoded to a contributor's home path).
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: [
      { find: /^@\/api\/(.*)$/, replacement: '/src/shared/api/$1' },
      { find: /^@\/components\/(.*)$/, replacement: '/components/$1' },
      { find: /^@\/shared\/(.*)$/, replacement: '/src/shared/$1' },
      { find: /^@\/lib\/(.*)$/, replacement: '/src/lib/$1' },
      { find: /^@\/types\/(.*)$/, replacement: '/src/types/$1' },
      { find: /^@\/stores\/(.*)$/, replacement: '/src/stores/$1' },
      { find: /^@\/apps\/(.*)$/, replacement: '/src/apps/$1' },
      { find: /^@\/app\/(.*)$/, replacement: '/app/$1' },
      { find: /^@\/packages\/studio\/(.*)$/, replacement: `${repoRoot}packages/studio/$1` },
      { find: /^@\/src\/(.*)$/, replacement: `${repoRoot}src/$1` },
      { find: /^@\/(.*)$/, replacement: '/src/$1' },
      { find: /^studio\/(.*)$/, replacement: `${repoRoot}packages/studio/$1` },
      { find: /^workflow-builder\/(.*)$/, replacement: `${repoRoot}packages/Vibe-Workflow/packages/workflow-builder/$1` },
      { find: /^ai-agent\/(.*)$/, replacement: `${repoRoot}packages/Open-Poe-AI/packages/agents/$1` },
    ],
  },
  test: {
    ssr: false,
    // The personalization provider tests drive real async upload/asset lifecycles
    // (mock upload round-trips, waitForGeneration polling, provider re-renders) and
    // legitimately take 1-5s each. Vitest's 5s default was too tight and made them
    // flaky under load (they timed out rather than failing an assertion). 30s still
    // catches genuine hangs; no test relies on the 5s default.
    testTimeout: 30_000,
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'components/**/*.test.{js,jsx,ts,tsx}',
      'packages/**/*.test.{js,jsx,ts,tsx}',
      'src/apps/**/__tests__/*.{js,jsx,ts,tsx}',
      'tests/**/*.vitest.test.{js,jsx,ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      '**/*.spec.ts',
      '.kilo/**',
      'packages/*/dist/**',
      'packages/**/dist/**',
      'tests/*.test.js',
      'tests/*.test.jsx',
      'tests/*.test.tsx',
      'tests/authConfig.test.ts',
    ],
    setupFiles: ['vitest.setup.ts'],
  },
});
