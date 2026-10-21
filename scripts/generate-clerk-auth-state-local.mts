#!/usr/bin/env -S npx tsx
/**
 * scripts/generate-clerk-auth-state-local.mts
 *
 * Generates a REAL Clerk authentication state (a Playwright `storageState`) for
 * the LOCAL dev server origin (http://localhost:3111) so the local E2E suites
 * can exercise the Clerk-gated asset-discovery route:
 *
 *   POST /api/personalization/discover-assets
 *   GET  /api/personalization/discover-assets/status?jobId=...
 *
 * Why this exists
 * ---------------
 * `app/api/personalization/discover-assets/route.ts` calls Clerk's `auth()`
 * ITSELF (route.ts:115) and answers 401 {"error":"UNAUTHENTICATED"} when there
 * is no session. The middleware's `__e2e_auth_bypass` cookie and
 * `/api/dev-login` only bypass the MIDDLEWARE, so a local asset-discovery run
 * still 401s. This script produces a genuine Clerk session cookie instead --
 * no auth check is weakened or bypassed anywhere.
 *
 * Mechanism (dev instance: pk_test_/sk_test_, touched-stud-74.clerk.accounts.dev)
 * ----------------------------------------------------------------------------
 * 1. `@clerk/testing`'s `clerkSetup()` fetches a testing token from the Clerk
 *    Backend API (`POST /v1/testing_tokens`). That works on a DEVELOPMENT
 *    instance (the token is minted automatically), which is why this path is
 *    unavailable on the production instance.
 * 2. The Clerk Backend API resolves the demo user by email and mints a one-shot
 *    sign-in ticket (`POST /v1/sign_in_tokens`).
 * 3. A REAL Chromium page loads the local app and exchanges the ticket for a
 *    session through clerk-js (`Clerk.client.signIn.create({strategy:'ticket'})`
 *    + `Clerk.setActive`). clerk-js then writes the genuine Clerk cookies
 *    exactly as a human browser would, and it mints the session token with the
 *    `azp` claim for the local origin (`http://localhost:3111`), which Clerk's
 *    server-side `authenticateRequest` requires.
 * 4. The captured cookies are written to a Playwright storage state.
 *
 * Cookies a Clerk DEVELOPMENT instance needs (see @clerk/backend
 * `authenticateRequestWithTokenInCookie`):
 *   - `__session`        the Clerk session JWT (httpOnly, path "/")
 *   - `__clerk_db_jwt`   the dev-browser JWT -- without it the reason is
 *                        `dev-browser-missing`
 *   - `__client_uat`     the client last-active timestamp in SECONDS, and it
 *                        must be <= the session token's `iat` -- without it the
 *                        reason is `session-token-but-no-client-uat`
 *   - `__client`         the client JWT on the Frontend API domain; the browser
 *                        sends it to the FAPI so the session can be refreshed
 *
 * Usage
 * -----
 *   npx tsx scripts/generate-clerk-auth-state-local.mts
 *   npx tsx scripts/generate-clerk-auth-state-local.mts --verify-only
 *   npx tsx scripts/generate-clerk-auth-state-local.mts --cookie-ttl-days 14
 *
 * Outputs (all under playwright/.clerk/, which is gitignored):
 *   smartvideo-demo-http_localhost_3111.json   -> the storage state
 *   ACCOUNTS.local.json                        -> metadata (no secrets)
 *
 * Secrets (Clerk keys) are only read from the gitignored `.env.local` (or the
 * process environment) and are never printed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';

const CLERK_BACKEND_API = 'https://api.clerk.com/v1';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function argValue(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

const BASE_URL = argValue('--base-url', 'http://localhost:3111');
const COOKIE_TTL_DAYS = Number(argValue('--cookie-ttl-days', '7'));
const VERIFY_ONLY = hasFlag('--verify-only');
const CLERK_DIR = path.resolve(process.cwd(), 'playwright/.clerk');

// ---------------------------------------------------------------------------
// Env (never printed)
// ---------------------------------------------------------------------------

function parseEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Real process env wins over `.env.local`. The file is read-only here: this
 * script never writes to it.
 */
