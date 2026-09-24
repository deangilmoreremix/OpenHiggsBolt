import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

// Map the NEXT_PUBLIC_-prefixed key to what @clerk/testing expects. These run
// in the Playwright runner process and are inherited by the test workers.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export function resolveDemoBaseURL(): string {
  return process.env.DEMO_BASE_URL || 'http://localhost:3111';
}

export function resolveDemoAuthStatePath(): string {
  const origin = new URL(resolveDemoBaseURL()).origin;
  const safe = origin.replace(/[^a-z0-9]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return path.join(process.cwd(), 'playwright/.clerk', `smartvideo-demo-${safe}.json`);
}

const DEMO_BASE_URL = resolveDemoBaseURL();
const isLocalDemo = DEMO_BASE_URL === 'http://localhost:3111';

export const base = {
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: DEMO_BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: isLocalDemo
    ? {
        command: 'npx next dev --port 3111 --turbopack',
        url: 'http://localhost:3111',
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
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
      storageState: resolveDemoAuthStatePath(),
      video: {
        mode: 'on',
        size: { width: 1920, height: 1080 },
      },
      viewport: { width: 1920, height: 1080 },
    },
    outputDir: 'playwright/marketing-artifacts',
  },
];
