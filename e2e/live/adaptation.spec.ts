import { test } from '@playwright/test';
import { proveAdaptation, PROOFS } from '../helpers/adaptation-proof';

/**
 * LIVE adaptation: the real model reads the exact recipe card + TSX and adapts it to the customer's page; the same measurements as the
 * offline proof decide whether it is accepted. Requires MS_LIVE_OPENAI_KEY (see e2e/live/live-director.spec.ts); otherwise BLOCKED — NO AUTHORIZED KEY.
 */
const KEY = process.env.MS_LIVE_OPENAI_KEY;
for (const stem of Object.keys(PROOFS)) {
  test(`LIVE model adapts ${stem}`, async ({ page }, testInfo) => {
    test.skip(!KEY, 'BLOCKED — NO AUTHORIZED KEY');
    test.setTimeout(25 * 60_000);
    await proveAdaptation(page, stem, 'model', testInfo);
  });
}
