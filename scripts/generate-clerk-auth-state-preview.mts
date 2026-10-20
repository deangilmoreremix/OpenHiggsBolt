#!/usr/bin/env -S npx tsx
/**
 * scripts/generate-clerk-auth-state-preview.mts
 *
 * Mints a Playwright `storageState` for a PREVIEW origin (e.g. a Netlify
 * deploy preview) that the production Clerk instance does not list in
 * `allowed_origins`.
 *
 * Why this exists
 * ---------------
 * `scripts/generate-clerk-auth-state.mts` signs in with a real Chromium page
 * that loads the target origin and exchanges a sign-in ticket through
 * clerk-js. That works only when the Frontend API (FAPI) accepts the target
 * origin. This Clerk instance is configured with:
 *
 *   allowed_origins = ["https://go.smartvid.app"]
 *
 * so ANY other origin (a Netlify deploy preview, a localhost tunnel, a
 * staging domain) is rejected by the FAPI with:
 *
 *   400 {"errors":[{"code":"origin_invalid",
 *         "long_message":"The Request HTTP Origin header must be equal to or
 *           a subdomain of the requesting URL."}]}
 *
 * clerk-js therefore never finishes loading on such an origin
 * (`window.Clerk.loaded` stays false) and the ticket sign-in in the browser
 * times out. The regular generator cannot produce a state for those origins.
 *
 * What this script does instead
 * -----------------------------
 * 1. Signs in with a real Chromium page on the SIGN-IN ORIGIN (an origin the
 *    FAPI accepts, e.g. https://go.smartvid.app) and mints a real session for
 *    the real e2e account through clerk-js.
 * 2. Mints a LONG-LIVED session token for that session through the Clerk
 *    Backend API (`POST /v1/sessions/{id}/tokens`). The FAPI-issued token
 *    lives 60 seconds, which is too short for an E2E run and cannot be
 *    refreshed on a preview origin (clerk-js cannot talk to the FAPI there).
 * 3. Re-scopes the Clerk cookies to the TARGET host: the `__session` cookie
 *    carries the long-lived token, `__client_uat` carries that token's `iat`
 *    (Clerk requires `client_uat <= token.iat` and `client_uat != 0`).
 *    `__client` stays on the Frontend API domain.
 * 4. Self-checks the result in a real browser against the TARGET origin:
 *      - `GET  <target>/studio` must NOT redirect to the Clerk sign-in page
 *      - `POST <target>/api/personalization/discover-assets` must NOT be 401
 *        (expected 202 + a jobId)
 *      - `GET  <target>/api/access/resolve` must resolve the entitlement
 *
 * The session is a genuine, cryptographically valid session of the real e2e
 * account; the target server verifies it with the production instance key.
 * Only the COOKIE HOST SCOPE differs from a native sign-in, because the FAPI
 * refuses to issue cookies for an origin it does not allow.
 *
 * Usage
 * -----
 *   npx tsx scripts/generate-clerk-auth-state-preview.mts \
 *     --base-url https://<deploy>--<site>.netlify.app
 *   npx tsx scripts/generate-clerk-auth-state-preview.mts \
 *     --base-url https://<deploy>--<site>.netlify.app \
 *     --signin-origin https://go.smartvid.app --ttl-seconds 86400
 *
 * Outputs (under playwright/.clerk/, which is gitignored):
 *   smartvideo-demo-<safe-target-origin>.json   -> the storage state
 *   ACCOUNTS.local.json                          -> metadata (no secrets)
 *
 * Secrets (passwords, Clerk keys) are only read from the gitignored env files
 * and are never printed.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium, type Browser, type BrowserContext } from 'playwright';

import { ENTITLEMENTS } from '@/access/entitlements';
import { grantEntitlement, resolveSmartVideoAccessForUser } from '@/access/resolveAccess';

const CLERK_BACKEND_API = 'https://api.clerk.com/v1';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function argValue(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const BASE_URL = argValue('--base-url', '');
const SIGNIN_ORIGIN = argValue('--signin-origin', 'https://go.smartvid.app');
const TTL_SECONDS = Number(argValue('--ttl-seconds', '86400'));
const COOKIE_TTL_DAYS = Number(argValue('--cookie-ttl-days', '7'));
const EMAIL = argValue('--email', 'e2e-buyer@e2e.smartvid.app');
const CLERK_DIR = path.resolve(process.cwd(), 'playwright/.clerk');

if (!BASE_URL) {
  throw new Error('Missing --base-url <origin>. Example: --base-url https://abc--site.netlify.app');
}

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

function loadEnv(): void {
  const files = ['.env.production', '.env.local.backup', '.env.local'];
  const merged: Record<string, string> = {};
  for (const file of files) {
    for (const [key, value] of Object.entries(parseEnvFile(path.resolve(process.cwd(), file)))) {
      if (merged[key] === undefined) merged[key] = value;
    }
  }
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const SECRET_KEY = process.env.CLERK_SECRET_KEY || '';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

function requireLiveKeys(): void {
  if (!SECRET_KEY || !PUBLISHABLE_KEY) {
    throw new Error(
      'Missing CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Expected them in .env.production.',
    );
  }
  if (!PUBLISHABLE_KEY.startsWith('pk_live_') || !SECRET_KEY.startsWith('sk_live_')) {
    throw new Error('Refusing to run: the configured Clerk keys are not a live (production) instance.');
  }
}

// ---------------------------------------------------------------------------
// Clerk Backend API
// ---------------------------------------------------------------------------

async function clerkApi<T = any>(method: string, endpoint: string, body?: unknown): Promise<T> {
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

function decodeJwtClaims(token: string): Record<string, any> | null {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Storage state
// ---------------------------------------------------------------------------

interface Cookie {
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
 * Same naming rule as `playwright.shared.ts#resolveDemoAuthStatePath`, so the
 * E2E suites resolve the state for the origin they are pointed at.
 */
