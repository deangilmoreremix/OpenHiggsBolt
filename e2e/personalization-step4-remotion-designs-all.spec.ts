import { test, expect, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 2 — EVERY registered Remotion design is selectable in Simple Mode
 * Step 4 and actually renders in the live preview.
 *
 * Phase 1 proved the FIVE original designs render in Step 4. Phase 2 grew the
 * registry to NINETEEN designs (5 Phase 1 + 10 batch 1 + 4 batch 2), and this
 * spec is the real-browser acceptance test for the whole catalog:
 *
 *   1. the "Designs" group lists exactly 19 designs and each one is a
 *      pill-shaped (border-radius 999) chip;
 *   2. the FIVE original layout pills (Business Introduction, Product
 *      Showcase, Service Promotion, Special Offer, Branded Ending) are still
 *      present, still pill-shaped and still selectable — Phase 2 must not
 *      have changed them;
 *   3. EVERY one of the 19 designs can be selected, and each selection
 *      produces a `[data-remotion-design-id="<id>"]` element inside the
 *      "After: personalized preview" region (the very composition the
 *      browser export bakes);
 *   4. every design draws its own credit line
 *      (`[data-remotion-design-credit]`) inside that layer;
 *   5. clicking the active design again CLEARS it.
 *
 * THE DESIGN IDS ARE READ AT RUNTIME
 * -----------------------------------
 * The list is NOT hard-coded in this spec. It is parsed out of the registry
 * source at run time (`src/shared/personalization/templates/catalog.ts` and
 * `src/shared/personalization/templates/designs/rveCatalogEntries.ts` — the
 * two modules the registry registers from) and then CROSS-CHECKED against
 * the chips the running app renders. So the spec fails if a design is
 * registered but not surfaced, or surfaced but not registered. The expected
 * COUNT (19) is asserted separately, so a silently dropped design is a
 * failure rather than a smaller green run.
 *
 * REQUIREMENTS
 * ------------
 * A production server must already be listening on http://localhost:3111 —
 * the Playwright config's own `webServer` command starts the broken
 * `--turbopack` dev server, so this spec reuses an existing server:
 *
 *     npm run build
 *     npx next start --port 3111
 */

const SHOT_DIR = path.join(process.cwd(), 'docs', 'screenshots', 'phase-2');
const TEMPLATE_DIR = path.join(process.cwd(), 'src', 'shared', 'personalization', 'templates');

/** How many designs the registry must expose in Step 4. */
const EXPECTED_DESIGN_COUNT = 19;

/** The five layout pills that must survive Phase 2 untouched. */
const LAYOUT_PILLS = [
  'Business Introduction',
  'Product Showcase',
  'Service Promotion',
  'Special Offer',
  'Branded Ending',
];

interface RegistryDesign {
  id: string;
  name: string;
}

/**
 * Reads the registry's design ids and names at run time.
 *
 * The registry lives in `templates/registry.ts` and is populated from the two
 * catalog modules by an import side effect, so those two modules are where the
 * id/name pairs are declared. Parsing them keeps the spec free of a
 * hard-coded list that could drift away from the product.
 */
function readRegistryDesigns(): RegistryDesign[] {
  const files = [
    path.join(TEMPLATE_DIR, 'catalog.ts'),
    path.join(TEMPLATE_DIR, 'designs', 'rveCatalogEntries.ts'),
  ];

  const designs: RegistryDesign[] = [];
  const pattern =
    /export const \w+Template: RemotionDesignTemplate = \{\s*id: '([^']+)',\s*name: '([^']+)'/g;

  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new Error(`registry source not found: ${file}`);
    }
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) {
      designs.push({ id: match[1], name: match[2] });
    }
  }

  return designs;
}

/** A chip as the browser reports it. */
interface RenderedChip {
  name: string;
  radius: string;
  pressed: string | null;
}

function shot(name: string): string {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  return path.join(SHOT_DIR, name);
}

/**
 * Navigates, retrying a couple of times.
 *
 * The production server is a single Node process; a cold `goto` can
 * occasionally time out while the server is busy.
 */
async function gotoWithRetry(page: Page, url: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { timeout: 60_000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(2000);
    }
  }
  throw lastError;
}

/**
 * Opens the demo, jumps to Step 4 and switches the preview into compare mode.
 *
 * Compare (split) mode mounts BOTH the original and the personalized player.
 * The default "toggle" mode renders a single player that starts on the
 * original, so the personalized composition — where the design layer lives —
 * is not in the DOM until the user flips it.
 */
async function openStep4(page: Page): Promise<Locator> {
  await gotoWithRetry(page, '/personalization-demo?test=true');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Compare with the original video' }).click();
  await dialog.getByRole('button', { name: 'Compare' }).click();
  await expect(page.getByRole('region', { name: 'After: personalized preview' })).toBeVisible();

  return dialog;
}

/**
 * Reads every chip of the "Designs" group straight out of the DOM.
 *
 * The group is a `<div>` that holds the "Designs" label and the row of design
 * chips, so the chips are the buttons inside the label's parent.
 */
