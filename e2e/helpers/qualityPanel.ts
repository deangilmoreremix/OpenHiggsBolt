import { expect, type Page } from '@playwright/test';

/**
 * The Layout Quality Check is a compact bar under the video; the full panel (issue list, status,
 * scope, Fix / Apply / subject controls) opens with its "Review" button, and opens by itself when
 * export is blocked. Call this before reading anything inside `layout-quality-panel`.
 */
export async function openQualityPanel(page: Page): Promise<void> {
  const toggle = page.getByTestId('layout-quality-toggle');
  await expect(page.getByTestId('layout-quality-bar')).toBeVisible();
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(page.getByTestId('layout-quality-panel')).toBeVisible();
}
