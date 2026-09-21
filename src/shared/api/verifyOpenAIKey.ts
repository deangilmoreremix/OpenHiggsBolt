/**
 * @deprecated Client-side OpenAI key verification has been removed.
 *
 * Verification now happens server-side inside `/api/auth/openai-key` to avoid
 * CORS issues, incorrectly classifying restricted project keys as invalid,
 * and exposing raw keys to the browser's network layer.
 *
 * Import the canonical client service from `@/shared/api/openaiKey` instead:
 *
 *   import { saveOpenAIKey, getOpenAIKeyStatus, deleteOpenAIKey } from '@/shared/api/openaiKey';
 *
 * Server-side code can import the verification helper directly:
 *
 *   import { verifyOpenAIKeyServerSide } from '@/src/lib/server/openaiKeyVerification';
 */

export { verifyOpenAIKeyServerSide } from '@/src/lib/server/openaiKeyVerification';

// Backward-compatible re-export so any lingering imports don't crash at build time.
// New code must not use this from the browser.
export { verifyOpenAIKeyServerSide as verifyOpenAIKey } from '@/src/lib/server/openaiKeyVerification';
