#!/usr/bin/env -S npx tsx
/**
 * scripts/verify-clerk-auth-state.mts
 *
 * Verifies the generated Clerk storage state against the production app with a
 * REAL browser.
 *
 * For every account it loads the Playwright storage state into a Chromium
 * context, navigates to the app once (clerk-js re-issues the 60 second
 * `__session` JWT on load), and then calls the two Clerk-gated endpoints:
 *
 *   GET  /api/personalization/discover-assets/status?jobId=...
 *   POST /api/personalization/discover-assets  {"websiteUrl":"https://wordpress.org"}
 *
 * It also checks isolation: the free (unentitled) account must not be able to
 * read the entitled account's discovery job.
 *
 * Usage:
 *   npx tsx scripts/verify-clerk-auth-state.mts
 *   npx tsx scripts/verify-clerk-auth-state.mts --account free
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from 'playwright';

const ROOT = process.cwd();
const CLERK_DIR = path.join(ROOT, 'playwright/.clerk');
const ACCOUNTS_FILE = path.join(CLERK_DIR, 'ACCOUNTS.local.json');

function argValue(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const ONLY = argValue('--account', '');

if (!fs.existsSync(ACCOUNTS_FILE)) {
  console.error(`Missing ${ACCOUNTS_FILE}. Run scripts/generate-clerk-auth-state.mts first.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
const BASE_URL = manifest.baseUrl || 'https://go.smartvid.app';
const accounts = (manifest.accounts || []).filter((a: any) => (ONLY ? a.key === ONLY : true));

interface CallResult {
  status: number;
  body: string;
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
      'entitlement',
      'upgradeRequired',
    ]) {
      if (body[key] !== undefined) keep[key] = body[key];
    }
    if (body.access) {
      keep.access = {
        state: body.access.state,
        hasSmartVideoGo: body.access.hasSmartVideoGo,
        status: body.access.status,
        source: body.access.source,
      };
    }
    if (body.result) keep.resultKeys = Object.keys(body.result);
    if (body.discoveredAssets) keep.discoveredAssets = body.discoveredAssets.length;
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
    if (summary.resultKeys) {
      console.log(`    (result object omitted, keys: ${(summary.resultKeys as string[]).join(', ')})`);
    }
  } else {
    console.log(`    body:   ${result.body.slice(0, 400)}`);
  }
}

/**
 * Waits until clerk-js has re-issued the session token.
 *
 * The session token this Clerk instance issues lives 60 seconds, so the token
 * stored in the storage state is expired by the time a run starts. clerk-js
 * refreshes it on the first document load, but the refreshed token is written
 * to the SUFFIXED cookie (`__session_<origin-suffix>`) and only after the
 * Frontend API round trip completes. Calling the gated API before that
 * happens is what produces a spurious 401, so the refresh is awaited here.
 */
async function waitForFreshSessionToken(
  context: BrowserContext,
  page: Page,
  timeoutMs = 60_000,
): Promise<{ refreshed: boolean; sessionCookie: string | null }> {
  const deadline = Date.now() + timeoutMs;
  // Ask clerk-js for a token: it refreshes the cached one when it is stale
  // and updates the session cookie as a side effect.
  await page
    .evaluate(async () => {
      const clerk = (window as any).Clerk;
      if (clerk?.session?.getToken) {
        await clerk.session.getToken();
      }
    })
    .catch(() => undefined);

  let sessionCookie: string | null = null;
  while (Date.now() < deadline) {
    const cookies = await context.cookies();
    const session = cookies
      .filter((c) => c.name.startsWith('__session'))
      .map((c) => {
        try {
          const claims = JSON.parse(
            Buffer.from(c.value.split('.')[1], 'base64url').toString('utf8'),
          );
          return { name: c.name, exp: claims.exp, azp: claims.azp };
        } catch {
          return { name: c.name, exp: 0, azp: undefined };
        }
      })
      .sort((a, b) => b.exp - a.exp)[0];
    if (session && session.exp > Math.floor(Date.now() / 1000) + 5) {
      return { refreshed: true, sessionCookie: session.name };
    }
    await page.waitForTimeout(500);
  }
  return { refreshed: false, sessionCookie };
}

