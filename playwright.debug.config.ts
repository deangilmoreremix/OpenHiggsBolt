import { defineConfig } from '@playwright/test';
import { base, normalProjects } from './playwright.shared';

export default defineConfig({
  ...base,
  testIgnore: ['e2e/marketing-demos/**', 'e2e/global.setup.ts'],
  projects: normalProjects.map((p: any) => ({
    ...p,
    use: {
      ...p.use,
      baseURL: 'http://localhost:3111',
    },
  })),
  webServer: undefined as any,
});