function loadEnv(): void {
  const merged = parseEnvFile(path.resolve(process.cwd(), '.env.local'));
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const SECRET_KEY = process.env.CLERK_SECRET_KEY || '';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

function frontendApiFromPublishableKey(publishableKey: string): string {
  const payload = publishableKey.replace(/^pk_(test|live)_/, '');
  return Buffer.from(payload, 'base64').toString('utf8').replace(/\$$/, '');
}

/**
 * Refuses to run against anything but a development instance. The session
 * cookie must be minted by the same Clerk instance that serves the target app.
 */
function requireDevKeys(): string {
  if (!SECRET_KEY || !PUBLISHABLE_KEY) {
    throw new Error(
      'Missing CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Expected them in .env.local.',
    );
  }
  if (!PUBLISHABLE_KEY.startsWith('pk_test_') || !SECRET_KEY.startsWith('sk_test_')) {
    throw new Error(
      'Refusing to run: the configured Clerk keys are not a development (test) instance. ' +
        'The session cookie must be minted by the same instance that serves the local app.',
    );
  }
  return frontendApiFromPublishableKey(PUBLISHABLE_KEY);
}

function resolveEmail(): string {
  const explicit = argValue('--email', '');
  if (explicit) return explicit;
  const fromEnv = process.env.E2E_CLERK_USER_EMAIL;
  if (fromEnv) return fromEnv;
  return 'smartvideo-demo+clerk_test@videoremix.vip';
}

// ---------------------------------------------------------------------------
// Clerk Backend API (user lookup / creation)
// ---------------------------------------------------------------------------

async function clerkApi<T = any>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${CLERK_BACKEND_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* keep raw text */
  }
  if (!res.ok) {
    const message =
      data && data.errors && data.errors[0]
        ? `${data.errors[0].message} (${data.errors[0].code})`
        : String(text).slice(0, 300);
    throw new Error(`Clerk Backend API ${method} ${endpoint} failed: ${res.status} ${message}`);
  }
  return data as T;
}

/**
 * Makes sure the demo user exists on the dev instance so the ticket sign-in
 * has something to sign into. Re-runs are idempotent.
 */
