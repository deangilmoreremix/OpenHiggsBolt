#!/usr/bin/env -S npx tsx
/**
 * scripts/generate-clerk-auth-state.mts
 *
 * Generates a REAL Clerk authentication state (a Playwright `storageState`) for
 * the OpenHiggsBolt production domain so the Clerk-gated personalization
 * endpoints stop answering 401:
 *
 *   POST /api/personalization/discover-assets
 *   GET  /api/personalization/discover-assets/status?jobId=...
 *
 * Mechanism (production-safe: no bypass cookie, no app change, no deploy)
 * ----------------------------------------------------------------------
 * 1. Clerk Backend API (https://api.clerk.com/v1, PRODUCTION secret key)
 *    creates the three real accounts:
 *      POST   /v1/users                -> user with a strong throwaway password
 *      PATCH  /v1/users/{id}           -> reset that password (idempotent re-runs)
 * 2. Clerk Backend API mints a one-shot sign-in ticket:
 *      POST   /v1/sign_in_tokens       { user_id }
 * 3. A real Chromium browser loads the production app and exchanges the ticket
 *    for a session through clerk-js:
 *      window.Clerk.client.signIn.create({ strategy: 'ticket', ticket })
 *      window.Clerk.setActive({ session })
 *    clerk-js then writes the genuine cookies (`__session`, `__session_<suffix>`,
 *    `__client_uat`, `__client_uat_<suffix>`, `__client`) exactly as a human
 *    browser would. The captured `__session` JWT carries the `azp` claim
 *    ("https://go.smartvid.app") that Clerk's server-side `authenticateRequest`
 *    requires (@clerk/backend `assertAuthorizedPartiesClaim`).
 * 4. The entitled account receives a real `user_entitlements` row through the
 *    repository's own `grantEntitlement()` helper
 *    (src/access/resolveAccess.ts:110) -- the exact function the Stripe
 *    webhook calls (app/api/webhooks/stripe/route.ts:299) -- using the
 *    Supabase service-role key. No new entitlement architecture is introduced
 *    and no production-wide access is granted: only the single test account
 *    gets a row.
 *
 * Why the session token is refreshed instead of being made "permanent"
 * ---------------------------------------------------------------------
 * This Clerk instance issues session tokens with a 60 second lifetime
 * (`exp - iat === 60`) and there is no way to mint a longer-lived token that
 * still carries the `azp` claim: the Backend API
 * `POST /v1/sessions/{id}/tokens` endpoint returns a token WITHOUT `azp`,
 * which Clerk's server rejects with a 401 (verified empirically).
 *
 * That is fine: clerk-js refreshes the session on every document load, as long
 * as the refresh cookies (`__client` + `__client_uat`) are present in the
 * storage state. So the generated state stays usable indefinitely:
 *   - load the storage state,
 *   - navigate to the app once (clerk-js re-issues `__session`),
 *   - then every /api/personalization/** call is authenticated.
 * A `context.request` call made BEFORE the first navigation is unauthenticated
 * (401) because the stored JWT has expired by then. `scripts/verify-clerk-auth-state.mts`
 * demonstrates the working order.
 *
 * Usage
 * -----
 *   npx tsx scripts/generate-clerk-auth-state.mts
 *   npx tsx scripts/generate-clerk-auth-state.mts --base-url https://go.smartvid.app
 *   npx tsx scripts/generate-clerk-auth-state.mts --only buyer
 *   npx tsx scripts/generate-clerk-auth-state.mts --cookie-ttl-days 7
 *
 * Outputs (all under playwright/.clerk/, which is gitignored):
 *   smartvideo-demo-https_go_smartvid_app.json        -> entitled account (main)
 *   smartvideo-demo-https_go_smartvid_app.buyer.json  -> entitled account
 *   smartvideo-demo-https_go_smartvid_app.normal.json -> signed-in, no entitlement
 *   smartvideo-demo-https_go_smartvid_app.free.json   -> signed-in, no entitlement
 *   ACCOUNTS.local.json                               -> credentials + entitlement map
 *
 * Secrets (passwords, Clerk keys) are only read from the gitignored env files
 * and are never printed.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium, type Browser, type BrowserContext } from 'playwright';

import { ENTITLEMENTS } from '@/access/entitlements';
import {
  grantEntitlement,
  revokeEntitlement,
  resolveSmartVideoAccessForUser,
} from '@/access/resolveAccess';

const CLERK_BACKEND_API = 'https://api.clerk.com/v1';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function argValue(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const BASE_URL = argValue('--base-url', 'https://go.smartvid.app');
const ONLY = argValue('--only', '');
const COOKIE_TTL_DAYS = Number(argValue('--cookie-ttl-days', '7'));
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
 * Precedence (first wins):
 *   real process env > .env.production > .env.local.backup > .env.local
 *
 * `.env.production` holds the PRODUCTION Clerk instance keys
 * (clerk.go.smartvid.app). `.env.local` holds the DEVELOPMENT instance keys
 * (touched-stud-74.clerk.accounts.dev) and must never be used against the
 * production app, so it is only consulted for keys the production files do
 * not define.
 */
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

