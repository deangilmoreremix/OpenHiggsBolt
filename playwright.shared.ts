import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Map the NEXT_PUBLIC_-prefixed key to what @clerk/testing expects. These run
// in the Playwright runner process and are inherited by the test workers.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export const base = {
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3111',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx next dev --port 3111 --turbopack',
    url: 'http://localhost:3111',
    reuseExistingServer: true,
    timeout: 180_000,
  },
};

export const normalProjects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
];

export const marketingProjects = [
  {
    name: 'global setup',
    testMatch: /global\.setup\.ts/,
  },
  {
    name: 'marketing-demos',
    testMatch: /marketing-demos\/.*\.spec\.ts/,
    dependencies: ['global setup'],
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.clerk/smartvideo-demo.json',
      video: {
        mode: 'on',
        size: { width: 1920, height: 1080 },
      },
      viewport: { width: 1920, height: 1080 },
    },
  },
];
