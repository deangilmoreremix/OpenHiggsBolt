import { test, expect } from '@playwright/test';

test.describe('Personalization Demo', () => {
  test('auto-opens the personalization modal with the sample source', async ({ page }) => {
    // The demo page always renders — there is no MuAPI-key gate. The
    // ?test=true flag only adds the "Test mode active" banner.
    await page.goto('/personalization-demo?test=true');

    await expect(page.getByRole('heading', { name: /Personalization Modal/i })).toBeVisible();
    await expect(page.getByText(/Test mode active/i)).toBeVisible();

    // The demo page opens the personalization modal automatically with the
    // sample "Viral Roofing Demo" source — no API key is required to open it.
    const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Source Demo' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Client Profile' })).toBeVisible();
    // The sample source itself is loaded into the modal.
    await expect(dialog.getByText('Viral Roofing Demo — Storm Damage')).toBeVisible();
  });

  test('requires a client business name before personalizing', async ({ page }) => {
    await page.goto('/personalization-demo');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByText('Original Prompt', { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText('Personalized Prompt', { exact: true }).first()).toBeVisible();

    // The personalize action is disabled until a client business name is set.
    const personalizeButtons = dialog.getByRole('button', { name: /Personalize Prompt/i });
    await expect(personalizeButtons.first()).toBeDisabled();

    // Entering a client business name enables personalization.
    await dialog.getByPlaceholder('ABC Roofing').fill('Summit Exteriors');
    await expect(personalizeButtons.first()).toBeEnabled();
  });
});
