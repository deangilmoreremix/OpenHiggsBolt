// Lightweight client-side verification for a user-supplied OpenAI key.
//
// We do NOT send the key anywhere except directly to OpenAI over HTTPS. A 200
// from /v1/models means the key is valid; a 401 means invalid/unauthorized.
// Any other error is surfaced generically so the user can retry. This mirrors
// the MuAPI verification used for the MuAPI key (getUserBalance).

export async function verifyOpenAIKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) throw new Error('missing');

  const res = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${trimmed}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('unauthorized');
  }
  if (!res.ok) {
    // OpenAI returns 429 (rate limit) or 5xx for transient issues. Treat as
    // a connectivity problem rather than "invalid key" so the user retries.
    throw new Error(res.status === 429 ? 'rate_limited' : 'error');
  }
}
