/**
 * Server-side OpenAI API key verification.
 *
 * Verification policy (must not be bypassed or weakened):
 *
 *   - 401 Unauthorized
 *       → The credential itself is invalid.
 *       → Caller must reject the save and show "invalid key" to the user.
 *
 *   - 403 Forbidden
 *       → The key may be valid but the project/endpoint/org is restricted.
 *       → Caller MUST NOT classify the key as invalid solely because of 403.
 *       → Save is allowed; a non-destructive warning is returned.
 *
 *   - 429 Too Many Requests
 *       → Rate-limited. Temporary condition.
 *       → Save is allowed; a non-destructive warning is returned.
 *
 *   - 5xx Server Error
 *       → OpenAI provider-side issue.
 *       → Save is allowed; a non-destructive warning is returned.
 *
 *   - Network error / Abort / Timeout
 *       → Connectivity issue.
 *       → Save is allowed; a non-destructive warning is returned.
 *
 * Raw keys are never logged. Only the verification status and any user-facing
 * warning are returned.
 */

export interface VerificationResult {
  /** true when the key is definitively valid (200 from /v1/models). */
  isValid: boolean;
  /** 
   * 'verified'            — 200 OK, key is valid.
   * 'restricted'          — 403, key may be restricted.
   * 'temporarily_unverified' — 429, 5xx, timeout, network error.
   */
  status: 'verified' | 'restricted' | 'temporarily_unverified';
  /** User-facing warning when the key is saved but verification was incomplete. */
  warning: string | null;
  /** User-facing error when the key is definitively invalid (401). */
  error: string | null;
}

const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';
const VERIFY_TIMEOUT_MS = 15_000;

export async function verifyOpenAIKeyServerSide(key: string): Promise<VerificationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_MODELS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      return {
        isValid: false,
        status: 'temporarily_unverified',
        warning: null,
        error: 'OpenAI did not recognize this API key. Re-copy the key from your OpenAI dashboard and try again.',
      };
    }

    if (res.status === 403) {
      return {
        isValid: true,
        status: 'restricted',
        warning: 'Your OpenAI key was saved, but OpenAI restricted the verification request. Check the project\'s API permissions if an OpenAI-powered feature cannot run.',
        error: null,
      };
    }

    if (res.status === 429) {
      return {
        isValid: true,
        status: 'temporarily_unverified',
        warning: 'Your OpenAI key was saved, but OpenAI temporarily rate-limited verification. You can try the feature again shortly.',
        error: null,
      };
    }

    if (res.status >= 500) {
      return {
        isValid: true,
        status: 'temporarily_unverified',
        warning: 'Your OpenAI key was saved, but OpenAI verification is temporarily unavailable.',
        error: null,
      };
    }

    if (!res.ok) {
      return {
        isValid: true,
        status: 'temporarily_unverified',
        warning: 'Your OpenAI key was saved, but OpenAI verification could not be completed.',
        error: null,
      };
    }

    // 200 OK — key is valid.
    return {
      isValid: true,
      status: 'verified',
      warning: null,
      error: null,
    };
  } catch {
    clearTimeout(timeoutId);
    // Network error, timeout, abort, etc.
    return {
      isValid: true,
      status: 'temporarily_unverified',
      warning: 'Your OpenAI key was saved, but OpenAI verification is temporarily unavailable.',
      error: null,
    };
  }
}
