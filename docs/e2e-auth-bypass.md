# Local E2E auth bypass (Playwright)

Lets the browser test harness open `/personalization-demo` on a developer machine without a live Clerk instance.

**All** conditions must hold (`lib/e2eAuthBypass.js`, wired in `middleware.js` ahead of `clerkMiddleware`):

1. `NODE_ENV === 'development'` (never production/test builds)
2. `E2E_TEST_AUTH_BYPASS=true` in the dev server's environment
3. cookie `__e2e_auth_bypass` has the value `1`
4. hostname is `localhost`, `127.0.0.1` or `[::1]`, and the `Host` header agrees
5. no proxy signal: `forwarded`, `x-real-ip`, `x-original-host` absent; every `x-forwarded-for` entry is loopback and every `x-forwarded-host` is local (the Next dev server stamps loopback values on its own requests)
6. the path is in `E2E_BYPASS_ROUTES` (exact page paths, currently `/personalization-demo`; no API routes)

It authenticates nobody and does not touch API routes, entitlements, or likeness consent. Tests that need API data mock it inside Playwright; credit-free tests fail on any request to paid AI endpoints.

## Run

```bash
E2E_TEST_AUTH_BYPASS=true NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<dummy pk_test_ value> CLERK_SECRET_KEY=sk_test_dummy \
  npx next dev -H 127.0.0.1 --port 3111
```

Bind to loopback (`-H 127.0.0.1`) so the server is not reachable from other machines.

## Why production cannot activate it

`next build`/`next start` set `NODE_ENV=production`, which fails condition 1 before any other input is read. Unit tests (`tests/e2e-auth-bypass.vitest.test.ts`) cover every negative case.
