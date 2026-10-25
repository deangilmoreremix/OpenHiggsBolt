import { test, expect } from '@playwright/test';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';

/**
 * A Motion Studio project with an audio clip (music or a sound effect)
 * exports to MP4. The audio card must use @remotion/media's <Audio>: the
 * in-browser renderer rejects remotion's HTML5 <Audio>.
 */
test('Motion Studio exports a film with an audio clip', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);
  const clip = (id: string, cardId: string, start: number, duration: number, props: Record<string, unknown>) => ({
    id, cardId, start, duration, inOffset: 0, speed: 1, opacity: 1, scale: 1, x: 0, y: 0, props,
  });
  await installStudioSession(page, {
    entrySeen: true,
    extra: {
      'shotcraft-workbench-project-v1': JSON.stringify({
        name: 'Audio export', fps: 30, width: 1280, height: 720, background: '#111111',
        tracks: [
          { id: 't1', name: 'Shots', clips: [clip('c1', 'inkpress-title-card', 0, 60, { text: 'Hello *world*' })] },
          { id: 't2', name: 'SFX', clips: [clip('c2', 'audio-clip', 10, 24, { file: 'motion-studio/sfxlib/transition/swoosh-quick.mp3', volume: 0.6 })] },
        ],
      }),
    },
  });
  await page.goto(`${BASE_URL}/studio/motion-studio`);
  await expect(page.locator('.project-name')).toHaveValue('Audio export', { timeout: 120_000 });
  await page.getByRole('button', { name: 'Export video' }).click();
  const failed = page.getByRole('button', { name: /Export failed/ });
  const done = page.locator('a[download$=".mp4"]');
  await expect(failed.or(done)).toBeVisible({ timeout: 8 * 60 * 1000 });
  expect(await failed.isVisible() ? await failed.getAttribute('title') : null).toBeNull();
});
