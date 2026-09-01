/**
 * Backward-compatible re-exports from the centralized auth config.
 *
 * New code should import directly from `@/lib/authConfig`.
 * This file remains for existing consumers that have not yet migrated.
 */

export { MUAPI_KEY_STORAGE, OPENAI_KEY_STORAGE } from './authConfig';
export { getApiKey as resolveMuapiKey } from './authConfig';
export { getOpenAiKey as resolveOpenAIKey } from './authConfig';
export { isValidKeyFormat } from './authConfig';
