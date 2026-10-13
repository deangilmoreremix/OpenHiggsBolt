/**
 * e2e/fixtures/clerkSession.ts
 *
 * Mints a REAL Clerk session for the personalization E2E specs.
 *
 * Why this exists
 * ---------------
 * `POST /api/personalization/discover-assets` (and `/download-image`) call
 * Clerk `auth()` inside the route handler. The `__e2e_auth_bypass` cookie is
 * only honoured by middleware (middleware.js:78-83), so it never reaches
 * route-level `auth()` and an unauthenticated run gets a hard 401 — which is
 * why the live run had no assets to place.
 *
 * A genuine browser session needs THREE cookies on a Clerk *development*
 * instance (see @clerk/backend `authenticateRequest`):
 *   1. `__session`       — the Clerk session JWT (Backend API
 *                          `sessions.getToken` on a real session).
 *   2. `__clerk_db_jwt`  — the dev-browser JWT (FAPI `POST /v1/dev_browser`).
 *                          Without it the reason is `dev-browser-missing`.
 *   3. `__client_uat`    — the client last-active timestamp, in SECONDS, and
 *                          it must be <= the session token's `iat`. Without
 *                          it the reason is `session-token-but-no-client-uat`.
 *
 * Every credential is read at runtime from `.env.local` (or the process
 * environment). Nothing is ever written to a tracked file.
 *
 * Required env (all already present in the worktree `.env.local`):
 *   - CLERK_SECRET_KEY
 *   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   (encodes the Frontend API domain)
 * Optional:
 *   - E2E_CLERK_USER_ID                  (defaults to the SmartVideo Demo
 *                                          test user looked up from the
 *                                          Backend API)
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClerkClient, verifyToken } from '@clerk/backend';
import type { BrowserContext, Page } from '@playwright/test';

/** How long the minted session token should stay valid, in seconds. */
const SESSION_TOKEN_TTL_SECONDS = 3600;

/** Deterministic test user used when E2E_CLERK_USER_ID is not provided. */
const DEFAULT_E2E_USER_EMAIL = 'smartvideo-demo+clerk_test@videoremix.vip';

export interface MintedClerkSession {
  /** The Clerk user id the session belongs to. */
  userId: string;
  /** The Clerk session id the token was minted from. */
  sessionId: string;
  /** Raw session JWT (value of the `__session` cookie). */
  token: string;
  /** Dev-browser JWT (value of the `__clerk_db_jwt` cookie). */
  devBrowserToken: string;
  /** `iat` of the session token, i.e. the `__client_uat` value, in seconds. */
  clientUat: number;
}

function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

/**
 * Decodes the Clerk Frontend API domain out of the publishable key, which is
 * `pk_(test|live)_<base64(frontendApi domain)>`.
 */
function frontendApiFromPublishableKey(publishableKey: string): string {
  const payload = publishableKey.replace(/^pk_(test|live)_/, '');
  const decoded = Buffer.from(payload, 'base64').toString('utf8');
  // The encoded payload carries a trailing `$` sentinel.
  return decoded.replace(/\$$/, '');
}

async function resolveUserId(client: ReturnType<typeof createClerkClient>): Promise<string> {
  const explicit = process.env.E2E_CLERK_USER_ID;
  if (explicit) return explicit;

  const response = await client.users.getUserList({
    emailAddress: [DEFAULT_E2E_USER_EMAIL],
    limit: 1,
  });
  const user = response.data.find((candidate) =>
    candidate.emailAddresses.some((entry) => entry.emailAddress === DEFAULT_E2E_USER_EMAIL),
  );
  if (!user) {
    throw new Error(
      `clerkSession: no Clerk user found for ${DEFAULT_E2E_USER_EMAIL}. ` +
        'Set E2E_CLERK_USER_ID to a user that exists on this Clerk instance.',
    );
  }
  return user.id;
}

