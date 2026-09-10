import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Map the NEXT_PUBLIC_-prefixed key to what @clerk/testing expects.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

const isProduction = process.env.SCREENSHOT_BASE_URL?.includes('smartvid.app') || false;

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.SCREENSHOT_BASE_URL || 'http://localhost:3111',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: isProduction
    ? undefined
    : {
        command: 'npx next dev --port 3111 --turbopack',
        url: 'http://localhost:3111',
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
