import { test, expect, type Page } from '@playwright/test'
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { completeOrgTaskIfPresent } from './helpers/clerk'

/**
 * TASK 4 (audio) + TASK 2 support (authenticated personalization verification).
 *
 * Authenticated, real-browser verification of the optional customer audio track
 * in the Simple Mode personalization wizard:
 *   - an unsupported file is rejected with an actionable message,
 *   - the accepted file is previewed (playable) BEFORE it is applied,
 *   - applying it stores a durable reference (never a blob: URL),
 *   - the composed preview carries the selected track.
 *
 * This spec is deliberately scoped to the audio workflow. It runs against its
 * own port (DEMO_BASE_URL, default :3211) so it can never collide with the
 * :3111 server the rest of the suite uses.
 */

const EMAIL = process.env.E2E_CLERK_USER_EMAIL

/** The durable URL the provider's test-mode upload path resolves to. */
const DURABLE_AUDIO_URL = 'https://example.com/test-uploaded-asset.png'

/** A valid 1-second, 8 kHz mono WAV so browsers load its metadata. */
function wavBuffer(): Buffer {
  const sampleRate = 8000
  const samples = sampleRate
  const dataBytes = samples * 2
  const buffer = Buffer.alloc(44 + dataBytes)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataBytes, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // fmt chunk size
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28) // byte rate
  buffer.writeUInt16LE(2, 32) // block align
  buffer.writeUInt16LE(16, 34) // bits per sample
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataBytes, 40)
  return buffer
}

async function openWizard(page: Page): Promise<void> {
  await page.goto('/personalization-demo?test=true')
  const dialog = page.getByRole('dialog', { name: /personalize this demo/i }).first()
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('heading', { name: /find your business/i })).toBeVisible()
}

/** Step 1 → 2 → 3 (Personalize), where the audio control lives. */
async function goToPersonalizeStep(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^continue$/i }).first().click()
  await expect(page.getByRole('heading', { name: /your video is ready/i })).toBeVisible()
  await page.getByRole('button', { name: /^continue$/i }).first().click()
  await expect(page.getByRole('heading', { name: /personalize automatically/i })).toBeVisible()
  await expect(page.locator('#guided-audio-upload')).toBeVisible()
}

test.beforeAll(async () => {
  await clerkSetup()
})

test.describe('Personalization audio track — authenticated', () => {
  // `clerk.signIn` has no timeout of its own and the first navigation on a
  // freshly started dev server compiles the app routes, so give each test room
  // instead of letting the compile race the sign-in.
  test.setTimeout(180_000)
  test.skip(!EMAIL, 'E2E_CLERK_USER_EMAIL is not configured')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clerk.signIn({ page, emailAddress: EMAIL as string })
    await completeOrgTaskIfPresent(page)
    await openWizard(page)
  })

  test('rejects an unsupported audio file with an actionable message', async ({ page }) => {
    await goToPersonalizeStep(page)

    await page.locator('#guided-audio-upload').setInputFiles({
      name: 'voiceover.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('this is not audio'),
    })

    const error = page.getByTestId('audio-error')
    await expect(error).toBeVisible()
    await expect(error).toContainText(/not an audio format/i)
    await expect(error).toContainText(/MP3, M4A, WAV, OGG or AAC/i)

    // Nothing was applied: no preview panel, no applied panel.
    await expect(page.getByTestId('audio-pending')).toHaveCount(0)
    await expect(page.getByTestId('audio-applied')).toHaveCount(0)
  })

  test('previews the selected audio before applying it, then applies a durable reference', async ({
    page,
  }) => {
    await goToPersonalizeStep(page)

    await page.locator('#guided-audio-upload').setInputFiles({
      name: 'jingle.mp3',
      mimeType: 'audio/mpeg',
      buffer: wavBuffer(),
    })

    // ── Preview playback BEFORE applying ───────────────────────────────────
    const pending = page.getByTestId('audio-pending')
    await expect(pending).toBeVisible()
    const preview = page.getByTestId('audio-preview-player')
    await expect(preview).toBeVisible()
    const previewSrc = await preview.getAttribute('src')
    expect(previewSrc).toMatch(/^blob:/)

    // The browser can actually decode it: metadata loads and playback starts.
    await expect
      .poll(async () =>
        preview.evaluate((el: HTMLAudioElement) => el.readyState).catch(() => 0),
      )
      .toBeGreaterThanOrEqual(1)
    await expect
      .poll(async () => preview.evaluate((el: HTMLAudioElement) => el.duration).catch(() => 0))
      .toBeGreaterThan(0)
    await preview.evaluate(async (el: HTMLAudioElement) => {
      try {
        await el.play()
      } catch {
        /* autoplay policy: metadata above is the playback-readiness proof */
      }
    })

    // ── Apply ──────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /use this audio/i }).click()
    await expect(page.getByTestId('audio-pending')).toHaveCount(0)

    const applied = page.getByTestId('audio-applied')
    await expect(applied).toBeVisible()
    await expect(applied).toContainText('jingle.mp3')

    // The applied track resolves to a DURABLE storage reference, never the
    // session-scoped blob: URL the preview used.
    const appliedPlayer = page.getByTestId('audio-applied-player')
    await expect(appliedPlayer).toHaveAttribute('src', DURABLE_AUDIO_URL, { timeout: 20_000 })

    // ── The composed preview uses the selected track ───────────────────────
    // The composition renders the track through `@remotion/media`'s <Audio>, so
    // an <audio> element carrying the durable URL exists in the preview stage.
    await expect
      .poll(
        async () =>
          page
            .locator('audio')
            .evaluateAll((els) =>
              els.map((el) => el.getAttribute('src')).filter((src): src is string => Boolean(src)),
            )
            .then((srcs) => srcs.filter((src) => src === DURABLE_AUDIO_URL).length),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0)

    // ── The persisted preview state holds the durable reference, not a blob ─
    const readPersistedAudio = () =>
      page.evaluate(() => {
        for (const key of Object.keys(localStorage)) {
          if (!key.includes('smartvideo_preview_state_')) continue
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}') as {
              previewSettings?: { audio?: { url?: string; name?: string } | null } | null
            }
            const audio = parsed?.previewSettings?.audio
            if (audio && typeof audio.url === 'string' && audio.url) return audio
          } catch {
            /* unreadable entry: keep looking */
          }
        }
        return null
      })

    let persisted: { url?: string; name?: string } | null = null
    for (let attempt = 0; attempt < 30 && !persisted; attempt += 1) {
      persisted = await readPersistedAudio()
      if (!persisted) await page.waitForTimeout(500)
    }

    expect(persisted).toBeTruthy()
    expect(persisted?.url).toBe(DURABLE_AUDIO_URL)
    expect(persisted?.url).not.toMatch(/^blob:/)
    expect(persisted?.name).toBe('jingle.mp3')

    // ── Removing the track returns to the video's own audio ────────────────
    await page.getByRole('button', { name: /remove/i }).first().click()
    await expect(page.getByTestId('audio-applied')).toHaveCount(0)
  })
})
