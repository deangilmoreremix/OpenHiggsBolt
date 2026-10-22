/**
 * Remotion design catalogue for the personalization preview.
 *
 * Public surface of `src/shared/personalization/remotion/`:
 *  - `registry.ts` — the typed design catalogue and its lookup helpers.
 *  - `designs/` — the adapted components themselves.
 *  - `designTokens.ts` — the shared font stack and colour helpers the
 *    adapted designs use.
 *
 * Nothing in this folder depends on the personalization wizard's layout
 * model, so the catalogue can be consumed by the preview player, the export
 * pipeline or any other caller.
 */

export * from './designTokens'
export * from './registry'
export * from './designs/bounce-in-headline'
export * from './designs/logo-mask-wipe'
export * from './designs/lower-third-glass-card'
export * from './designs/social-reel'
export * from './designs/particle-explosion'
