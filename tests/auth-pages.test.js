const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helpers -------------------------------------------------------------------

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
  const body = res.status === 0 ? '' : await res.text().catch(() => '');
  return { status: res.status, location: res.headers.get('location'), body };
}

// Skip the whole suite if no dev server is reachable so `npm test` does not
// hard-fail in environments where the app hasn't been started yet.
async function ensureServer() {
  try {
    const res = await fetch(`${BASE_URL}/sign-in`);
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}

// Public auth pages render ---------------------------------------------------

test('sign-in page renders', async (t) => {
  if (!(await ensureServer())) return t.skip(`dev server not reachable at ${BASE_URL}`);
  const { status, body } = await get('/sign-in');
  assert.equal(status, 200);
  assert.match(body, /Sign in to the studio/);
  // The sign-in form is rendered client-side after Clerk loads (the page
  // shows a skeleton while `isLoaded` is false), so we assert on the route's
  // compiled client chunk rather than post-hydration text. The sign-up test
  // below uses the same approach.
  assert.match(body, /app_sign-in_page/);
  assert.match(body, /min-h-screen/);
});

test('sign-up page is served and compiled', async (t) => {
  if (!(await ensureServer())) return t.skip(`dev server not reachable at ${BASE_URL}`);
  const { status, body } = await get('/sign-up');
  assert.equal(status, 200);
  // The sign-up form is rendered client-side after Clerk loads (the page
  // shows a skeleton while `isLoaded` is false), so we assert on the route's
  // compiled client chunk rather than post-hydration text.
  assert.match(body, /app_sign-up_page/);
  assert.match(body, /Create your studio account|min-h-screen bg-black/);
});

test('forgot-password page renders', async (t) => {
  if (!(await ensureServer())) return t.skip(`dev server not reachable at ${BASE_URL}`);
  const { status, body } = await get('/forgot-password');
  assert.equal(status, 200);
  assert.match(body, /Forgot your password/);
});

// Route protection -----------------------------------------------------------

test('protected /studio redirects unauthenticated users to /sign-in', async (t) => {
  if (!(await ensureServer())) return t.skip(`dev server not reachable at ${BASE_URL}`);
  const { status, location } = await get('/studio');
  assert.equal(status, 307);
  assert.ok(location, 'expected a redirect Location header');
  assert.match(location, /\/sign-in/);
});

test('protected /vfx redirects unauthenticated users to /sign-in', async (t) => {
  if (!(await ensureServer())) return t.skip(`dev server not reachable at ${BASE_URL}`);
  const { status, location } = await get('/vfx');
  assert.equal(status, 307);
  assert.match(location, /\/sign-in/);
});

// Unauthenticated API --------------------------------------------------------

test('whoami returns no user when unauthenticated', async (t) => {
  if (!(await ensureServer())) return t.skip(`dev server not reachable at ${BASE_URL}`);
  const { status, body } = await get('/api/auth/whoami');
  assert.equal(status, 200);
  const json = JSON.parse(body);
  assert.equal(json.userId, null);
  assert.equal(json.workspace, null);
});