async function mintDevBrowserToken(frontendApi: string): Promise<string> {
  const response = await fetch(`https://${frontendApi}/v1/dev_browser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) {
    throw new Error(
      `clerkSession: Clerk FAPI POST /v1/dev_browser failed with HTTP ${response.status}`,
    );
  }
  const data = (await response.json()) as { token?: string };
  if (!data.token) {
    throw new Error('clerkSession: Clerk FAPI /v1/dev_browser returned no token');
  }
  return data.token;
}

/**
 * Mints a real Clerk session and caches it for the lifetime of the Playwright
 * worker process, so a whole spec file shares a single mint.
 */
let cachedSession: Promise<MintedClerkSession> | null = null;

export function mintClerkSession(): Promise<MintedClerkSession> {
  if (!cachedSession) {
    cachedSession = mintUncached();
  }
  return cachedSession;
}

async function mintUncached(): Promise<MintedClerkSession> {
  loadEnv();

  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey) {
    throw new Error(
      'clerkSession: CLERK_SECRET_KEY is not set (read from .env.local). ' +
        'A real Clerk session cannot be minted without it.',
    );
  }
  if (!publishableKey) {
    throw new Error('clerkSession: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set (read from .env.local).');
  }

  const client = createClerkClient({ secretKey });
  const userId = await resolveUserId(client);

  // Reuse an existing active session when the user already has one so repeated
  // local runs do not pile up sessions; otherwise create a fresh one.
  const existing = await client.sessions.getSessionList({ userId, status: 'active' });
  const sessionId = existing.data[0]?.id ?? (await client.sessions.createSession({ userId })).id;

  const { jwt } = await client.sessions.getToken(sessionId, undefined, SESSION_TOKEN_TTL_SECONDS);

  // Fail loudly rather than silently driving an unauthenticated flow.
  const claims = await verifyToken(jwt, { secretKey });
  if (claims.sub !== userId) {
    throw new Error(
      `clerkSession: minted token is for ${String(claims.sub)} but ${userId} was requested`,
    );
  }

  const frontendApi = frontendApiFromPublishableKey(publishableKey);
  const devBrowserToken = await mintDevBrowserToken(frontendApi);

  return {
    userId,
    sessionId,
    token: jwt,
    devBrowserToken,
    clientUat: claims.iat,
  };
}

/**
 * Injects the minted Clerk session into a Playwright browser context so that
 * route-level `auth()` sees an authenticated user.
 *
 * Two things are needed together:
 *
 * 1. The three Clerk cookies (`__session`, `__clerk_db_jwt`, `__client_uat`)
 *    are written so the initial document navigation looks like a real signed-in
 *    session to middleware.
 * 2. Every same-origin `/api/personalization/**` request from the page also
 *    carries the session JWT as an `Authorization: Bearer` header.
 *
 * Step 2 is required because a document navigation on a Clerk *development*
 * instance goes through the Clerk handshake, which rewrites `__client_uat` to
 * `0`. That leaves the `__session` cookie unusable (`authenticateRequest`
 * then reports `session-token-but-no-client-uat`), and every API call the page
 * makes afterwards would 401. `authenticateRequest` reads a token present in
 * the Authorization header in preference to a cookie, so step 2 keeps the
 * authenticated route flow working after the handshake.
 *
 * Note on registration order: Playwright matches routes in reverse
 * registration order, so this MUST be registered before any `page.route` mock
 * in a spec — a mock registered later fulfils first and never reaches here,
 * which is exactly what is wanted for tests that stub the payload.
 */
export async function installClerkAuth(
  context: BrowserContext,
  page: Page,
  session: MintedClerkSession,
  baseUrl: string,
): Promise<void> {
  await applyClerkSessionCookies(context, baseUrl, session);
  await page.route(/\/api\/personalization\//, async (route) => {
    const headers = {
      ...route.request().headers(),
      authorization: `Bearer ${session.token}`,
    };
    await route.continue({ headers });
  });
}

/**
 * Injects the minted Clerk session into a Playwright browser context as the
 * three cookies Clerk requires for cookie-based auth on a dev instance.
 */
export async function applyClerkSessionCookies(
  context: BrowserContext,
  baseUrl: string,
  session: MintedClerkSession,
): Promise<void> {
  await context.addCookies([
    { name: '__session', value: session.token, url: baseUrl, httpOnly: true, sameSite: 'Lax', secure: false },
    { name: '__clerk_db_jwt', value: session.devBrowserToken, url: baseUrl, httpOnly: true, sameSite: 'Lax', secure: false },
    // Seconds, not milliseconds, and must be <= the session token's `iat`.
    { name: '__client_uat', value: String(session.clientUat), url: baseUrl, httpOnly: false, sameSite: 'Lax', secure: false },
  ]);
}
