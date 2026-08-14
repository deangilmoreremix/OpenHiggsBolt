import { defineConfig } from 'vitest/config';

// Minimal config so the React/JSX component can be unit-tested without
// a browser or Clerk. Environment is set per-file via the jsdom pragma.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.ts', '**/.kilo/**', 'tests/**/*.test.js'],
  },
});
