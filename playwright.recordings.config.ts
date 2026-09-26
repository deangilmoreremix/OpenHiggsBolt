import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { base, resolveDemoBaseURL, resolveDemoAuthStatePath } from './playwright.shared';

const DEMO_BASE_URL = resolveDemoBaseURL();
const isLocalDemo = DEMO_BASE_URL === 'http://localhost:3111';

export const recordingsOutputDir = path.join(
  process.cwd(),
  'playwright',
  'marketing-recordings'
);

export default defineConfig({
  ...base,
  testDir: './e2e/marketing-recordings',
  testMatch: /.*\.spec\.ts$/,
  timeout: 240_000,
  projects: [
    {
      name: 'global setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'recordings',
      use: {
        ...devices['Desktop Chrome'],
        storageState: resolveDemoAuthStatePath(),
        video: {
          mode: 'on',
          size: { width: 1920, height: 1080 },
        },
        viewport: { width: 1920, height: 1080 },
      },
      outputDir: recordingsOutputDir,
      dependencies: ['global setup'],
    },
  ],
  webServer: isLocalDemo
    ? {
        command: 'npm run build && next start --port 3111',
        url: 'http://localhost:3111',
        reuseExistingServer: true,
        timeout: 600_000,
      }
    : undefined,
});
