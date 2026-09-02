/**
 * Central client-side API-key resolution.
 *
 * Both the MuAPI key and the OpenAI key are entered by the user in the
 * Settings popup and persisted to localStorage. Previously the OpenAI key was
 * read ONLY from a build-time env var (`NEXT_PUBLIC_OPENAI_API_KEY`), which is
 * empty for end users, so OpenAI image generation always failed with an auth
 * error. Centralizing resolution here guarantees every endpoint category
 * (image / video / social / openai) pulls the key from the same user-supplied
 * source, with a safe env-var fallback for server/SSR builds.
 */

export const MUAPI_KEY_STORAGE = 'muapi_key';
export const OPENAI_KEY_STORAGE = 'openai_key';

// Safely read a localStorage value in any environment (SSR / Node tests).
function readStorage(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    /* localStorage may throw in private mode / sandboxed iframes */
  }
  return null;
}

/**
 * Resolve the MuAPI key.
 * Priority: explicit arg > window.__MUAPI_KEY__ > localStorage > env.
 */
export function resolveMuapiKey(explicitKey) {
  if (explicitKey && String(explicitKey).trim()) return String(explicitKey).trim();
  if (typeof window !== 'undefined' && window.__MUAPI_KEY__) return window.__MUAPI_KEY__;
  const stored = readStorage(MUAPI_KEY_STORAGE);
  if (stored && stored.trim()) return stored.trim();
  const env =
    (typeof process !== 'undefined' && process.env && (process.env.MUAPI_API_KEY || process.env.MUAPI_KEY)) ||
    '';
  return env ? String(env).trim() : '';
}

/**
 * Resolve the OpenAI key.
 * Priority: explicit arg > localStorage > build-time env var.
 * NOTE: env fallback is only meaningful for server-side builds; for browser
 * users the key MUST come from localStorage set via the Settings popup.
 */
export function resolveOpenAIKey(explicitKey) {
  if (explicitKey && String(explicitKey).trim()) return String(explicitKey).trim();
  const stored = readStorage(OPENAI_KEY_STORAGE);
  if (stored && stored.trim()) return stored.trim();
  const env =
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_OPENAI_API_KEY) || '';
  return env ? String(env).trim() : '';
}

// Minimal sanity check: keys should be non-empty and not obviously pasted
// with surrounding whitespace/quotes. We deliberately do NOT strip non-Latin1
// bytes here — a valid MuAPI/OpenAI key may legitimately contain any byte, and
// stripping previously truncated real keys.
export function isValidKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 8) return false;
  // Reject if the user pasted the key wrapped in quotes.
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return false;
  }
  return true;
}
