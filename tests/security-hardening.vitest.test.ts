/**
 * Security hardening regression tests (integration branch).
 *
 * Guards the three properties that were ported forward from the
 * `ai-assistant-for-images` hardening work:
 *
 *   1. The `x-personalization-test-auth` middleware bypass is NEVER honored in
 *      production. The real, shipped `middleware.js` guard condition is parsed
 *      out of the source and evaluated — so deleting the `NODE_ENV` gate (or
 *      rewriting it to something inert) makes these tests fail.
 *   2. No code path persists a MuAPI/OpenAI key to a non-HttpOnly cookie
 *      (CWE-522). A `document.cookie` write tripwire plus a static source scan
 *      cover both `src/lib/authConfig.ts` and `src/components/SettingsModal.js`.
 *   3. Rate-limit buckets are keyed by server-derived identity only
 *      (`resolveRateLimitKey`), never by a client-supplied header such as the
 *      rotatable `x-api-key`.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

function detectRepoRoot(): string {
  const meta = import.meta.url;
  if (typeof meta === 'string' && meta.startsWith('file:')) {
    return fileURLToPath(new URL('..', meta));
  }
  return process.cwd();
}

const repoRoot = detectRepoRoot();

function readRepoSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the *actual* condition text of the `if` statement in `middleware.js`
 * that honours the `x-personalization-test-auth` header. The returned string is
 * the shipped source, so this test evaluates the real guard rather than a copy
 * of it.
 */
function extractTestAuthBypassCondition(middlewareSource: string): string {
  const marker = 'x-personalization-test-auth';
  const markerIndex = middlewareSource.indexOf(marker);
  expect(markerIndex).toBeGreaterThan(-1);

  const ifIndex = middlewareSource.lastIndexOf('if (', markerIndex);
  expect(ifIndex).toBeGreaterThan(-1);
  expect(ifIndex).toBeLessThan(markerIndex);

  const openParen = middlewareSource.indexOf('(', ifIndex);
  let depth = 0;
  for (let i = openParen; i < middlewareSource.length; i++) {
    const char = middlewareSource[i];
    if (char === '(') depth++;
    else if (char === ')') {
      depth--;
      if (depth === 0) {
        return middlewareSource.slice(openParen + 1, i);
      }
    }
  }
  throw new Error('Could not find the closing paren of the test-auth bypass guard');
}

function testAuthBypassStatement(middlewareSource: string): string {
  const markerIndex = middlewareSource.indexOf('x-personalization-test-auth');
  const bypass = middlewareSource.indexOf('NextResponse.next()', markerIndex);
  const end = bypass === -1 ? markerIndex + 200 : bypass + 'NextResponse.next()'.length;
  return middlewareSource.slice(markerIndex, end);
}

type FakeRequest = {
  headers: { get: (name: string) => string | null };
  nextUrl: { pathname: string };
};

/**
 * Evaluate the real middleware guard condition with a minimal `request` stub
 * and a stubbed `process` (so `process.env.NODE_ENV` is fully controlled).
 */
function evaluateBypassGuard(
  condition: string,
  env: { NODE_ENV: string },
  request: FakeRequest,
): boolean {
  const evaluate = new Function('request', 'process', `return (${condition});`);
  return Boolean(evaluate(request, { env }));
}

function makeTestAuthRequest(headerValue: string | null, pathname: string): FakeRequest {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'x-personalization-test-auth' ? headerValue : null,
    },
    nextUrl: { pathname },
  };
}

function ipFrom(headers: { get: (name: string) => string | null }): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    undefined
  );
}

// ── 1. Production test-auth bypass ───────────────────────────────────────────

