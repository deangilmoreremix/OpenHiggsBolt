export interface WithRetryOptions {
  retries?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {}
): Promise<T> {
  const { retries = 3, baseDelayMs = 1000, signal } = options;

  if (signal?.aborted) {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    throw err;
  }

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      if (attempt === retries) break;

      const status = (err as any)?.response?.status;
      if (status >= 400 && status < 500) {
        throw err;
      }

      if (signal?.aborted) {
        const abortErr = new Error('Aborted');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}