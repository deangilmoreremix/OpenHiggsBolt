import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Map the NEXT_PUBLIC_-prefixed key to what @clerk/testing expects. These run
// in the Playwright runner process and are inherited by the test workers.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  // Clerk's testing-token sign-in and client-rendered auth forms don't play
  // well with parallel workers (shared dev instance + CDN contention), so run
  // serially. Retries absorb the occasional cold-start/rate-limit flake from
  // the live Clerk dev instance.
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3111',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next dev --port 3111 --turbopack',
    url: 'http://localhost:3111',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
