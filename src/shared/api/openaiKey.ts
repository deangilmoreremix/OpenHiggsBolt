/**
 * Canonical client-side OpenAI key service.
 *
 * Every UI path (Settings modal, first-login modal, standalone settings)
 * must use these functions instead of duplicating fetch logic, validation,
 * or error mapping.
 *
 * Raw keys are never logged. The server never returns the full key in GET
 * responses; only a masked preview and metadata are exposed to the browser.
 */

const OPENAI_KEY_API = '/api/auth/openai-key';

export interface OpenAIKeyStatus {
  configured: boolean;
  masked: string | null;
  updatedAt: string | null;
}

export interface SaveOpenAIKeyResult {
  ok: boolean;
  configured: boolean;
  verification: 'verified' | 'restricted' | 'temporarily_unverified';
  warning: string | null;
}

/**
 * Fetch the current OpenAI key status (masked) for the authenticated user.
 */
export async function getOpenAIKeyStatus(): Promise<OpenAIKeyStatus> {
  const res = await fetch(OPENAI_KEY_API, { method: 'GET', credentials: 'same-origin' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to load OpenAI key status.');
  }
  return res.json();
}

/**
 * Save a new OpenAI key for the authenticated user.
 *
 * The key is sent to the server over HTTPS. The server validates the format,
 * optionally verifies it against OpenAI, encrypts it, and persists it.
 *
 * @throws {Error} If the request fails or the key is definitively invalid (401).
 */
export async function saveOpenAIKey(key: string): Promise<SaveOpenAIKeyResult> {
  const trimmed = (key || '').trim();
  if (!trimmed) {
    throw new Error('OpenAI key is empty.');
  }

  const res = await fetch(OPENAI_KEY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ openaiKey: trimmed }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'We couldn\'t securely save your OpenAI key. Please try again.');
  }

  return data as SaveOpenAIKeyResult;
}

/**
 * Delete the stored OpenAI key for the authenticated user.
 *
 * @throws {Error} If the request fails.
 */
export async function deleteOpenAIKey(): Promise<{ ok: boolean }> {
  const res = await fetch(OPENAI_KEY_API, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'We couldn\'t remove your OpenAI key. Please try again.');
  }

  return data as { ok: boolean };
}
