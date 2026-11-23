import { test, expect } from '@playwright/test';

/**
 * S2 in the real modal: an AI run that fails offers exactly two choices — retry the same operation, or return to
 * editing — keeps everything the user entered, and never sends a different request. The dev server has no MuAPI key,
 * so choosing "Generate with AI" fails immediately and deterministically; every network call is recorded.
 */
const AI_REQUEST = /muapi|openai|\/api\/personalization\/(personalize|generate|recast|generate-prompt)|promptPersonaliz/i;

test('a failed AI run: Retry / Return to editing only; nothing is lost; no other billable request is sent', async ({ page }) => {
  test.setTimeout(180_000);
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.context().addCookies([{ name: '__e2e_auth_bypass', value: '1', url: process.env.DEMO_BASE_URL || 'http://localhost:3111' }]);
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'Recovery Co');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();

  await dialog.getByRole('tab', { name: /Overlays & Create/i }).click();
  await dialog.getByRole('tab', { name: /Output & engine/i }).click();
  await dialog.getByRole('button', { name: /^Video\b/ }).first().click();
  await dialog.getByTestId('pz-method-ai').click();
  await dialog.getByRole('button', { name: /Recreate For Client/i }).first().click();

  const aiBefore = requests.filter((u) => AI_REQUEST.test(u)).length;
  const footer = dialog.locator('footer').getByRole('button').last();
  await expect(footer).toBeEnabled();
  await footer.click();

  // The error screen: the reason, and exactly two choices.
  const view = dialog.getByTestId('pz-error-view');
  await expect(view).toBeVisible({ timeout: 30_000 });
  await expect(view.getByRole('alert')).not.toBeEmpty();
  await expect(view.getByRole('button')).toHaveCount(2);
  await expect(view.getByTestId('pz-error-retry')).toBeVisible();
  await expect(view.getByTestId('pz-error-return')).toHaveText(/Return to editing/);
  await expect(view).not.toContainText('Try Again');
  await expect(view).toContainText('have been kept');

  // Retry repeats the same operation: it fails the same way, and the screen is still the same two choices.
  await view.getByTestId('pz-error-retry').click();
  await expect(dialog.getByTestId('pz-error-view')).toBeVisible();
  await expect(dialog.getByTestId('pz-error-view').getByRole('button')).toHaveCount(2);

  // Return to editing: back in the wizard with everything intact.
  await dialog.getByTestId('pz-error-return').click();
  await expect(dialog.getByTestId('pz-error-view')).toHaveCount(0);
  // The choices made before the failure are still in place (AI method, Recreate mode) and so is the typed name.
  await dialog.getByRole('tab', { name: /Overlays & Create/i }).click();
  await dialog.getByRole('tab', { name: /Output & engine/i }).click();
  await expect(dialog.getByTestId('pz-method-ai')).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByRole('button', { name: /Recreate For Client/i }).first()).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('tab', { name: /^Client/i }).first().click();
  await expect(page.locator('input[placeholder="ABC Roofing"]')).toHaveValue('Recovery Co');

  // Nothing billable went out at any point (no key, so nothing could be sent).
  const aiAfter = requests.filter((u) => AI_REQUEST.test(u));
  expect(aiAfter.length - aiBefore, `AI requests during recovery: ${aiAfter.join(', ')}`).toBe(0);
});
