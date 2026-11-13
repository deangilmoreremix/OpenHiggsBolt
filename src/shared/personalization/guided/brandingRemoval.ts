/**
 * "Remove branding with AI": erase logos, watermarks and captions that are already baked into a video.
 *
 * THIS COSTS MONEY. It runs a paid MuAPI job, so nothing here ever starts one on its own: the UI asks for an
 * explicit confirmation that shows the cost first. The network calls are injected (`RemovalDeps`) so the
 * logic is unit-tested without ever submitting a job.
 */

/** The MuAPI video-to-video model that removes watermarks, logos, captions and overlaid text. */
export const REMOVE_BRANDING_MODEL = 'video-watermark-remover'

/**
 * Credits one removal costs, shown on the button and in the confirmation. `null` = not set: the dialog then shows
 * MuAPI's own live cost estimate instead and never invents a number. Set this to the real per-video price.
 */
export const REMOVE_BRANDING_CREDITS: number | null = null

export interface CostEstimate { cost: number; currency: string }

export interface RemovalDeps {
  processV2V: (apiKey: string, params: { model: string; video_url: string; onRequestId?: (id: string) => void }) => Promise<{ url?: string | null } | null | undefined>
  estimateV2VCost: (params: { model: string; video_url: string }, signal?: AbortSignal) => Promise<CostEstimate>
  getUserBalance: (apiKey: string) => Promise<{ balance?: unknown } | null | undefined>
}

export interface Quote {
  /** MuAPI's own estimate for this video, when it could be fetched. */
  estimate: CostEstimate | null
  /** The account balance, when it could be fetched. */
  balance: number | null
}

const finiteNumber = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** What the confirmation shows. Each part is best effort: a missing estimate or balance never blocks the dialog. */
export async function loadQuote(deps: RemovalDeps, input: { apiKey: string; videoUrl: string; signal?: AbortSignal }): Promise<Quote> {
  const [estimate, balance] = await Promise.all([
    deps.estimateV2VCost({ model: REMOVE_BRANDING_MODEL, video_url: input.videoUrl }, input.signal).catch(() => null),
    deps.getUserBalance(input.apiKey).then((b) => finiteNumber(b?.balance)).catch(() => null),
  ])
  return { estimate, balance }
}

export interface Affordability { ok: boolean; message: string | null }

/**
 * Whether to let the person start. The account balance is in MuAPI credits and the live estimate is in a currency,
 * so they are never compared with each other. We only block when the balance is known to be too low:
 *  - a price in credits is configured and the balance is below it, or
 *  - no price is configured and the balance is zero or negative.
 * An unknown balance never blocks (the provider rejects an unfunded job itself).
 */
export function affordability(balance: number | null, credits: number | null = REMOVE_BRANDING_CREDITS): Affordability {
  if (balance == null) return { ok: true, message: null }
  if (credits != null && balance < credits) return { ok: false, message: `This needs ${credits} credits and your balance is ${balance}. Add credits to continue.` }
  if (credits == null && balance <= 0) return { ok: false, message: 'Your credit balance is empty. Add credits to continue.' }
  return { ok: true, message: null }
}

/** "5 credits", "about 0.12 USD", or "uses credits" when nothing is known. */
export function describeCost(quote: Quote | null, credits: number | null = REMOVE_BRANDING_CREDITS): string {
  if (credits != null) return `${credits} credit${credits === 1 ? '' : 's'}`
  if (quote?.estimate) return `about ${quote.estimate.cost.toFixed(2)} ${quote.estimate.currency}`
  return 'uses credits'
}

/** Runs the paid job. Resolves with the cleaned video's URL; throws (and so spends nothing more) on any failure. */
export async function removeBranding(
  deps: RemovalDeps,
  input: { apiKey: string; videoUrl: string; onRequestId?: (id: string) => void },
): Promise<{ url: string }> {
  if (!input.apiKey.trim()) throw new Error('Sign in to remove branding.')
  if (!input.videoUrl.trim()) throw new Error('There is no video to clean.')
  const result = await deps.processV2V(input.apiKey, { model: REMOVE_BRANDING_MODEL, video_url: input.videoUrl, onRequestId: input.onRequestId })
  const url = typeof result?.url === 'string' ? result.url.trim() : ''
  if (!url) throw new Error('The service finished without returning a video. Your original video is unchanged.')
  return { url }
}

/** The real MuAPI calls, loaded on demand so the editor does not carry the studio package until it is needed. */
export async function loadDefaultDeps(): Promise<RemovalDeps> {
  const m = await import('@/packages/studio/src/muapi')
  return { processV2V: m.processV2V, estimateV2VCost: m.estimateV2VCost, getUserBalance: m.getUserBalance } as RemovalDeps
}