function frontendApiFromPublishableKey(publishableKey: string): string {
  const payload = publishableKey.replace(/^pk_(test|live)_/, '');
  return Buffer.from(payload, 'base64').toString('utf8').replace(/\$$/, '');
}

/**
 * Refuses to run against anything but the live instance that serves the
 * target origin. A dev-instance session cookie is rejected by the production
 * app, and a live-instance cookie would be rejected by a dev app, so mixing
 * the two up is always a bug.
 */
function requireProductionKeys(): string {
  if (!SECRET_KEY || !PUBLISHABLE_KEY) {
    throw new Error(
      'Missing CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Expected them in ' +
        '.env.production (production instance).',
    );
  }
  if (!PUBLISHABLE_KEY.startsWith('pk_live_') || !SECRET_KEY.startsWith('sk_live_')) {
    throw new Error(
      'Refusing to run: the configured Clerk keys are not a live (production) instance. ' +
        'The session cookie must be minted by the same instance that serves the target app.',
    );
  }
  return frontendApiFromPublishableKey(PUBLISHABLE_KEY);
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

type AccountKey = 'buyer' | 'normal' | 'free';

interface AccountSpec {
  key: AccountKey;
  email: string;
  entitled: boolean;
  description: string;
}

const ACCOUNTS: AccountSpec[] = [
  {
    key: 'buyer',
    email: 'e2e-buyer@e2e.smartvid.app',
    entitled: true,
    description: 'signed-in buyer WITH a legitimate SMARTVIDEO_GO entitlement',
  },
  {
    key: 'normal',
    email: 'e2e-normal@e2e.smartvid.app',
    entitled: false,
    description: 'plain signed-in account, no entitlement',
  },
  {
    key: 'free',
    email: 'e2e-free@e2e.smartvid.app',
    entitled: false,
    description: 'free/demo signed-in account, no entitlement',
  },
];

function storageStateName(baseUrl: string, suffix?: string): string {
  const origin = new URL(baseUrl).origin;
  const safe = origin.replace(/[^a-z0-9]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `smartvideo-demo-${safe}${suffix ? `.${suffix}` : ''}.json`;
}

// ---------------------------------------------------------------------------
// Clerk Backend API
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

function randomPassword(): string {
  const raw = crypto.randomBytes(18).toString('base64url');
  return `Sv9!goE2e-${raw.slice(0, 18)}`;
}

async function findUserByEmail(email: string): Promise<any | null> {
  // The Backend API filters with a repeated `email_address` parameter
  // (`email_address[]` is silently ignored and returns an unfiltered page).
  const data = await clerkApi<any[]>(
    'GET',
    `/users?email_address=${encodeURIComponent(email)}&limit=10`,
  );
  const user = (data || []).find((candidate) =>
    (candidate.email_addresses || []).some(
      (entry: any) =>
        String(entry.email_address || '').toLowerCase() === email.toLowerCase(),
    ),
  );
  return user || null;
}

async function ensureUser(
  spec: AccountSpec,
  password: string,
): Promise<{ id: string; created: boolean }> {
  const existing = await findUserByEmail(spec.email);
  if (existing) {
    // Keep the stored password authoritative so re-runs are reproducible.
    await clerkApi('PATCH', `/users/${existing.id}`, {
      password,
      skip_password_checks: true,
    });
    return { id: existing.id, created: false };
  }

  const data = await clerkApi<any>('POST', '/users', {
    email_address: [spec.email],
    password,
    first_name: 'E2E',
    last_name: spec.key.toUpperCase(),
  });
  return { id: data.id, created: true };
}

// ---------------------------------------------------------------------------
// Real browser sign-in (ticket -> session -> genuine Clerk cookies)
// ---------------------------------------------------------------------------

async function signInWithBrowser(
  browser: Browser,
  baseUrl: string,
  userId: string,
): Promise<{ cookies: any[]; origins: any[]; sessionId: string }> {
  const signInToken = await clerkApi<any>('POST', '/sign_in_tokens', {
    user_id: userId,
    expires_in_seconds: 300,
  });

  const context: BrowserContext = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForFunction(
      () => Boolean((window as any).Clerk && (window as any).Clerk.loaded),
      null,
      { timeout: 90_000 },
    );

    const result = await page.evaluate(async (ticket: string) => {
      const clerk = (window as any).Clerk;
      try {
        const signIn = await clerk.client.signIn.create({ strategy: 'ticket', ticket });
        if (signIn.status !== 'complete') {
          return { ok: false, status: signIn.status };
        }
        await clerk.setActive({ session: signIn.createdSessionId });
        return { ok: true, status: signIn.status, sessionId: signIn.createdSessionId };
      } catch (err: any) {
        return { ok: false, error: String(err && err.message ? err.message : err) };
      }
    }, signInToken.token);

    if (!result.ok || !result.sessionId) {
      throw new Error(
        `Clerk ticket sign-in failed in the browser: ${JSON.stringify(result).slice(0, 300)}`,
      );
    }

    await page
      .waitForFunction(
        () => Boolean((window as any).Clerk?.user?.id),
        null,
        { timeout: 30_000 },
      )
      .catch(() => undefined);

    const state = await context.storageState();
    return { cookies: state.cookies, origins: state.origins, sessionId: result.sessionId };
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Storage state normalisation
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

function decodeJwtClaims(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

const DROPPED_COOKIES = new Set(['__cf_bm', '_cfuvid', '__cftoken']);

/**
 * Keeps only the Clerk auth cookies, gives them a long cookie lifetime (the
 * JWT inside `__session` is short lived but clerk-js re-issues it on every
 * document load) and pins the attributes Clerk itself uses:
 *   - `__session` / `__session_<suffix>`: host `go.smartvid.app`, path "/",
 *     secure, httpOnly, SameSite=Lax
 *   - `__client_uat` / `__client_uat_<suffix>`: domain `.smartvid.app`
 *   - `__client`: domain `.clerk.go.smartvid.app`
 */
function buildStorageState(
  cookies: any[],
  origins: any[],
  ttlDays: number,
): { cookies: Cookie[]; origins: any[] } {
  const expires = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
  const targetHost = new URL(BASE_URL).hostname;

  const kept: Cookie[] = [];

  for (const raw of cookies) {
    if (DROPPED_COOKIES.has(raw.name)) continue;
    if (
      !raw.name.startsWith('__session') &&
      !raw.name.startsWith('__client_uat') &&
      raw.name !== '__client'
    ) {
      continue;
    }

    const isSession = raw.name.startsWith('__session');
    const isUat = raw.name.startsWith('__client_uat');

    const cookie: Cookie = {
      name: raw.name,
      value: raw.value,
      domain: isSession ? targetHost : raw.domain,
      path: raw.path || '/',
      expires,
      httpOnly: isSession ? true : raw.httpOnly === true,
      secure: true,
      sameSite: (raw.sameSite === 'Strict' || raw.sameSite === 'None' ? raw.sameSite : 'Lax') as
        | 'Strict'
        | 'Lax'
        | 'None',
    };

    if (isUat) {
      // The client "last active at" marker must be the token's `iat` in
      // seconds and must never be newer than the session it describes.
      const claims = decodeJwtClaims(
        cookies.find((c) => c.name.startsWith('__session'))?.value || '',
      );
      if (claims?.iat) cookie.value = String(claims.iat);
    }

    kept.push(cookie);
  }

  const names = kept.map((c) => c.name);
  if (!names.some((n) => n.startsWith('__session'))) {
    throw new Error('No __session cookie was captured from the browser sign-in.');
  }

  return { cookies: kept, origins };
}

// ---------------------------------------------------------------------------
// Self-check
// ---------------------------------------------------------------------------

/**
 * Loads a generated storage state into a real browser and proves the server
 * accepts it.
 *
 * The session token this Clerk instance issues lives 60 seconds, so the token
 * inside the stored state is stale by the time it is used. clerk-js re-issues
 * it on the first document load and writes the fresh token to the SUFFIXED
 * cookie (`__session_<origin-suffix>`), so the check waits for that refresh
 * before calling the gated endpoints -- otherwise it would report a spurious
 * 401.
 */
async function verifyState(
  browser: Browser,
  statePath: string,
  expectEntitled: boolean,
): Promise<{ statusCode: number; accessState: string; hasSmartVideoGo: boolean }> {
  const context = await browser.newContext({ storageState: statePath });
  try {
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page
      .waitForFunction(() => Boolean((window as any).Clerk?.loaded), null, { timeout: 90_000 })
      .catch(() => undefined);

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const cookies = await context.cookies();
      const fresh = cookies
        .filter((c) => c.name.startsWith('__session'))
        .some((c) => {
          try {
            const claims = JSON.parse(
              Buffer.from(c.value.split('.')[1], 'base64url').toString('utf8'),
            );
            return claims.exp > Math.floor(Date.now() / 1000) + 5;
          } catch {
            return false;
          }
        });
      if (fresh) break;
      await page.waitForTimeout(500);
    }

    const result = await page.evaluate(async () => {
      const statusRes = await fetch(
        '/api/personalization/discover-assets/status?jobId=test',
        { credentials: 'include' },
      );
      const statusBody = await statusRes.text();
      const accessRes = await fetch('/api/access/resolve', { credentials: 'include' });
      const accessBody = await accessRes.text();
      return { statusCode: statusRes.status, statusBody, accessBody };
    });

    let accessState = 'unknown';
    let hasSmartVideoGo = false;
    try {
      const parsed = JSON.parse(result.accessBody);
      accessState = parsed.state || 'unknown';
      hasSmartVideoGo = Boolean(parsed?.access?.hasSmartVideoGo);
    } catch {
      /* keep defaults */
    }

    if (result.statusCode === 401) {
      throw new Error(
        `Self-check failed: ${path.relative(process.cwd(), statePath)} was rejected with 401. ` +
          `body: ${result.statusBody}`,
      );
    }
    if (expectEntitled && !hasSmartVideoGo) {
      throw new Error(
        `Self-check failed: the entitled account resolved to "${accessState}" ` +
          '(hasSmartVideoGo=false). The entitlement row is missing or not qualifying.',
      );
    }

    return { statusCode: result.statusCode, accessState, hasSmartVideoGo };
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const frontendApi = requireProductionKeys();
  const origin = new URL(BASE_URL).origin;

  console.log(`[clerk-auth] target        : ${origin}`);
  console.log(`[clerk-auth] clerk instance: ${frontendApi} (live)`);

  const instance = await clerkApi<any>('GET', '/instance').catch(() => null);
  if (instance?.allowed_origins) {
    const allowed: string[] = instance.allowed_origins;
    const ok = allowed.includes(origin) || allowed.includes(`https://${new URL(origin).hostname}`);
    console.log(`[clerk-auth] allowed origins: ${allowed.join(', ') || '(none listed)'}`);
    if (!ok && allowed.length > 0) {
      console.warn(
        `[clerk-auth] WARNING: ${origin} is not in the instance allowed_origins list. ` +
          'Sign-in may be rejected by the instance.',
      );
    }
  }

  const selected = ONLY ? ACCOUNTS.filter((a) => a.key === ONLY) : ACCOUNTS;
  if (selected.length === 0) {
    throw new Error(`--only ${ONLY} did not match any account`);
  }

  const browser = await chromium.launch({ headless: true });
  const records: any[] = [];

  try {
    for (const spec of selected) {
      const password = randomPassword();
      const { id: clerkUserId, created } = await ensureUser(spec, password);
      console.log(
        `[clerk-auth] ${spec.key.padEnd(6)} ${spec.email} -> ${clerkUserId} (${created ? 'created' : 'updated'})`,
      );

      // Entitlement handling ------------------------------------------------
      if (spec.entitled) {
        // The repository's own grant path (src/access/resolveAccess.ts
        // `grantEntitlement`) -- the same helper the Stripe webhook calls at
        // app/api/webhooks/stripe/route.ts:299.
        await grantEntitlement(
          clerkUserId,
          spec.email,
          ENTITLEMENTS.SMARTVIDEO_GO,
          'manual',
        );
        const access = await resolveSmartVideoAccessForUser(clerkUserId);
        if (!access?.hasSmartVideoGo) {
          throw new Error(
            `Entitlement grant for ${spec.email} did not verify (hasSmartVideoGo=false)`,
          );
        }
        console.log(
          `[clerk-auth] ${spec.key.padEnd(6)} entitlement: ${ENTITLEMENTS.SMARTVIDEO_GO} granted (status=${access.status}, source=${access.source})`,
        );
      } else {
        // Guarantee "no entitlement": revoke any row that may exist for this
        // account using the repository's revocation helper.
        const existing = await resolveSmartVideoAccessForUser(clerkUserId);
        if (existing && existing.status !== 'inactive') {
          await revokeEntitlement({ clerkUserId }, { reason: 'e2e-no-entitlement' });
        }
        const access = await resolveSmartVideoAccessForUser(clerkUserId);
        console.log(
          `[clerk-auth] ${spec.key.padEnd(6)} entitlement: none (status=${access?.status}, hasSmartVideoGo=${access?.hasSmartVideoGo})`,
        );
      }

      // Real browser sign-in ------------------------------------------------
      const { cookies, origins, sessionId } = await signInWithBrowser(
        browser,
        BASE_URL,
        clerkUserId,
      );
      const state = buildStorageState(cookies, origins, COOKIE_TTL_DAYS);

      const sessionCookie = state.cookies.find((c) => c.name.startsWith('__session'));
      const claims = decodeJwtClaims(sessionCookie?.value || '');
      if (!claims || claims.azp !== origin) {
        throw new Error(
          `The minted session token is missing the azp claim (azp=${claims?.azp}). ` +
            'Clerk would reject it with 401.',
        );
      }

      fs.mkdirSync(CLERK_DIR, { recursive: true });
      const filePath = path.join(CLERK_DIR, storageStateName(BASE_URL, spec.key));
      fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

      // The main demo state (what playwright.shared.ts resolves) is the
      // entitled account.
      if (spec.entitled) {
        const mainPath = path.join(CLERK_DIR, storageStateName(BASE_URL));
        fs.writeFileSync(mainPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
      }

      console.log(
        `[clerk-auth] ${spec.key.padEnd(6)} storage state: ${path.relative(process.cwd(), filePath)} (${state.cookies.length} cookies)`,
      );
      console.log(
        `[clerk-auth] ${spec.key.padEnd(6)} cookies: ${state.cookies.map((c) => `${c.name}@${c.domain}`).join(', ')}`,
      );
      console.log(
        `[clerk-auth] ${spec.key.padEnd(6)} session ${sessionId} azp=${claims.azp} token ttl ${claims.exp - claims.iat}s`,
      );

      records.push({
        key: spec.key,
        email: spec.email,
        password,
        clerkUserId,
        sessionId,
        entitled: spec.entitled,
        entitlement: spec.entitled ? ENTITLEMENTS.SMARTVIDEO_GO : null,
        description: spec.description,
        storageStatePath: path.relative(process.cwd(), filePath),
      });
    }

    // Merge with any previously recorded accounts (e.g. partial runs).
    const accountsFile = path.join(CLERK_DIR, 'ACCOUNTS.local.json');
    const previous = fs.existsSync(accountsFile)
      ? (JSON.parse(fs.readFileSync(accountsFile, 'utf8')) as any)
      : { accounts: [] };
    const merged = new Map<string, any>();
    for (const entry of previous.accounts || []) merged.set(entry.key, entry);
    for (const entry of records) merged.set(entry.key, entry);

    fs.writeFileSync(
      accountsFile,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: origin,
          clerkInstance: frontendApi,
          note:
            'Local-only test credentials (gitignored). The __session JWT lives 60s; clerk-js ' +
            're-issues it on every document load, so a run must load the app page before it ' +
            'calls the gated API endpoints.',
          accounts: [...merged.values()],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    console.log(`[clerk-auth] wrote ${path.relative(process.cwd(), accountsFile)}`);

    // Self-check: prove the produced states authenticate against production.
    console.log('[clerk-auth] self-check: loading the generated states in a real browser');
    for (const entry of records) {
      const statePath = path.resolve(process.cwd(), entry.storageStatePath);
      const check = await verifyState(browser, statePath, entry.entitled);
      console.log(
        `[clerk-auth] self-check ${entry.key.padEnd(6)} GET discover-assets/status -> ${check.statusCode}, ` +
          `/api/access/resolve -> ${check.accessState} (hasSmartVideoGo=${check.hasSmartVideoGo})`,
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[clerk-auth] FAILED:', err?.message || err);
  process.exit(1);
});
