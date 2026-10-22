/**
 * Bridges the Remotion design catalogue into the browser export engine.
 *
 * `webExport.ts` deliberately knows nothing about the design registry: it
 * resolves a design by id through a small, replaceable seam
 * (`registerRemotionDesign` / `registerRemotionDesigns`). This module is the
 * one place that closes that seam, so the export side can resolve every id
 * the wizard offers.
 *
 * The registration is idempotent: calling it more than once is a no-op, so
 * it is safe to call from a module boundary AND right before a render.
 */

import { registerRemotionDesigns } from './webExport'
import { REMOTION_DESIGN_REGISTRY } from './remotion/registry'

let registered = false

/**
 * Registers every design in the catalogue with the browser export engine.
 *
 * The registry's records are structurally assignable to the export engine's
 * design contract, so the catalogue is handed over unchanged.
 */
export function registerPersonalizationRemotionDesigns(): void {
  if (registered) return
  registered = true
  registerRemotionDesigns(REMOTION_DESIGN_REGISTRY)
}
