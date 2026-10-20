import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import { resolveDemoAuthStatePath, resolveTargetBaseURL } from './playwright.shared';

dotenv.config({ path: '.env.local' });

// Map the NEXT_PUBLIC_-prefixed key to what @clerk/testing expects.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

// The target under test. Defaults to the OpenHiggsBolt production domain;
// override with DEMO_BASE_URL to run the very same suites against a local
// server. `https://smartvid.app` is deliberately not used — it is a different
// product ("Remix New Editor") that answers 404 for every
// `/api/personalization/*` call.
const TARGET_BASE_URL = resolveTargetBaseURL();

// Authenticate for real. A production target uses a Clerk session minted for
// the production origin; a local target uses one minted for localhost (the
// dev Clerk instance). Either way the route handlers call Clerk's `auth()`
// themselves, so a middleware-only bypass is not enough.
//
// The storage state is optional so that a missing file is reported by the
// spec's own guard (which names the path and the fix) instead of aborting
// the whole run with a bare ENOENT from Playwright.
const authStatePath = resolveDemoAuthStatePath();
const storageState = fs.existsSync(authStatePath) ? authStatePath : undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: TARGET_BASE_URL,
    storageState,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Do not start a local web server; tests run against the target above.
  webServer: null,
});
