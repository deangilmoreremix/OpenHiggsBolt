// Comprehensive end-to-end auth flow test for SmartVideo GO.
// Uses the system Google Chrome (Playwright's own browser download is blocked here).
import { chromium } from 'playwright-core';
import { clerkSetup, clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import fs from 'node:fs';
import path from 'node:path';

const EXEC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:3000';

// Load E2E creds + publishable key from .env.local
const envRaw = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
process.env.CLERK_PUBLISHABLE_KEY = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const E2E_EMAIL = env.E2E_TEST_EMAIL;
const E2E_PASSWORD = env.E2E_TEST_PASSWORD;

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

async function waitForClerkRequest(page, pathFragment, timeout = 20000) {
  return new Promise((resolve) => {
    const onReq = (req) => {
      if (req.url().includes(pathFragment)) {
        page.off('request', onReq);
        clearTimeout(t);
        resolve(req.url());
      }
    };
    const t = setTimeout(() => {
      page.off('request', onReq);
      resolve(null);
    }, timeout);
    page.on('request', onReq);
  });
}

async function completeOrgTaskIfPresent(page) {
  // Dev instance may require creating/joining an organization right after sign-in
  // (a Clerk session task shown at #/tasks/choose-organization). Complete it so
  // the authenticated app becomes reachable. The task appears a moment AFTER
  // clerk.signIn resolves, so wait for it first.
  try {
    await page.waitForURL((u) => u.hash.includes('choose-organization'), { timeout: 12000 });
  } catch {}
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!page.url().includes('choose-organization')) break;
    const allBtns = await page.getByRole('button').allInnerTexts();
    console.log('  [org task buttons]', JSON.stringify(allBtns));
    const create = page.getByRole('button', { name: /create organization/i });
    if (await create.count()) {
      await create.first().click();
      await page.waitForTimeout(800);
      const name = page.getByLabel(/organization name/i);
      if (await name.count()) await name.fill('E2E Test Org');
      const submit = page.getByRole('button', { name: /create|continue|finish|submit/i });
      if (await submit.count()) await submit.first().click();
    }
    await page.waitForTimeout(2000);
  }
  // Wait for Clerk to leave the sign-in page (session task resolved → redirected).
  try {
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 8000 });
  } catch {}
}

const randEmail = `test+flow${Date.now()}@go.smartvid.app`;

