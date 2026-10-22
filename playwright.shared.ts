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

/**
 * The base URL the E2E suites target.
 *
 * Defaults to the OpenHiggsBolt production domain. `https://smartvid.app` is
 * deliberately NOT used: it is a different product ("Remix New Editor") that
 * answers 404 for every `/api/personalization/*` call.
 *
 * Override it with `DEMO_BASE_URL` to point the same suites at a local server.
 */
export function resolveTargetBaseURL(): string {
  return process.env.DEMO_BASE_URL || 'https://go.smartvid.app';
}

/**
 * True when the target is a local dev server.
 *
 * A local server honours the `__e2e_auth_bypass` cookie (the dev-only escape
 * hatch in the middleware), so a local run does not need a Clerk storage
 * state. A production target must authenticate for real.
 */
export function isLocalDevTarget(baseURL: string): boolean {
  try {
    const host = new URL(baseURL).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

export function resolveDemoAuthStatePath(baseURL?: string): string {
  // A caller that targets a specific origin MUST pass it, otherwise the state
  // file is resolved for a different origin than the one under test and the
  // Clerk session silently does not apply (the route handlers call Clerk's
  // `auth()` themselves, so a mismatched state shows up as a 401).
  const origin = new URL(baseURL || resolveDemoBaseURL()).origin;
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
    testMatch: /marketing-demos\/.*\.spec\.ts|personalization-image-editor-certification\.spec\.ts/,
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