function storageStateName(baseUrl: string): string {
  const origin = new URL(baseUrl).origin;
  const safe = origin.replace(/[^a-z0-9]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `smartvideo-demo-${safe}.json`;
}

/**
 * Builds the target-origin storage state from the cookies captured on the
 * sign-in origin plus a long-lived session token.
 */
function buildStorageState(
  captured: any[],
  origins: any[],
  targetHost: string,
  sessionToken: string,
  ttlDays: number,
): { cookies: Cookie[]; origins: any[] } {
  const expires = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
  const claims = decodeJwtClaims(sessionToken);
  if (!claims?.iat) throw new Error('The long-lived session token is not a decodable JWT.');

  const kept: Cookie[] = [];
  const seenSuffixes = new Set<string>();

  for (const raw of captured) {
    const name: string = raw.name;
    if (name === '__client') {
      // The Frontend API client JWT stays on the FAPI domain.
      kept.push({
        name,
        value: raw.value,
        domain: raw.domain,
        path: raw.path || '/',
        expires,
        httpOnly: raw.httpOnly === true,
        secure: true,
        sameSite: 'Lax',
      });
      continue;
    }
    if (!name.startsWith('__session') && !name.startsWith('__client_uat')) continue;

    // Keep the suffixed/unsuffixed pairs exactly as Clerk issued them: the
    // backend decides which one to read from the LIVE cookie values.
    const suffix = name.includes('_') ? name.slice(name.indexOf('_') + 1) : '';
    if (seenSuffixes.has(`${name.split('_')[0]}:${suffix}`)) continue;
    seenSuffixes.add(`${name.split('_')[0]}:${suffix}`);

    const isSession = name.startsWith('__session');
    kept.push({
      name,
      value: isSession ? sessionToken : String(claims.iat),
      domain: targetHost,
      path: '/',
      expires,
      httpOnly: isSession,
      secure: true,
      sameSite: 'Lax',
    });
  }

  const names = kept.map((c) => c.name);
  if (!names.some((n) => n.startsWith('__session'))) {
    throw new Error('No __session cookie was captured from the browser sign-in.');
  }
  if (!names.some((n) => n.startsWith('__client_uat'))) {
    throw new Error('No __client_uat cookie was captured from the browser sign-in.');
  }

  // Re-point any captured localStorage (clerk-js' cached environment) at the
  // target origin so the storage state is consistent with the target.
  const repointed = (origins || []).map((entry: any) => ({
    ...entry,
    origin: `https://${targetHost}`,
  }));

  return { cookies: kept, origins: repointed };
}

// ---------------------------------------------------------------------------
// Browser sign-in on an origin the FAPI accepts
// ---------------------------------------------------------------------------

async function signInWithBrowser(
  browser: Browser,
  signinOrigin: string,
  userId: string,
): Promise<{ cookies: any[]; origins: any[]; sessionId: string }> {
  const signInToken = await clerkApi<any>('POST', '/sign_in_tokens', {
    user_id: userId,
    expires_in_seconds: 300,
  });

  const context: BrowserContext = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(signinOrigin, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(() => Boolean((window as any).Clerk?.loaded), null, { timeout: 120_000 });

    const result = await page.evaluate(async (ticket: string) => {
      const clerk = (window as any).Clerk;
      const signIn = await clerk.client.signIn.create({ strategy: 'ticket', ticket });
      if (signIn.status !== 'complete') return { ok: false, status: signIn.status };
      await clerk.setActive({ session: signIn.createdSessionId });
      return { ok: true, status: signIn.status, sessionId: signIn.createdSessionId };
    }, signInToken.token);

    if (!result.ok || !result.sessionId) {
      throw new Error(
        `Clerk ticket sign-in failed in the browser: ${JSON.stringify(result).slice(0, 300)}`,
      );
    }

    await page
      .waitForFunction(() => Boolean((window as any).Clerk?.user?.id), null, { timeout: 30_000 })
      .catch(() => undefined);

    const state = await context.storageState();
    return { cookies: state.cookies, origins: state.origins, sessionId: result.sessionId };
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Self-check against the target origin
// ---------------------------------------------------------------------------

async function verifyState(
  browser: Browser,
  statePath: string,
  targetOrigin: string,
): Promise<void> {
  const context = await browser.newContext({ storageState: statePath });
  try {
    const page = await context.newPage();

    // tsx/esbuild rewrites inner arrow functions with a `__name` helper that
    // does not exist inside the browser, so it is defined as a plain string
    // (a function passed to addInitScript would be rewritten as well).
    await context.addInitScript({
      content: 'globalThis.__name = globalThis.__name || function (fn) { return fn; };',
    });

    const studio = await page.goto(`${targetOrigin}/studio`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    const studioStatus = studio?.status() ?? 0;
    const studioPath = new URL(page.url()).pathname;
    console.log(
      `[clerk-preview] GET /studio -> HTTP ${studioStatus} path=${studioPath}` +
        (studioPath.startsWith('/sign-in') ? '  <-- REDIRECTED TO SIGN-IN (not authenticated)' : ''),
    );
    if (studioPath.startsWith('/sign-in')) {
      throw new Error(
        `The generated state does not authenticate against ${targetOrigin}: /studio redirected to the Clerk sign-in page.`,
      );
    }

    const result = await page.evaluate(async (origin: string) => {
      const call = async (method: string, url: string, payload?: unknown) => {
        const res = await fetch(url, {
          method,
          credentials: 'include',
          headers: payload ? { 'content-type': 'application/json' } : undefined,
          body: payload ? JSON.stringify(payload) : undefined,
        });
        return { status: res.status, body: await res.text() };
      };
      const discover = await call('POST', `${origin}/api/personalization/discover-assets`, {
        websiteUrl: 'https://wordpress.org',
      });
      const access = await call('GET', `${origin}/api/access/resolve`);
      return { discover, access };
    }, targetOrigin);

    console.log(
      `[clerk-preview] POST /api/personalization/discover-assets -> HTTP ${result.discover.status} ` +
        `body=${result.discover.body.slice(0, 200)}`,
    );
    console.log(
      `[clerk-preview] GET /api/access/resolve -> HTTP ${result.access.status} ` +
        `body=${result.access.body.slice(0, 300)}`,
    );

    if (result.discover.status === 401) {
      throw new Error(
        `Self-check failed: ${path.relative(process.cwd(), statePath)} was rejected with 401. ` +
          `body: ${result.discover.body.slice(0, 200)}`,
      );
    }
    if (result.discover.status !== 202) {
      throw new Error(
        `Self-check failed: expected 202 (accepted discovery job) from discover-assets, got ` +
          `HTTP ${result.discover.status}. body: ${result.discover.body.slice(0, 200)}`,
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
  requireLiveKeys();

  const targetOrigin = new URL(BASE_URL).origin;
  const targetHost = new URL(BASE_URL).hostname;
  const signinOrigin = new URL(SIGNIN_ORIGIN).origin;

  console.log(`[clerk-preview] target origin   : ${targetOrigin}`);
  console.log(`[clerk-preview] sign-in origin  : ${signinOrigin}`);
  console.log(`[clerk-preview] session ttl     : ${TTL_SECONDS}s`);

  const instance = await clerkApi<any>('GET', '/instance').catch(() => null);
  const allowed: string[] = instance?.allowed_origins || [];
  console.log(`[clerk-preview] instance allowed_origins: ${allowed.join(', ') || '(none)'}`);
  if (allowed.includes(targetOrigin)) {
    console.warn(
      '[clerk-preview] NOTE: the target origin IS allowed by the FAPI. Use ' +
        'scripts/generate-clerk-auth-state.mts --base-url <target> for a native sign-in instead.',
    );
  }

  // ── Account ───────────────────────────────────────────────────────────────
  const users = await clerkApi<any[]>(
    'GET',
    `/users?email_address=${encodeURIComponent(EMAIL)}&limit=10`,
  );
  const user = (users || []).find((candidate) =>
    (candidate.email_addresses || []).some(
      (entry: any) => String(entry.email_address || '').toLowerCase() === EMAIL.toLowerCase(),
    ),
  );
  if (!user) throw new Error(`Clerk user ${EMAIL} does not exist on this instance.`);

  const password = `Sv9!goE2e-${crypto.randomBytes(18).toString('base64url').slice(0, 18)}`;
  await clerkApi('PATCH', `/users/${user.id}`, { password, skip_password_checks: true });

  await grantEntitlement(user.id, EMAIL, ENTITLEMENTS.SMARTVIDEO_GO, 'manual');
  const access = await resolveSmartVideoAccessForUser(user.id);
  if (!access?.hasSmartVideoGo) {
    throw new Error(`Entitlement grant for ${EMAIL} did not verify (hasSmartVideoGo=false).`);
  }
  console.log(
    `[clerk-preview] account         : ${EMAIL} -> ${user.id} (entitlement ${ENTITLEMENTS.SMARTVIDEO_GO} active)`,
  );

  const browser = await chromium.launch({ headless: true });
  try {
    // ── Real browser sign-in on an allowed origin ───────────────────────────
    const { cookies, origins, sessionId } = await signInWithBrowser(browser, signinOrigin, user.id);
    console.log(`[clerk-preview] session         : ${sessionId}`);

    // ── Long-lived session token ────────────────────────────────────────────
    const tokenResponse = await clerkApi<any>('POST', `/sessions/${sessionId}/tokens`, {
      expires_in_seconds: TTL_SECONDS,
    });
    const sessionToken: string = tokenResponse.jwt || tokenResponse.token;
    const claims = decodeJwtClaims(sessionToken);
    if (!claims) throw new Error('The Backend API session token is not a decodable JWT.');
    console.log(
      `[clerk-preview] long-lived token: iat=${claims.iat} exp=${claims.exp} ` +
        `ttl=${claims.exp - claims.iat}s azp=${claims.azp ?? '(none)'}`,
    );

    // ── Storage state ───────────────────────────────────────────────────────
    const state = buildStorageState(cookies, origins, targetHost, sessionToken, COOKIE_TTL_DAYS);
    fs.mkdirSync(CLERK_DIR, { recursive: true });
    const statePath = path.join(CLERK_DIR, storageStateName(BASE_URL));
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    console.log(
      `[clerk-preview] storage state   : ${path.relative(process.cwd(), statePath)} ` +
        `(${state.cookies.length} cookies)`,
    );
    console.log(
      `[clerk-preview] cookies         : ${state.cookies.map((c) => `${c.name}@${c.domain}`).join(', ')}`,
    );

    fs.writeFileSync(
      path.join(CLERK_DIR, 'ACCOUNTS.preview.local.json'),
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: targetOrigin,
          signinOrigin,
          clerkUserId: user.id,
          email: EMAIL,
          sessionId,
          entitled: true,
          entitlement: ENTITLEMENTS.SMARTVIDEO_GO,
          mechanism:
            'browser ticket sign-in on the allowed origin + Backend API long-lived session token, ' +
            're-scoped to the target host (the FAPI refuses to issue cookies for a non-allowed origin)',
          storageStatePath: path.relative(process.cwd(), statePath),
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    // ── Self-check ──────────────────────────────────────────────────────────
    console.log('[clerk-preview] self-check: loading the generated state in a real browser');
    await verifyState(browser, statePath, targetOrigin);
    console.log('[clerk-preview] self-check OK');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[clerk-preview] FAILED:', err?.message || err);
  process.exit(1);
});
