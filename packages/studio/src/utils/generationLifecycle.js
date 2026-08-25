export async function pollForGenerationResult({ baseUrl, requestId, apiKey, maxAttempts = 60, interval = 2000, onAuthRequired }) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/result/${requestId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.status === 401 || res.status === 403) {
        onAuthRequired?.(res.status, await res.text());
        return null;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'succeeded' || data.status === 'completed') return data;
        if (data.status === 'failed') return null;
      }
    } catch {
      // network error, retry
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return null;
}
