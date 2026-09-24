import { test as base, expect } from '@playwright/test';
import { resolveDemoBaseURL, resolveDemoAuthStatePath } from '../../playwright.shared';

type Fixtures = {
  demoBaseURL: string;
};

const test = base.extend<Fixtures>({
  demoBaseURL: [resolveDemoBaseURL, { scope: 'worker' }],
});

export { test, expect };
