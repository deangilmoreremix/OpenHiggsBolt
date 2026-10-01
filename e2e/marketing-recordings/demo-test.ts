import { test as base, expect } from '@playwright/test';
import { resolveDemoBaseURL } from '../../playwright.shared';
import {
  buildForbiddenGenerationPatterns,
  installForbiddenRequestGuard,
} from './helpers/recording';

type RecordingFixtures = {
  recordingSafety: void;
};

type RecordingWorkerFixtures = {
  demoBaseURL: string;
};

const test = base.extend<RecordingFixtures, RecordingWorkerFixtures>({
  demoBaseURL: [
    async ({}, use) => {
      await use(resolveDemoBaseURL());
    },
    { scope: 'worker' },
  ],
  recordingSafety: [
    async ({ page }, use) => {
      const guard = await installForbiddenRequestGuard(
        page,
        buildForbiddenGenerationPatterns()
      );

      await use();

      guard.assertClean();
      await guard.dispose();
    },
    { auto: true },
  ],
});

export { test, expect };
