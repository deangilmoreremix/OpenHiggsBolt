---
name: First-login API key pop-up
area: studio
status: live
added: 2026-11-28
pr: deangilmoreremix/OpenHiggsBolt
route: Any studio, on first visit after sign-up
code:
  - components/StandaloneShell.js
  - lib/firstLoginKeyPrompt.js
---

## What it does
The "Welcome to SmartVideo GO" pop-up asks for your MuAPI key (and an optional OpenAI key) once, the first time a signed-in account has no key. Your key is saved to your account, so you are not asked again on other visits or devices.

## Where in the app
It opens by itself in any studio when your account has no MuAPI key. Studios that need a key can also open it, and Settings (gear icon) lets you change your keys at any time.

## Depends on
`GET/POST /api/auth/muapi-key` (keys stored encrypted in `app_users`), Clerk sign-in (`useAuth`).

## How to test
1. Sign in with an account that already saved a MuAPI key and reload any studio: no pop-up.
2. Sign in with an account that has a MuAPI key but no OpenAI key: no pop-up.
3. Sign in with a new account that has no key: the pop-up opens once; save a key, reload: no pop-up.
4. Open a public page (for example a shared workflow) signed out: no pop-up.
Unit test: `tests/first-login-key-prompt.vitest.test.js`.