async function readDesignChips(dialog: Locator): Promise<RenderedChip[]> {
  const designsLabel = dialog.getByText('Designs', { exact: true });
  await designsLabel.waitFor({ state: 'visible' });

  return designsLabel.evaluate((el) => {
    const group = el.parentElement;
    if (!group) return [];
    return Array.from(group.querySelectorAll('button')).map((button) => ({
      name: (button.textContent ?? '').trim(),
      radius: getComputedStyle(button).borderRadius,
      pressed: button.getAttribute('aria-pressed'),
    }));
  });
}

test.describe('Phase 2 — every registered Remotion design works in Step 4', () => {
  test('the Designs group lists all 19 registered designs as pill chips', async ({ page }) => {
    const dialog = await openStep4(page);

    const registry = readRegistryDesigns();

    // The registry source really declares 19 designs.
    expect(registry.length, 'the registry source no longer declares 19 designs').toBe(
      EXPECTED_DESIGN_COUNT,
    );
    expect(new Set(registry.map((d) => d.id)).size).toBe(EXPECTED_DESIGN_COUNT);

    // …and the app renders exactly those 19, in the same order.
    const chips = await readDesignChips(dialog);
    expect(chips.length, 'the Designs group does not list 19 designs').toBe(EXPECTED_DESIGN_COUNT);
    expect(chips.map((chip) => chip.name)).toEqual(registry.map((design) => design.name));

    // Every chip is a pill (border-radius 999) and starts unselected.
    for (const chip of chips) {
      expect(chip.radius, `${chip.name} is not a pill`).toContain('999');
      expect(chip.pressed, `${chip.name} starts selected`).toBe('false');
    }
  });

  test('the five original layout pills are unchanged and still selectable', async ({ page }) => {
    const dialog = await openStep4(page);

    for (const label of LAYOUT_PILLS) {
      const pill = dialog.getByRole('button', { name: label, exact: true });
      await expect(pill, `${label} disappeared`).toBeVisible();
      const radius = await pill.evaluate((el) => getComputedStyle(el).borderRadius);
      expect(radius, `${label} is no longer a pill`).toContain('999');
    }

    // The first layout is active by default and switching still works.
    await expect(dialog.getByRole('button', { name: 'Business Introduction', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await dialog.getByRole('button', { name: 'Product Showcase', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Product Showcase', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await dialog.getByRole('button', { name: 'Service Promotion', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Service Promotion', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await dialog.getByRole('button', { name: 'Special Offer', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Special Offer', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await dialog.getByRole('button', { name: 'Branded Ending', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Branded Ending', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('every one of the 19 designs is selectable and renders its layer and credit line', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const dialog = await openStep4(page);
    const registry = readRegistryDesigns();
    expect(registry.length).toBe(EXPECTED_DESIGN_COUNT);

    const after = page.getByRole('region', { name: 'After: personalized preview' });
    const evidence: { id: string; name: string; credit: string | null }[] = [];

    for (const design of registry) {
      const pill = dialog.getByRole('button', { name: design.name, exact: true });
      await expect(pill, `${design.name} has no chip`).toBeVisible();
      await expect(pill, `${design.name} starts selected`).toHaveAttribute('aria-pressed', 'false');

      // Selecting the design activates it.
      await pill.click();
      await expect(pill, `${design.name} did not become active`).toHaveAttribute('aria-pressed', 'true');

      // The design layer is mounted in the live preview — the same
      // composition the browser export renders.
      const layer = after.locator(`[data-remotion-design-id="${design.id}"]`);
      await expect(layer, `${design.name} rendered no design layer`).toHaveCount(1);
      await expect(layer, `${design.name} rendered an invisible design layer`).toBeVisible();

      // Every design draws its own credit line inside the layer.
      const credit = layer.locator('[data-remotion-design-credit]');
      await expect(credit, `${design.name} drew no credit line`).toHaveCount(1);
      const creditText = await credit.first().innerText();

      evidence.push({ id: design.id, name: design.name, credit: creditText });

      // Clicking the active design again clears it.
      await pill.click();
      await expect(pill, `${design.name} did not clear`).toHaveAttribute('aria-pressed', 'false');
      await expect(
        after.locator(`[data-remotion-design-id="${design.id}"]`),
        `${design.name} stayed in the preview after being cleared`,
      ).toHaveCount(0);
    }

    // eslint-disable-next-line no-console
    console.log(
      'V2: 19-design evidence:',
      JSON.stringify(
        {
          count: evidence.length,
          ids: evidence.map((entry) => entry.id),
          credits: evidence.map((entry) => `${entry.id}: ${entry.credit?.replace(/\s+/g, ' ').trim()}`),
        },
        null,
        2,
      ),
    );

    expect(evidence.length).toBe(EXPECTED_DESIGN_COUNT);
  });

  test('captures the expanded 19-design row', async ({ page }) => {
    const dialog = await openStep4(page);

    const designsLabel = dialog.getByText('Designs', { exact: true });
    await designsLabel.waitFor({ state: 'visible' });
    await designsLabel.scrollIntoViewIfNeeded();

    const chips = await readDesignChips(dialog);
    expect(chips.length).toBe(EXPECTED_DESIGN_COUNT);

    // The Designs group itself (label + every chip), so the evidence is the
    // expanded row and nothing else.
    await designsLabel.locator('xpath=..').screenshot({ path: shot('step4-19-designs.png') });

    // The same moment with the surrounding panel, for context.
    await page.screenshot({ path: shot('step4-19-designs-panel.png') });
  });
});
