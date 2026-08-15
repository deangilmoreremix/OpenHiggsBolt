import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

// Minimal config so the React/JSX component can be unit-tested without
// a browser or Clerk. Environment is set per-file via the jsdom pragma.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  // Resolve the app's `@/...` path alias (matches tsconfig `paths`) so
  // social-publishing components can be imported directly in tests.
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: `${srcDir}/$1` }],
  },
  test: {
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'components/**/*.test.{js,jsx,ts,tsx}',
      'packages/studio/src/**/*.test.{js,jsx,ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.ts', '**/.kilo/**', 'tests/**/*.test.js'],
  },
});
