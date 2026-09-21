import { defineConfig } from '@playwright/test';
import { base, marketingProjects } from './playwright.shared';

export default defineConfig({
  ...base,
  projects: marketingProjects,
});
