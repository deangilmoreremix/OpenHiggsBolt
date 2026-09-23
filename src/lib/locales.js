/**
 * Minimal locale configuration stub.
 *
 * NOTE: The canonical `src/lib/locales` implementation is missing from this
 * worktree, causing `app/layout.js` to fail at module resolution. This stub
 * restores the minimal contract required for the app to render so that
 * VoiceStudio runtime verification can proceed.
 *
 * This is a pre-existing repository defect, not a VoiceStudio integration
 * change. It should be replaced with the real implementation when available.
 */

export function getLocaleConfig(locale) {
  return {
    htmlLang: locale === 'es' ? 'es' : 'en',
  };
}
