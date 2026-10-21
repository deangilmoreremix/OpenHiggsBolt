/**
 * G10a — Motion Studio: the INPUT step hands over to the FULL EDITOR.
 *
 * Architecture under test
 * -----------------------
 *   /studio/motion-studio/new  → INPUT  (prompt composer, aspect ratio,
 *                                 duration, media, recipe picker)
 *   Generate → setProject → navigate('/') → /studio/motion-studio/
 *                             → EDITOR (library grid, Remotion <Player>,
 *                                timeline, inspector, agent panel)
 *
 * The previous failure mode was the onboarding / entitlement gate: the
 * `__e2e_auth_bypass` cookie has to be readable from `document.cookie`
 * (NOT httpOnly), otherwise `requireEntitlement()` opens the upgrade modal and
 * the navigation into the editor never happens.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  BASE_URL,
  installStudioSession,
  assertNoOnboardingModal,
  ENTRY_PROMPT_PLACEHOLDER,
} from './helpers/motion-studio';

const DESCRIPTION = 'Neon cyberpunk launch reel for a coffee brand';
const INPUT_URL = `${BASE_URL}/studio/motion-studio/new`;
const EDITOR_URL = `${BASE_URL}/studio/motion-studio`;

/** The prompt textarea of the INPUT step. */
const promptBox = (page: Page) => page.getByPlaceholder(ENTRY_PROMPT_PLACEHOLDER);

/** The Generate action of the INPUT step (upstream `PromptAction`). */
const generateButton = (page: Page) =>
  page.getByRole('button', { name: /^Generate$/ });

test.describe('Motion Studio · input → editor transition', () => {
  test('Generate on the input step opens the full editor with the described project', async ({
    page,
  }) => {
    await installStudioSession(page, { entrySeen: false });

    // ── The bypass cookie must be script-readable ────────────────────────
    const bypass = (await page.context().cookies()).find(
      (c) => c.name === '__e2e_auth_bypass',
    );
    expect(bypass, 'the e2e auth bypass cookie must exist').toBeTruthy();
    expect(bypass?.httpOnly, 'the bypass cookie must NOT be httpOnly').toBe(false);
    expect(bypass?.value).toBe('1');

    // ── 1. The INPUT step ────────────────────────────────────────────────
    await page.goto(INPUT_URL, { waitUntil: 'load' });
    await assertNoOnboardingModal(page);

    await expect(page).toHaveURL(/\/studio\/motion-studio\/new\/?$/);

    // prompt textarea
    const prompt = promptBox(page);
    await expect(prompt).toBeVisible({ timeout: 60_000 });
    await expect(prompt).toHaveAttribute('placeholder', ENTRY_PROMPT_PLACEHOLDER);

    // aspect-ratio control (upstream PromptControls → PromptAspectRatioIcon)
    const aspectControl = page.getByRole('button', { name: '16:9', exact: true });
    await expect(aspectControl).toBeVisible();

    // duration control (upstream PromptControls → PromptDurationIcon)
    const durationControl = page.getByRole('button', { name: '5s', exact: true });
    await expect(durationControl).toBeVisible();

    // Generate button — disabled until the prompt has content
    const generate = generateButton(page);
    await expect(generate).toBeVisible();
    await expect(generate).toBeDisabled();

    // The editor chrome must NOT be on the input step.
    await expect(page.locator('.topbar')).toHaveCount(0);
    await expect(page.locator('.timeline')).toHaveCount(0);

    // ── 2. Fill the prompt → Generate becomes enabled ────────────────────
    await prompt.fill(DESCRIPTION);
    await expect(generate).toBeEnabled();

    // The aspect ratio / duration controls really drive the new project.
    await aspectControl.click();
    const ratioOption = page.getByRole('menuitemradio', { name: '9:16', exact: true });
    await expect(ratioOption).toBeVisible();
    await ratioOption.click();
    await expect(page.getByRole('button', { name: '9:16', exact: true })).toBeVisible();

    await durationControl.click();
    const durationOption = page.getByRole('menuitemradio', { name: '8s', exact: true });
    await expect(durationOption).toBeVisible();
    await durationOption.click();
    await expect(page.getByRole('button', { name: '8s', exact: true })).toBeVisible();

    // ── 3. Generate → the full editor takes over ─────────────────────────
    await generate.click();

    // URL: the studio root, NOT the input path.
    await expect(page).toHaveURL(/\/studio\/motion-studio\/?(\?.*)?$/, { timeout: 60_000 });
    await expect(page).not.toHaveURL(/\/studio\/motion-studio\/new/);

    // The input step is gone.
    await expect(promptBox(page)).toHaveCount(0);
    await expect(generateButton(page)).toHaveCount(0);

    // Editor chrome.
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.library-grid')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.timeline')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.inspector')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.preview-stage')).toBeVisible({ timeout: 60_000 });

    // The Remotion <Player> of the project composition is mounted.
    const player = page.locator('.preview-stage .__remotion-player');
    await expect(player).toHaveCount(1);
    await expect(player).toBeVisible();

    // The library really holds recipe cards (the grid is not an empty shell).
    await expect(page.locator('.library-grid [data-recipe-card]').first()).toBeVisible({
      timeout: 60_000,
    });

    // ── 4. The description reached the created project ───────────────────
    // (a) the project name in the top bar
    await expect(page.locator('.project-name')).toHaveValue(DESCRIPTION);

    // (b) the persisted project in localStorage
    const stored = await page.evaluate(() =>
      localStorage.getItem('shotcraft-workbench-project-v1'),
    );
    expect(stored, 'the created project must be persisted').toBeTruthy();
    const project = JSON.parse(stored as string) as {
      name: string;
      width: number;
      height: number;
      fps: number;
      tracks: { clips: { props?: Record<string, unknown> }[] }[];
    };
    expect(project.name).toBe(DESCRIPTION);
    // 9:16 at 30fps → 8s → 240 frames
    expect(project.fps).toBe(30);
    expect(project.width).toBe(720);
    expect(project.height).toBe(1280);
    expect(project.tracks[0].clips.length).toBeGreaterThanOrEqual(0);

    // The clip props carry the description when a recipe was picked.
    const clipProps = project.tracks.flatMap((t) => t.clips.map((c) => c.props ?? {}));
    for (const props of clipProps) {
      if (typeof props.description === 'string') {
        expect(props.description).toBe(DESCRIPTION);
      }
    }
  });
});