describe('middleware: x-personalization-test-auth bypass', () => {
  const middlewareSource = readRepoSource('middleware.js');
  const condition = extractTestAuthBypassCondition(middlewareSource);
  const discoveryPath = '/api/personalization/discover-assets';

  it('is production-gated in the shipped source', () => {
    // The guard must reference NODE_ENV at all — a header-only condition means
    // the bypass is live in production.
    expect(condition).toContain('NODE_ENV');
    expect(condition).toContain('x-personalization-test-auth');
    // And the guarded block is the early-return bypass, not some other branch.
    expect(testAuthBypassStatement(middlewareSource)).toContain('NextResponse.next()');
  });

  it('is NOT honored when NODE_ENV === production', () => {
    const allowed = evaluateBypassGuard(
      condition,
      { NODE_ENV: 'production' },
      makeTestAuthRequest('allow', discoveryPath),
    );
    expect(allowed).toBe(false);
  });

  it('is NOT honored in production even on the discovery route with both header values', () => {
    for (const headerValue of ['allow', 'ALLOW', '1', 'true']) {
      const allowed = evaluateBypassGuard(
        condition,
        { NODE_ENV: 'production' },
        makeTestAuthRequest(headerValue, discoveryPath),
      );
      expect(allowed).toBe(false);
    }
  });

  it('is NOT honored in production for other routes either', () => {
    for (const pathname of ['/api/personalization/other', '/api/vfx/generate', '/studio']) {
      const allowed = evaluateBypassGuard(
        condition,
        { NODE_ENV: 'production' },
        makeTestAuthRequest('allow', pathname),
      );
      expect(allowed).toBe(false);
    }
  });

  it('is still honored outside production so the test flow keeps working', () => {
    for (const env of ['development', 'test']) {
      const allowed = evaluateBypassGuard(
        condition,
        { NODE_ENV: env },
        makeTestAuthRequest('allow', discoveryPath),
      );
      expect(allowed).toBe(true);
    }
  });

  it('is not honored without the exact header value', () => {
    for (const env of ['development', 'production']) {
      const allowed = evaluateBypassGuard(
        condition,
        { NODE_ENV: env },
        makeTestAuthRequest(null, discoveryPath),
      );
      expect(allowed).toBe(false);
    }
  });
});

// ── 2. No key ever reaches a non-HttpOnly cookie ─────────────────────────────

describe('keys are never persisted to a non-HttpOnly cookie (CWE-522)', () => {
  const authConfigSource = readRepoSource('src/lib/authConfig.ts');
  const settingsModalSource = readRepoSource('src/components/SettingsModal.js');

  it('authConfig exposes no cookie-writing helper', () => {
    expect(authConfigSource).not.toContain('document.cookie');
    expect(authConfigSource).not.toContain('buildCookie');
    expect(authConfigSource).not.toContain('setCookie');
    expect(authConfigSource).not.toContain('getCookie');
    expect(authConfigSource).toContain('NEVER written to a cookie');
  });

  it('SettingsModal writes no cookie', () => {
    expect(settingsModalSource).not.toContain('document.cookie');
    expect(settingsModalSource).not.toContain('buildCookie');
    expect(settingsModalSource).toContain('intentionally NOT written to cookies');
  });

  it('authConfig setters write localStorage only', async () => {
    const cookieWrites: string[] = [];
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(Document.prototype, 'cookie', {
      configurable: true,
      get(): string {
        return '';
      },
      set(value: string) {
        cookieWrites.push(String(value));
      },
    });

    try {
      vi.resetModules();
      const authConfig = await import('../src/lib/authConfig');      authConfig.setApiKey('muapi-hardening-key');
      authConfig.setOpenAiKey('sk-openai-hardening-key');

      expect(authConfig.getApiKey()).toBe('muapi-hardening-key');
      expect(authConfig.getOpenAiKey()).toBe('sk-openai-hardening-key');
      // localStorage (not a cookie) is the only persistence channel.
      expect(window.localStorage.getItem('muapi_key')).toBe('muapi-hardening-key');
      expect(window.localStorage.getItem('openai_key')).toBe('sk-openai-hardening-key');
      expect(cookieWrites).toEqual([]);
      expect(document.cookie).toBe('');

      authConfig.clearAllKeys();
      expect(cookieWrites).toEqual([]);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Document.prototype, 'cookie', originalDescriptor);
      }
    }
  });

  it('SettingsModal save flow writes no cookie', async () => {
    const cookieWrites: string[] = [];
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(Document.prototype, 'cookie', {
      configurable: true,
      get(): string {
        return '';
      },
      set(value: string) {
        cookieWrites.push(String(value));
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      })),
    );

    try {
      vi.resetModules();
      const { SettingsModal } = await import('../src/components/SettingsModal.js');
      const overlay = SettingsModal();
      document.body.appendChild(overlay);

      const muapiInput = document.body.querySelector<HTMLInputElement>('#settings-api-key');
      const openaiInput = document.body.querySelector<HTMLInputElement>('#settings-openai-key');
      expect(muapiInput).toBeTruthy();
      expect(openaiInput).toBeTruthy();
      muapiInput!.value = 'muapi-settings-key';
      openaiInput!.value = 'sk-settings-key';
      const save = document.body.querySelector<HTMLButtonElement>('#settings-save-btn');
      expect(save).toBeTruthy();
      await (save!.onclick as unknown as () => Promise<void>)();

      expect(window.localStorage.getItem('muapi_key')).toBe('muapi-settings-key');
      expect(window.localStorage.getItem('openai_key')).toBe('sk-settings-key');
      expect(cookieWrites).toEqual([]);
      expect(document.cookie).toBe('');
    } finally {
      vi.unstubAllGlobals();
      if (originalDescriptor) {
        Object.defineProperty(Document.prototype, 'cookie', originalDescriptor);
      }
      document.body.innerHTML = '';
    }
  });
});

