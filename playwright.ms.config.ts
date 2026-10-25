import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 900_000,
  expect: { timeout: 150_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'failed',
    // MS_OFFLINE_CLERK=1 (sandboxed local runs): talk to the local dev server
    // directly instead of through an exported HTTPS_PROXY.
    ...(process.env.MS_OFFLINE_CLERK === '1'
      ? { launchOptions: { args: ['--no-proxy-server'] } }
      : {}),
  },
});
