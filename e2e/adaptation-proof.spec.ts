import { test } from '@playwright/test';
import { proveAdaptation, PROOFS } from './helpers/adaptation-proof';

/**
 * OFFLINE adaptation proof with a REFERENCE source standing in for the model (the recipe's own served TSX, which already reads the
 * customer's geometry). It proves the pipeline and the acceptance checks — exact recipe source and card → loop → sandbox → gate →
 * frames → geometry/motion/identity/reopen — and is NOT evidence that a model can write such an adaptation. For that see
 * e2e/live/adaptation.spec.ts (BLOCKED — NO AUTHORIZED KEY without MS_LIVE_OPENAI_KEY).
 */
for (const stem of Object.keys(PROOFS)) {
  test(`reference adaptation of ${stem}: exact source in, customer content and geometry out, motion kept, reopens`, async ({ page }, testInfo) => {
    test.setTimeout(20 * 60_000);
    await proveAdaptation(page, stem, 'reference', testInfo);
  });
}