// ── 3. Rate-limit keys are server-derived ────────────────────────────────────

describe('resolveRateLimitKey', () => {
  let resolveRateLimitKey: (userId?: string | null, clientIp?: string | null) => string;

  beforeEach(async () => {
    const mod = await import('../lib/rateLimit');
    resolveRateLimitKey = mod.resolveRateLimitKey;
  });

  it('prefers the authenticated Clerk userId', () => {
    expect(resolveRateLimitKey('user_123', '203.0.113.9')).toBe('user_123');
  });

  it('falls back to the client IP when there is no userId', () => {
    expect(resolveRateLimitKey(null, '203.0.113.9')).toBe('203.0.113.9');
    expect(resolveRateLimitKey('', '203.0.113.9')).toBe('203.0.113.9');
  });

  it('falls back to an anonymous bucket when neither is known', () => {
    expect(resolveRateLimitKey(null, null)).toBe('anon');
    expect(resolveRateLimitKey(undefined, undefined)).toBe('anon');
    expect(resolveRateLimitKey('', '')).toBe('anon');
  });

  it('cannot be keyed on a client-supplied x-api-key', () => {
    // Only server-derived identity participates in the key: no request header
    // can be fed to the resolver, and the helper itself reads no headers.
    expect(resolveRateLimitKey.length).toBe(2);

    const rateLimitSource = readRepoSource('lib/rateLimit.ts');
    expect(rateLimitSource).toContain('resolveRateLimitKey');
    expect(/req\s*\.?\s*headers|headers\s*\.\s*get\s*\(/.test(rateLimitSource)).toBe(false);
    expect(rateLimitSource).not.toContain('x-api-key ===');
  });

  it('gives one caller the same bucket regardless of rotated client headers', async () => {
    // Mirrors the call-site idiom: `resolveRateLimitKey(userId, clientIp)` where
    // clientIp comes from x-forwarded-for. The attacker's x-api-key is never
    // part of the key, so rotating it cannot mint a fresh bucket.
    const attackerHeaders = {
      get: (name: string) => {
        const lower = name.toLowerCase();
        if (lower === 'x-forwarded-for') return '198.51.100.7, 10.0.0.1';
        if (lower === 'x-api-key') return 'attacker-rotating-key';
        return null;
      },
    };
    const victimHeaders = {
      get: (name: string) => (name.toLowerCase() === 'x-forwarded-for' ? '203.0.113.4' : null),
    };

    const key = (headers: { get: (n: string) => string | null }, userId: string | null) =>
      resolveRateLimitKey(userId, ipFrom(headers));

    // Same authenticated user => one shared bucket, no matter the client IP.
    expect(key(attackerHeaders, 'user_victim')).toBe('user_victim');
    expect(key(victimHeaders, 'user_victim')).toBe('user_victim');
    // Anonymous traffic from different IPs gets distinct buckets.
    expect(key(attackerHeaders, null)).toBe('198.51.100.7');
    expect(key(victimHeaders, null)).toBe('203.0.113.4');
  });
});

// ── 4. Rate limiting still applies ───────────────────────────────────────────

describe('rateLimit still enforces its window after the hardening', () => {
  it('blocks the (max + 1)th request on a key', async () => {
    const { rateLimit, rateLimit429 } = await import('../lib/rateLimit');
    const key = `hardening-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(key, { windowMs: 60_000, max: 10 }).allowed).toBe(true);
    }
    const blocked = rateLimit(key, { windowMs: 60_000, max: 10 });
    expect(blocked.allowed).toBe(false);

    const response = rateLimit429(blocked.retryAfterMs);
    expect(response.status).toBe(429);
  });

  it('keeps distinct callers in distinct buckets', async () => {
    const { rateLimit } = await import('../lib/rateLimit');
    const unique = `hardening-independent-${Date.now()}`;
    for (let i = 0; i < 10; i++) rateLimit(unique, { windowMs: 60_000, max: 10 });
    expect(rateLimit(unique, { windowMs: 60_000, max: 10 }).allowed).toBe(false);
    expect(rateLimit(`${unique}-other`, { windowMs: 60_000, max: 10 }).allowed).toBe(true);
  });
});

// ── 5. Sanity: the modules we scanned are the ones on disk ──────────────────

describe('harness sanity', () => {
  it('reads the real files from the repo root', () => {
    expect(repoRoot).toBeTruthy();
    expect(readRepoSource('middleware.js')).toContain('clerkMiddleware');
  });
});
