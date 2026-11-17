import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Burned-in captions, real browser (runbook "Test I"): load a caption file, change look and place, edit lines, then run
 * the product's own in-browser export and keep the MP4 so a frame can be inspected.
 *
 * Browser-only: no AI, no MuAPI, no network beyond the dev server. Output: `CAPTIONS_OUT_DIR`
 * (default test-results/captions).
 */
const OUT = process.env.CAPTIONS_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'captions')
const SRT = [
  '1', '00:00:00,300 --> 00:00:01,900', 'Call us today', '',
  '2', '00:00:02,000 --> 00:00:03,800', 'for a free quote', '',
].join('\n')

async function makeDataUrl(page: Page, w: number, h: number, bg: string, label: string): Promise<string> {
  return page.evaluate(
    ([w, h, bg, label]) => {
      const c = document.createElement('canvas')
      c.width = w as number; c.height = h as number
      const g = c.getContext('2d')!
      g.fillStyle = bg as string; g.fillRect(0, 0, c.width, c.height)
      g.fillStyle = '#fff'; g.font = `bold ${Math.round((h as number) / 6)}px sans-serif`
      g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText(label as string, c.width / 2, c.height / 2)
      return c.toDataURL('image/png')
    },
    [w, h, bg, label],
  )
}

async function seedBrand(page: Page) {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL)
    const blobs: Blob[] = []
    ;(window as unknown as { __a1Blobs: Blob[] }).__a1Blobs = blobs
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      try { if (obj instanceof Blob) blobs.push(obj) } catch { /* ignore */ }
      return original(obj)
    }
  })
  await page.goto('/personalization-demo?test=true', { timeout: 120_000 })
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click()
  await dialog.getByRole('button', { name: 'My Business' }).click()
  await dialog.getByRole('button', { name: /Next: Profile/ }).click()
  await page.fill('input[placeholder="ABC Roofing"]', 'Summit Exteriors')
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click()
  const logo = await makeDataUrl(page, 600, 200, '#12355b', 'SUMMIT')
  const product = await makeDataUrl(page, 800, 800, '#a33b6b', 'PRODUCT')
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' })
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(logo)
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click')
  const prodCard = page.locator('article.asset-card').filter({ hasText: /3\. PRODUCTS/i }).first()
  await prodCard.locator('input[placeholder*="Paste"]').first().fill(product)
  await page.locator('button:has-text("Add Image/Video URL")').first().dispatchEvent('click')
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: /Simple Mode/i }).click()
}

test('captions: load a file, change looks, edit lines, export and burn them in', async ({ page }) => {
  test.setTimeout(420_000)
  fs.mkdirSync(OUT, { recursive: true })
  const problems: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 200)}`) })
  page.on('pageerror', (e) => problems.push(`pageerror: ${String(e).slice(0, 200)}`))
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url().slice(0, 120)} ${r.failure()?.errorText}`))

  await seedBrand(page)
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /Step 4/i }).click()
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible()
  await page.waitForTimeout(2500)
  await dialog.screenshot({ path: path.join(OUT, '01-step4.png') })

  // The Captions panel appears once the preview is approved.
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 })
  const panel = page.getByTestId('captions-panel')
  await expect(panel).toBeVisible({ timeout: 30_000 })

  // 1) Load a caption file.
  await page.getByTestId('captions-file').setInputFiles({ name: 'quote.srt', mimeType: 'application/x-subrip', buffer: Buffer.from(SRT) })
  await expect(page.getByTestId('captions-note')).toContainText('Loaded 2 lines')
  await expect(page.getByTestId('captions-edit-0')).toHaveValue('Call us today')
  await panel.scrollIntoViewIfNeeded()
  await panel.screenshot({ path: path.join(OUT, '02-panel-loaded.png') })

  // 3) Looks and place.
  for (const look of ['bold', 'bar', 'clean']) {
    await page.getByTestId(`captions-style-${look}`).click()
    await expect(page.getByTestId(`captions-style-${look}`)).toHaveAttribute('aria-pressed', 'true')
  }
  const select = page.getByTestId('captions-capite-select')
  await expect(select.locator('option:not([value=""])')).toHaveCount(27)
  for (const id of ['hormozi', 'crimson-pop', 'karaoke']) {
    await select.selectOption(id)
    await expect(page.getByTestId('captions-capite-hint')).toBeVisible()
  }
  await page.getByTestId('captions-position-middle').click()
  await page.getByTestId('captions-position-bottom').click()
  await select.selectOption('hormozi') // the look kept for the export

  // 4) Edit, add, delete a line; a wrong file is refused and keeps what is there.
  await page.getByTestId('captions-edit-1').fill('for a FREE quote')
  await page.getByTestId('captions-edit-1').blur()
  await page.getByTestId('captions-add-line').click()
  await expect(page.getByTestId('captions-edit-2')).toBeVisible()
  await page.getByTestId('captions-edit-2').fill('')
  await page.getByTestId('captions-edit-2').blur()
  await expect(page.getByTestId('captions-edit-2')).toHaveCount(0)
  await page.getByTestId('captions-import').click() // asks before replacing
  await expect(page.getByTestId('captions-redo-confirm')).toBeVisible()
  await page.getByTestId('captions-redo-no').click()
  await page.getByTestId('captions-file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not captions') })
  await expect(page.getByTestId('captions-note')).toContainText('No captions were found')
  await expect(page.getByTestId('captions-edit-1')).toHaveValue('for a FREE quote')

  // 5) Downloads.
  const [srt] = await Promise.all([page.waitForEvent('download'), page.getByTestId('captions-srt').click()])
  expect(srt.suggestedFilename()).toBe('captions.srt')
  fs.writeFileSync(path.join(OUT, 'downloaded.srt'), fs.readFileSync(await srt.path()))
  const [vtt] = await Promise.all([page.waitForEvent('download'), page.getByTestId('captions-vtt').click()])
  expect(vtt.suggestedFilename()).toBe('captions.vtt')
  await panel.screenshot({ path: path.join(OUT, '04-panel-edited.png') })

  // 6) The real in-browser export, kept so a frame can be inspected.
  // Caption changes clear the approval (the render uses exactly what was approved), so approve the final result again.
  await expect(page.getByTestId('guided-approval-stale')).toBeVisible()
  await dialog.getByRole('button', { name: /Approve this personalization/i }).click({ timeout: 30_000 })
  const rights = page.getByTestId('guided-rights-confirm').locator('input')
  if (await rights.count()) await rights.check()
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 })
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 300_000, intervals: [500, 1000] })
    .toBeGreaterThan(0)
  const base64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) => /^video\//.test(b.type))
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)))
    return btoa(binary)
  })
  const file = path.join(OUT, 'captioned.mp4')
  fs.writeFileSync(file, Buffer.from(base64, 'base64'))
  expect(fs.statSync(file).size).toBeGreaterThan(10_000)
  fs.writeFileSync(path.join(OUT, 'problems.txt'), problems.join('\n'))
})