async function ensureUser(email: string): Promise<{ id: string; created: boolean }> {
  const existing = await clerkApi<any[]>(
    'GET',
    `/users?email_address=${encodeURIComponent(email)}&limit=10`,
  );
  const user = (existing || []).find((candidate: any) =>
    (candidate.email_addresses || []).some(
      (entry: any) =>
        String(entry.email_address || '').toLowerCase() === email.toLowerCase(),
    ),
  );
  if (user) return { id: user.id, created: false };

  const created = await clerkApi<any>('POST', '/users', {
    email_address: [email],
    password: `Sv9!goE2e-${Buffer.from(email).toString('base64url').slice(0, 16)}`,
    skip_password_checks: true,
    first_name: 'SmartVideo',
    last_name: 'Demo',
  });
  return { id: created.id, created: true };
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function decodeJwtClaims(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Real browser sign-in (ticket -> session -> genuine Clerk cookies)
// ---------------------------------------------------------------------------

interface BrowserSignInResult {
  cookies: any[];
  sessionId: string | null;
  userId: string | null;
  email: string | null;
  sessionClaims: Record<string, any> | null;
}

async function signInWithBrowser(
  browser: Browser,
  baseUrl: string,
  email: string,
): Promise<BrowserSignInResult> {
  const context: BrowserContext = await browser.newContext();
  try {
    // Registers the FAPI route interception that carries the testing token and
    // disables bot protection for this context only.
    await setupClerkTestingToken({ context });

    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await page.waitForFunction(() => Boolean((window as any).Clerk?.loaded), null, {
      timeout: 180_000,
    });

    // @clerk/testing resolves the user through the Backend API, mints a
    // sign-in ticket and exchanges it inside the page via clerk-js.
    await clerk.signIn({ page, emailAddress: email });

    await page.waitForFunction(() => Boolean((window as any).Clerk?.user?.id), null, {
      timeout: 60_000,
    });

    // Ask clerk-js for a token: it refreshes the cached one when it is stale
    // and rewrites the session cookie as a side effect.
    await page
      .evaluate(async () => {
        const clerk = (window as any).Clerk;
        if (clerk?.session?.getToken) await clerk.session.getToken();
      })
      .catch(() => undefined);

    const identity = await page.evaluate(() => ({
      sessionId: (window as any).Clerk?.session?.id || null,
      userId: (window as any).Clerk?.user?.id || null,
      email: (window as any).Clerk?.user?.primaryEmailAddress?.emailAddress || null,
    }));

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name.startsWith('__session'));
    const sessionClaims = decodeJwtClaims(sessionCookie?.value || '');

    return {
      cookies,
      sessionId: identity.sessionId,
      userId: identity.userId,
      email: identity.email,
      sessionClaims,
    };
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Storage state normalisation
// ---------------------------------------------------------------------------

interface StorageCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

/**
 * Keeps only the Clerk auth cookies and pins the attributes the local origin
 * needs.
 *
 *   - `__session` / `__session_<suffix>`: host `localhost`, path "/",
 *     httpOnly, SameSite=Lax, NOT secure (the origin is plain http)
 *   - `__client_uat` / `__client_uat_<suffix>`: host `localhost`, readable by
 *     clerk-js
 *   - `__clerk_db_jwt` / `__clerk_db_jwt_<suffix>`: host `localhost`, the
 *     dev-browser JWT, readable by clerk-js
 *   - `__client`: kept on its original Frontend API domain so the browser
 *     sends it to the FAPI and the session can be refreshed
 *
 * The SUFFIXED variants matter: @clerk/backend decides whether to read the
 * suffixed or the unsuffixed cookie from the *live* cookie values
 * (`usesSuffixedCookies()`), and on this instance that decision resolves to
 * "suffixed". Dropping the suffixed copies therefore breaks the auth with
 * `dev-browser-missing` / `session-token-but-no-client-uat`.
 */
function buildStorageState(
  cookies: any[],
  targetHost: string,
  ttlDays: number,
): { cookies: StorageCookie[]; origins: any[] } {
  const expires = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;

  const kept: StorageCookie[] = [];

  for (const raw of cookies) {
    const name: string = raw.name;
    const isSession = name.startsWith('__session');
    const isClientUat = name.startsWith('__client_uat');
    const isClient = name === '__client';
    const isDevBrowser = name.startsWith('__clerk_db_jwt');

    if (!isSession && !isClientUat && !isClient && !isDevBrowser) continue;

    // Cookies that belong to the app origin are pinned to it. `__client`
    // lives on the Frontend API domain and must stay there.
    const rawDomain = String(raw.domain || '').replace(/^\./, '');
    const onTarget = rawDomain === targetHost || rawDomain.endsWith(`.${targetHost}`);
    const domain = isClient ? raw.domain : onTarget ? targetHost : raw.domain;
    const isAppCookie = domain === targetHost;

    const cookie: StorageCookie = {
      name,
      value: raw.value,
      domain,
      path: raw.path || '/',
      expires,
      // The session token is read by the server only, so it is httpOnly.
      // `__clerk_db_jwt` and `__client_uat` are read by clerk-js through
      // document.cookie and MUST stay script-readable, otherwise clerk-js
      // cannot identify the dev browser and cannot refresh the session.
      httpOnly: isSession ? true : raw.httpOnly === true,
      secure: isAppCookie ? false : raw.secure === true,
      sameSite: 'Lax',
    };

    kept.push(cookie);
  }

  const names = kept.map((c) => c.name);
  if (!names.some((n) => n.startsWith('__session'))) {
    throw new Error('No __session cookie was captured from the browser sign-in.');
  }
  if (!names.some((n) => n.startsWith('__clerk_db_jwt'))) {
    throw new Error(
      'No __clerk_db_jwt (dev-browser JWT) cookie was captured. ' +
        'A Clerk development instance rejects cookie-based auth without it (dev-browser-missing).',
    );
  }
  if (!names.some((n) => n.startsWith('__client_uat'))) {
    throw new Error(
      'No __client_uat cookie was captured. ' +
        'A Clerk development instance rejects cookie-based auth without it ' +
        '(session-token-but-no-client-uat).',
    );
  }

  // The client last-active timestamp must be a non-zero number of seconds and
  // must not be newer than the session token's `iat`, otherwise Clerk answers
  // `session-token-but-no-client-uat` / `session-token-iat-before-client-uat`.
  const sessionCookie = kept.find((c) => c.name.startsWith('__session'));
  const claims = decodeJwtClaims(sessionCookie?.value || '');
  for (const cookie of kept) {
    if (!cookie.name.startsWith('__client_uat')) continue;
    const captured = Number.parseInt(cookie.value, 10);
    const iat = Number(claims?.iat || 0);
    const value = Number.isFinite(captured) && captured > 0 ? captured : iat;
    cookie.value = String(Math.min(value, iat || value));
  }

  return { cookies: kept, origins: [] };
}

function storageStateName(baseUrl: string): string {
  const origin = new URL(baseUrl).origin;
  const safe = origin.replace(/[^a-z0-9]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `smartvideo-demo-${safe}.json`;
}

// ---------------------------------------------------------------------------
// Verification against the LOCAL server
// ---------------------------------------------------------------------------

interface CallResult {
  status: number;
  body: string;
}

async function call(page: Page, method: string, url: string, payload?: unknown): Promise<CallResult> {
  return page.evaluate(
    async ({ method, url, payload }) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 170_000);
      try {
        const res = await fetch(url, {
          method,
          credentials: 'include',
          headers: payload ? { 'content-type': 'application/json' } : undefined,
          body: payload ? JSON.stringify(payload) : undefined,
          signal: controller.signal,
        });
        return { status: res.status, body: await res.text() };
      } catch (err: any) {
        return {
          status: 0,
          body: `request failed: ${String(err && err.message ? err.message : err)}`,
        };
      } finally {
        clearTimeout(timer);
      }
    },
    { method, url, payload },
  );
}

function summarize(bodyText: string): Record<string, unknown> | null {
  try {
    const body = JSON.parse(bodyText);
    const keep: Record<string, unknown> = {};
    for (const key of [
      'ok',
      'cached',
      'status',
      'jobId',
      'browserQueued',
      'count',
      'providerUsed',
      'providerAttempted',
      'pagesCrawled',
      'duration',
      'id',
      'websiteUrl',
      'error',
      'code',
      'state',
      'businesses',
    ]) {
      if (body[key] !== undefined) {
        keep[key] = Array.isArray(body[key]) ? `array(${body[key].length})` : body[key];
      }
    }
    if (Array.isArray(body.businesses)) keep.businessCount = body.businesses.length;
    if (Array.isArray(body.results)) keep.resultsCount = body.results.length;
    return keep;
  } catch {
    return null;
  }
}

function printResult(label: string, result: CallResult): void {
  const summary = summarize(result.body);
  console.log(`\n--- ${label}`);
  console.log(`    HTTP ${result.status}`);
  if (summary) {
    console.log(`    body:   ${JSON.stringify(summary)}`);
  } else {
    console.log(`    body:   ${result.body.slice(0, 500)}`);
  }
}

/**
 * Loads the storage state into a real browser and proves the LOCAL server
 * accepts it.
 *
 * The navigation is what lets clerk-js refresh the (short lived) session
 * token, so it must happen before the gated API calls.
 */
async function verifyState(browser: Browser, statePath: string): Promise<void> {
  const context = await browser.newContext({ storageState: statePath });
  try {
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await page.waitForFunction(() => Boolean((window as any).Clerk?.loaded), null, {
      timeout: 180_000,
    }).catch(() => undefined);

    // Wait for clerk-js to (re)issue a live session token.
    const deadline = Date.now() + 60_000;
    let fresh = false;
    while (Date.now() < deadline) {
      const cookies = await context.cookies();
      fresh = cookies
        .filter((c) => c.name.startsWith('__session'))
        .some((c) => {
          const claims = decodeJwtClaims(c.value);
          return Number(claims?.exp || 0) > Math.floor(Date.now() / 1000) + 5;
        });
      if (fresh) break;
      await page.waitForTimeout(500);
    }
    console.log(`[clerk-local] session token refresh: ${fresh ? 'fresh' : 'STILL STALE'}`);

    const refreshedCookies = await context.cookies();
    for (const cookie of refreshedCookies) {
      if (!cookie.name.startsWith('__session')) continue;
      const claims = decodeJwtClaims(cookie.value);
      if (!claims) continue;
      console.log(
        `[clerk-local]   ${cookie.name}: iat=${claims.iat} exp=${claims.exp} azp=${claims.azp} ttl=${Number(
          claims.exp,
        ) - Number(claims.iat)}s`,
      );
    }

    // The protected route must render for the signed-in user (the middleware
    // redirects to /sign-in otherwise), which is what the E2E suites do.
    const studio = await page.goto(`${BASE_URL}/studio`, {
      waitUntil: 'domcontentloaded',
      timeout: 180_000,
    });
    await page.waitForFunction(() => Boolean((window as any).Clerk?.loaded), null, {
      timeout: 120_000,
    }).catch(() => undefined);
    const studioIdentity = await page.evaluate(() => ({
      userId: (window as any).Clerk?.user?.id || null,
      path: window.location.pathname,
    }));
    console.log(
      `[clerk-local] GET /studio -> HTTP ${studio?.status()} path=${studioIdentity.path} clerkUser=${
        studioIdentity.userId ?? 'none'
      }`,
    );

    const discover = await call(page, 'POST', '/api/personalization/discover-assets', {
      websiteUrl: 'https://wordpress.org',
    });
    printResult('POST /api/personalization/discover-assets', discover);

    let jobId: string | null = null;
    try {
      jobId = JSON.parse(discover.body)?.jobId || null;
    } catch {
      jobId = null;
    }

    if (jobId) {
      const status = await call(
        page,
        'GET',
        `/api/personalization/discover-assets/status?jobId=${encodeURIComponent(jobId)}`,
      );
      printResult(`GET /api/personalization/discover-assets/status?jobId=${jobId}`, status);
    } else {
      console.log('\n--- GET /api/personalization/discover-assets/status?jobId=<none> (skipped)');
    }

    const free = await call(page, 'POST', '/api/personalization/find-businesses', {
      niche: 'restaurants-food',
      location: 'Miami, Florida',
    });
    printResult('POST /api/personalization/find-businesses', free);

    if (discover.status === 401) {
      throw new Error(
        `Self-check failed: the generated state was rejected with 401 (body: ${discover.body.slice(0, 200)}).`,
      );
    }
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const frontendApi = requireDevKeys();
  const origin = new URL(BASE_URL).origin;
  const targetHost = new URL(BASE_URL).hostname;

  console.log(`[clerk-local] target        : ${origin}`);
  console.log(`[clerk-local] clerk instance: ${frontendApi} (development)`);

  const statePath = path.join(CLERK_DIR, storageStateName(BASE_URL));
  const browser = await chromium.launch({ headless: true });

  try {
    if (!VERIFY_ONLY) {
      // 1. @clerk/testing setup: fetches a testing token from the Backend API.
      await clerkSetup({ publishableKey: PUBLISHABLE_KEY, secretKey: SECRET_KEY });
      console.log(
        `[clerk-local] clerkSetup     : FAPI=${process.env.CLERK_FAPI} testing-token=${
          process.env.CLERK_TESTING_TOKEN ? 'acquired' : 'missing'
        }`,
      );

      // 2. The demo user has to exist for the ticket sign-in.
      const email = resolveEmail();
      const { id: clerkUserId, created } = await ensureUser(email);
      console.log(
        `[clerk-local] user          : ${email} -> ${clerkUserId} (${created ? 'created' : 'existing'})`,
      );

      // 3. Real browser sign-in through clerk-js.
      const signIn = await signInWithBrowser(browser, BASE_URL, email);
      console.log(
        `[clerk-local] signed in     : session=${signIn.sessionId} user=${signIn.userId}`,
      );

      const claims = signIn.sessionClaims;
      if (!claims) {
        throw new Error('The captured __session cookie is not a decodable JWT.');
      }
      console.log(
        `[clerk-local] session token : azp=${claims.azp} ttl=${Number(claims.exp) - Number(claims.iat)}s iat=${claims.iat} exp=${claims.exp}`,
      );

      console.log('[clerk-local] captured cookies:');
      for (const cookie of signIn.cookies) {
        let detail = '';
        if (cookie.name.startsWith('__client_uat')) {
          detail = ` value=${cookie.value}`;
        } else if (cookie.name.startsWith('__clerk_db_jwt')) {
          detail = ` len=${String(cookie.value || '').length}`;
        } else if (cookie.name.startsWith('__session')) {
          const claims = decodeJwtClaims(cookie.value);
          detail = claims ? ` iat=${claims.iat} exp=${claims.exp} azp=${claims.azp}` : '';
        }
        console.log(
          `                  ${cookie.name} @ ${cookie.domain}${cookie.path} httpOnly=${cookie.httpOnly} secure=${cookie.secure} sameSite=${cookie.sameSite}${detail}`,
        );
      }

      // 4. Storage state.
      const state = buildStorageState(signIn.cookies, targetHost, COOKIE_TTL_DAYS);
      fs.mkdirSync(CLERK_DIR, { recursive: true });
      fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
      console.log(
        `[clerk-local] storage state : ${path.relative(process.cwd(), statePath)} (${state.cookies.length} cookies)`,
      );
      console.log(
        `[clerk-local] cookies       : ${state.cookies.map((c) => `${c.name}@${c.domain}`).join(', ')}`,
      );

      fs.writeFileSync(
        path.join(CLERK_DIR, 'ACCOUNTS.local.json'),
        `${JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            baseUrl: origin,
            clerkInstance: frontendApi,
            mechanism: '@clerk/testing (clerkSetup + clerk.signIn) -> Backend API sign-in token -> clerk-js ticket exchange',
            note:
              'Local-only metadata (gitignored). The session JWT is short lived; clerk-js re-issues ' +
              'it on every document load, so a run must load the app page before it calls the gated API.',
            accounts: [
              {
                key: 'demo',
                email: resolveEmail(),
                clerkUserId,
                sessionId: signIn.sessionId,
                entitled: false,
                storageStatePath: path.relative(process.cwd(), statePath),
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
    } else {
      console.log(`[clerk-local] verify-only   : ${path.relative(process.cwd(), statePath)}`);
    }

    // 5. Self-check against the LOCAL server.
    console.log('[clerk-local] self-check: loading the generated state in a real browser');
    await verifyState(browser, statePath);
    console.log('[clerk-local] self-check OK');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[clerk-local] FAILED:', err?.message || err);
  process.exit(1);
});
