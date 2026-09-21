import { defineConfig } from '@playwright/test';
import { base, normalProjects } from './playwright.shared';

export default defineConfig({
  ...base,
  testIgnore: ['e2e/marketing-demos/**', 'e2e/global.setup.ts'],
  projects: normalProjects,
});