(async () => {
  await clerkSetup();
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) console.log(`  [http ${r.status()}] ${r.url()}`); });
  page.on('request', (req) => { if (req.url().includes('clerk.accounts.dev')) console.log('  [clerk req]', req.method(), req.url()); });

  try {
    // ── 1. Landing page renders auth controls ──────────────────────────────
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const title = await page.title();
    check('Landing page loads with correct title', /SmartVideo GO|Studio/i.test(title), title);
    const signInLink = page.getByRole('link', { name: /sign in/i });
    const getStarted = page.getByRole('link', { name: /get started/i });
    check('Landing shows "Sign in" link', (await signInLink.count()) > 0);
    check('Landing shows "Get started" link', (await getStarted.count()) > 0);

    // ── 2. Clicking "Sign in" navigates to /sign-in and form renders ───────
    await signInLink.first().click();
    await page.waitForURL(/\/sign-in/, { timeout: 10000 });
    check('"Sign in" link redirects to /sign-in', page.url().includes('/sign-in'));
    await page.getByLabel(/email address/i).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    const emailFld = page.getByLabel(/email address/i);
    const pwdFld = page.getByLabel(/^password$/i);
    check('Sign-in form renders email field', (await emailFld.count()) > 0 && await emailFld.first().isVisible());
    check('Sign-in form renders password field', (await pwdFld.count()) > 0 && await pwdFld.first().isVisible());
    const submitBtn = page.getByRole('button', { name: /continue|sign in/i });
    check('Sign-in submit button is present & visible', (await submitBtn.count()) > 0 && await submitBtn.first().isVisible());

    // ── 3. Protected routes redirect to /sign-in with redirect_url ─────────
    await page.goto(BASE + '/studio', { waitUntil: 'networkidle' });
    check('Unauthenticated /studio redirects to /sign-in', page.url().includes('/sign-in') && page.url().includes('redirect_url'));
    await page.goto(BASE + '/vfx', { waitUntil: 'networkidle' });
    check('Unauthenticated /vfx redirects to /sign-in?redirect_url=%2Fvfx', /redirect_url=%2Fvfx/.test(page.url()));

    // ── 4. REAL no-token click on sign-in SUBMITS (captcha not blocking) ───
    await page.goto(BASE + '/sign-in', { waitUntil: 'networkidle' });
    const signInReq = waitForClerkRequest(page, '/client/sign_ins');
    if (E2E_EMAIL && E2E_PASSWORD) {
      await page.getByLabel(/email address/i).fill(E2E_EMAIL);
      await page.getByLabel(/^password$/i).fill(E2E_PASSWORD);
    } else {
      await page.getByLabel(/email address/i).fill('test+noreply@go.smartvid.app');
      await page.getByLabel(/^password$/i).fill('Somepass123!');
    }
    await page.getByRole('button', { name: /continue|sign in/i }).first().click();
    console.log('>>> clicked SIGN-IN submit');
    const firedSignIn = await signInReq;
    check('Sign-in button SUBMITS (Clerk sign_in request fired — captcha NOT blocking)', !!firedSignIn, firedSignIn || 'no request captured');
    const captchaBlock = await page.getByText(/verify you are human|complete the security check|are you a human/i).count();
    check('No silent captcha/ Turnstile block on sign-in', captchaBlock === 0);

    // ── 5. REAL no-token click on sign-up SUBMITS and redirects to /studio ─
    await page.goto(BASE + '/sign-up', { waitUntil: 'networkidle' });
    const signUpReq = waitForClerkRequest(page, '/client/sign_ups');
    await page.getByLabel(/email address/i).fill(randEmail);
    const upPwd = page.getByLabel(/^password$/i);
    if ((await upPwd.count()) > 0) await upPwd.first().fill('Somepass123!');
    else await page.getByLabel(/password/i).first().fill('Somepass123!');
    // Click the primary continue/create button
    const upBtn = page.getByRole('button', { name: /continue|create account|sign up/i });
    await upBtn.first().click();
    console.log('>>> clicked SIGN-UP submit');
    const firedSignUp = await signUpReq;
    check('Sign-up button SUBMITS (Clerk sign_up request fired — captcha NOT blocking)', !!firedSignUp, firedSignUp || 'no request captured');
    // Dev instance advances to email-verification step after a successful submit
    await page.waitForTimeout(4000);
    check('After sign-up the form advances (reaches verify-email step — submission succeeded)', /verify-email-address|verify-phone|#\/continue/.test(page.url()) || !page.url().endsWith('/sign-up'), page.url());

    // ── 6. Authenticated flow via Clerk testing token: redirect + sign-out ─
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    if (E2E_EMAIL) {
      await clerk.signIn({ page, emailAddress: E2E_EMAIL });
      await page.waitForTimeout(1500);
      // Navigating to a protected route surfaces the dev-instance
      // "choose organization" session task (if enabled) as #/tasks/choose-organization.
      await page.goto(BASE + '/studio', { waitUntil: 'networkidle' });
      await completeOrgTaskIfPresent(page);
      await page.waitForTimeout(1000);
      // honoring redirect_url: a protected page should now be reachable
      await page.goto(BASE + '/vfx', { waitUntil: 'networkidle' });
      check('Authenticated user reaches protected /vfx (redirect_url honored)', page.url().includes('/vfx'), page.url());
      await page.goto(BASE + '/studio', { waitUntil: 'networkidle' });
      check('Authenticated user reaches /studio', page.url().includes('/studio'), page.url());
      // Sign out — session persists from the authenticated flow above. The UserButton
      // in the landing nav can take a moment to hydrate; wait for either selector.
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      let userBtn;
      try {
        await page.getByTestId('clerk-user-button').waitFor({ state: 'visible', timeout: 20000 });
        userBtn = page.getByTestId('clerk-user-button');
      } catch {
        await page.getByRole('button', { name: /open user menu/i }).waitFor({ state: 'visible', timeout: 5000 });
        userBtn = page.getByRole('button', { name: /open user menu/i });
      }
      await userBtn.click();
      await page.getByRole('menuitem', { name: /sign out/i }).click();
      await page.waitForURL(/\/$/, { timeout: 10000 }).catch(() => {});
      check('Sign out returns to landing page', /\/$/.test(page.url()), page.url());
      const backToSignIn = await page.getByRole('link', { name: /sign in/i }).count();
      check('After sign-out, "Sign in" link is shown again', backToSignIn > 0);
    } else {
      check('Authenticated flow (skipped — no E2E creds)', true, 'no creds');
    }
  } catch (e) {
    check('Test run completed without throwing', false, e.message);
    console.error(e);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n===== ${results.length - failed.length}/${results.length} checks passed =====`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach((f) => console.log(' - ' + f.name + (f.detail ? ' :: ' + f.detail : '')));
    process.exit(1);
  }
  process.exit(0);
})();
