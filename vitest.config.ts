import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: [
      { find: /^@\/api\/(.*)$/, replacement: '/src/shared/api/$1' },
      { find: /^@\/components\/(.*)$/, replacement: '/components/$1' },
      { find: /^@\/shared\/(.*)$/, replacement: '/src/shared/$1' },
      { find: /^@\/lib\/(.*)$/, replacement: '/src/lib/$1' },
      { find: /^@\/types\/(.*)$/, replacement: '/src/types/$1' },
      { find: /^@\/stores\/(.*)$/, replacement: '/src/stores/$1' },
      { find: /^@\/apps\/(.*)$/, replacement: '/src/apps/$1' },
      { find: /^@\/app\/(.*)$/, replacement: '/app/$1' },
      { find: /^@\/packages\/studio\/(.*)$/, replacement: '/packages/studio/$1' },
      { find: /^@\/src\/(.*)$/, replacement: '/src/$1' },
      { find: /^@\/(.*)$/, replacement: '/src/$1' },
      { find: /^studio\/(.*)$/, replacement: '/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/packages/studio/$1' },
      { find: /^workflow-builder\/(.*)$/, replacement: '/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/packages/Vibe-Workflow/packages/workflow-builder/$1' },
      { find: /^design-agent\/(.*)$/, replacement: '/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/packages/Open-AI-Design-Agent/packages/design-agent/$1' },
      { find: /^ai-agent\/(.*)$/, replacement: '/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/packages/Open-Poe-AI/packages/agents/$1' },
    ],
  },
  test: {
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
      'tests/*.test.js',
      'tests/*.test.jsx',
      'tests/*.test.tsx',
      'tests/authConfig.test.ts',
    ],
  },
});