/**
 * The API calls are issued from inside the page (same-origin, cookies
 * included). The navigation that precedes them is what lets clerk-js refresh
 * the short lived `__session` JWT.
 */
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
      } catch (err) {
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

interface AccountRun {
  key: string;
  entitled: boolean;
  clerkUser: { id: string | null; email: string | null; sessionId: string | null } | null;
  statusProbe: CallResult;
  discover: CallResult;
  ownStatus: CallResult | null;
  access: CallResult;
  jobId: string | null;
}

async function runAccount(statePath: string): Promise<AccountRun> {
  const browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext({ storageState: statePath });
  try {
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page
      .waitForFunction(() => Boolean((window as any).Clerk?.loaded), null, { timeout: 90_000 })
      .catch(() => undefined);

    const refresh = await waitForFreshSessionToken(context, page);
    console.log(
      `\n    session token refresh: ${refresh.refreshed ? 'fresh' : 'STILL STALE'} (${refresh.sessionCookie ?? 'n/a'})`,
    );

    const clerkUser = await page.evaluate(() => ({
      id: (window as any).Clerk?.user?.id || null,
      email: (window as any).Clerk?.user?.primaryEmailAddress?.emailAddress || null,
      sessionId: (window as any).Clerk?.session?.id || null,
    }));

    const statusProbe = await call(
      page,
      'GET',
      '/api/personalization/discover-assets/status?jobId=test',
    );
    printResult('GET /api/personalization/discover-assets/status?jobId=test', statusProbe);

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

    let ownStatus: CallResult | null = null;
    if (jobId) {
      ownStatus = await call(
        page,
        'GET',
        `/api/personalization/discover-assets/status?jobId=${encodeURIComponent(jobId)}`,
      );
      printResult(`GET /api/personalization/discover-assets/status?jobId=<own job ${jobId}>`, ownStatus);
    }

    const access = await call(page, 'GET', '/api/access/resolve');
    printResult('GET /api/access/resolve', access);

    return { key: '', entitled: false, clerkUser, statusProbe, discover, ownStatus, access, jobId };
  } finally {
    await context.close();
    await browser.close();
  }
}

const results: Record<string, unknown> = {};
const jobIds: Record<string, string | null> = {};

for (const account of accounts) {
  const statePath = path.isAbsolute(account.storageStatePath)
    ? account.storageStatePath
    : path.join(ROOT, account.storageStatePath);

  console.log(`\n============================================================`);
  console.log(`account: ${account.key} <${account.email}>  entitled=${account.entitled}`);
  console.log(`state:   ${path.relative(ROOT, statePath)}`);
  console.log(`============================================================`);

  const out = await runAccount(statePath);
  out.key = account.key;
  out.entitled = account.entitled;
  console.log(`\n    clerk session: ${JSON.stringify(out.clerkUser)}`);

  results[`${account.key}:status:probe`] = out.statusProbe.status;
  results[`${account.key}:discover`] = out.discover.status;
  results[`${account.key}:status:own`] = out.ownStatus?.status ?? null;
  results[`${account.key}:access`] = out.access.status;
  jobIds[account.key] = out.jobId;
}

// ---------------------------------------------------------------------------
// Isolation: the free account must not read the entitled account's job
// ---------------------------------------------------------------------------

const entitled = accounts.find((a: any) => a.entitled && jobIds[a.key]);
const freeAccount = accounts.find((a: any) => !a.entitled);

if (entitled && freeAccount && !ONLY) {
  console.log(`\n============================================================`);
  console.log(
    `isolation: ${freeAccount.key} <${freeAccount.email}> reading ${entitled.key}'s job ${jobIds[entitled.key]}`,
  );
  console.log(`============================================================`);

  const freeState = path.isAbsolute(freeAccount.storageStatePath)
    ? freeAccount.storageStatePath
    : path.join(ROOT, freeAccount.storageStatePath);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ storageState: freeState });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page
      .waitForFunction(() => Boolean((window as any).Clerk?.loaded), null, { timeout: 90_000 })
      .catch(() => undefined);
    await page.waitForTimeout(1_500);
    await waitForFreshSessionToken(context, page);
    const cross = await call(
      page,
      'GET',
      `/api/personalization/discover-assets/status?jobId=${jobIds[entitled.key]}`,
    );
    printResult(`GET /api/personalization/discover-assets/status?jobId=<${entitled.key}'s job>`, cross);
    results['isolation:cross-user-job'] = cross.status;
  } finally {
    await browser.close();
  }
}

console.log('\n============================================================');
console.log('summary:', JSON.stringify(results, null, 2));
console.log('============================================================');
