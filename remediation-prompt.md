# Remediation prompt — OpenHiggsBolt

Paste this into Claude Code (or any agent runner with subagent support) from the repo
root. It assumes `openhiggsbolt-audit-complete.md` is in the repo or attached.

---

You are the lead engineer on `deangilmoreremix/OpenHiggsBolt`, a Next.js 14 + Clerk +
Supabase + MuAPI creative studio. A security and code audit found 4 critical, 6 high,
8 medium and 7 low issues. Your job is to fix them by dispatching specialist subagents,
reviewing their work, and integrating it.

## PRIME DIRECTIVE — read twice

**This repo is a working product. Nothing a user can currently do may stop working.**

Every fix is **additive or corrective, never subtractive**. You are adding
authentication, scoping queries, and tightening policies — you are not removing
features, routes, studios, models, or UI.

Specifically, you must NOT:

- Delete or disable any route in `app/api/**`, any Netlify function, or any Netlify
  redirect
- Delete, rename or "consolidate" any component in `src/components/`,
  `src/apps/`, `packages/studio/`, or `components/`
- Remove any studio (Image, Video, Cinema, LipSync, Workflow, VFX, Design Agent,
  Storyboard, Thumbnail, Social Publishing) or any tab in `StandaloneShell.js`
- Remove entries from `models.js`, `models_dump.json`, or the VFX `ALLOWED_EFFECTS` list
- Drop a Supabase table, column, policy, or bucket. New migrations only — never edit a
  migration that has already been applied
- Remove `webSecurity: false` from the Electron config without a working replacement in
  the same commit
- Delete tests, or delete a test file because it fails
- Run `git rm`, `git clean`, `git reset --hard`, `git checkout .`, or force-push
- "Simplify" or "clean up" anything that was not named in the audit

If a fix appears to require removing something, **stop and write a proposal in your
report instead of doing it.** That includes cases where the audit itself suggested
removal — the audit was written to identify risk, not to authorize deletion.

Where the audit says "remove the five Netlify redirects," treat that as a fallback the
human may choose, not an instruction. **Your job is to make those endpoints safe while
keeping them working.** Same for the duplicated studio copies: report them, don't delete
them.

If a change is genuinely ambiguous, prefer the version that keeps more behaviour and
flag it.

## Step 0 — Baseline, before any edits

Capture the current state so regressions are provable, not guessed:

```bash
git checkout -b audit-remediation
mkdir -p .audit-baseline
npx tsc --noEmit                    > .audit-baseline/typecheck.txt 2>&1
npx next lint                       > .audit-baseline/lint.txt 2>&1
node --test tests/                  > .audit-baseline/tests.txt 2>&1
npm audit --json                    > .audit-baseline/audit.json 2>&1
git ls-files 'app/api/**/route.*' | sort > .audit-baseline/routes.txt
grep -oE '"[a-zA-Z]+"' netlify.toml | sort -u > .audit-baseline/netlify.txt
```

Known baseline (verify yours matches before trusting it):

- `tsc --noEmit` → **0 errors**. This must still be 0 when you finish.
- `next lint` → 85 errors, 106 warnings. Must not increase.
- `node --test tests/` → ~59 pass, 10 fail (`withRetry` ×4, `settings-modal` ×5,
  `api-keys-integration` ×1). Passing count must not decrease.
- `next build` currently FAILS on `Module not found: 'ai-agent'`. Agent 2 fixes this.
- 29 route files in `app/api`. This count must not decrease.

Also record every route path and every Netlify redirect. At the end you will diff these
lists and **any disappearance is a failure**.

## Step 1 — Answered. Do not ask.

**OpenHiggsBolt is BYOK.** Every user supplies their own MuAPI access key. Every
generation is billed to **that user's own MuAPI credit balance**. The operator's wallet
is never charged for user activity.

This is already partly built and correct — do not undo it:

- `app/api/auth/muapi-key/route.ts` stores each user's key against their Clerk account,
  encrypted at rest with AES-256-GCM (`src/lib/muapiKeyCrypto.ts`)
- `GET` returns the decrypted key to the signed-in owner, and `StandaloneShell.js`
  holds it in `localStorage` + a cookie. **Under BYOK this is by design.** The key
  belongs to the user; the blast radius of an XSS is that user's own key, not a shared
  operator key. Do not change this architecture.
- `StandaloneShell.js` already calls `getUserBalance(key)` from the studio package and
  renders the user's own MuAPI balance. Keep it. Extend it if anything, never remove it.

What BYOK means for the audit findings:

| Finding | Under BYOK |
|---|---|
| M2 — plaintext key reaches the browser | **Not a bug.** By design. Leave the architecture alone. |
| H4 — Bearer token bypasses Clerk in `getDesignAgentApiKey` | **Mostly fine.** A caller supplying a key is spending their own credits. Still add rate limiting so your infrastructure isn't the abuse vector. |
| H3 — server-key fallback in `vfx/*` | **Worse than the audit said.** See Agent 4. |
| C1, C2, C3 — Supabase exposure | **Completely unaffected.** These are database findings, not MuAPI findings. Still critical, still first. |
| C4 — `/api/v1` open relay | **Still a real problem**, but the cost is your bandwidth and domain reputation, not your credits. Fix it; it is no longer a financial emergency. |

---

## Agent 4 — REVISED (audit H3, H4)

Scope: `app/api/vfx/generate/route.ts`, `app/api/vfx/status/route.ts`,
`app/api/vfx/_helpers.ts`, `src/shared/api/vfx.ts`, `src/lib/keys.js`,
`app/api/design-agent/lib/auth.ts`.

**This is now the highest-value agent in Wave 2.** Five code paths fall back to an
operator-held key when the caller supplies none:

```
app/api/vfx/generate/route.ts:26   clientKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY
app/api/vfx/status/route.ts:14     clientKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY
app/api/vfx/_helpers.ts:2          process.env.MUAPI_API_KEY || process.env.MUAPI_KEY
src/shared/api/vfx.ts:308          apiKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY
src/lib/keys.js:38                 ... || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY
```

Under BYOK this directly contradicts the product model: a request with no `x-api-key`
generates on the operator's wallet, with no session check, no rate limit and no
accounting. Anonymous callers can spend the operator's credits.

**Do this — and note the Prime Directive carefully.** The fallback is a code path, not
a user-facing feature, but you still may not simply delete it. Instead:

1. Introduce one env flag, `ALLOW_SERVER_KEY_FALLBACK`, **defaulting to off**. When
   unset or `false`, the fallback does not fire and the route returns a clear 400:
   "Add your MuAPI key in settings to generate." When explicitly `true`, behaviour is
   exactly as it is today, so an operator who wants a shared demo key can still have one.
2. When the flag *is* on, require a valid Clerk session before the fallback is reached.
   Anonymous callers never touch the operator key under any configuration.
3. Leave the client-supplied `x-api-key` path **completely untouched**. That is the
   primary BYOK path and must behave identically before and after your change.
4. Add per-user rate limiting to the `vfx/*` routes. Reuse the in-memory limiter already
   written in `app/api/auth/muapi-key/route.ts` rather than inventing a second one.

For H4 (`getDesignAgentApiKey` accepting a Bearer token ahead of the Clerk check): under
BYOK the caller is spending their own credits, so keep the header path working. Add rate
limiting keyed on the presented credential so the routes can't be used to hammer MuAPI
through your domain.

Do not touch `_validation.ts`. Its allowlists are correct and complete.

**Report explicitly** on what happens to a signed-in user who has not yet saved a key.
The answer must be a clear prompt to add one — never a silent charge to the operator.

---

## Agent 1 — Clarification (audit C1)

Unchanged in substance. Note for the agent: the five Netlify functions talk to
**Supabase**, not MuAPI. BYOK has no bearing on them. They are still unauthenticated,
still use `SUPABASE_SERVICE_ROLE_KEY`, still set `Access-Control-Allow-Origin: '*'`, and
still expose every tenant's `brand_dna`. Fix exactly as originally briefed.

---

## Agent 6 — Clarification (audit H6)

`tests/api-keys.test.js`, `tests/muapiKeyCrypto.test.js` and `tests/muapi-key-route.test.js`
encode BYOK key-handling behaviour. When you fix the runner wiring, **do not "correct"
any test that asserts the key is returned to the client** — that assertion is right
under BYOK. Fix the collection problem only.

---

## New: Agent 10 — BYOK correctness pass

Add to Wave 2. No new features; this verifies the product model holds end to end.

1. Grep for every remaining read of `MUAPI_API_KEY` / `MUAPI_KEY` after Agent 4 lands.
   Each surviving one must be either behind `ALLOW_SERVER_KEY_FALLBACK` or in a test.
   List them in your report with a one-line justification each.
2. Confirm a signed-in user with no saved key sees an actionable prompt, not an error
   and not a silent operator-funded generation, in every studio.
3. Confirm the balance shown in `StandaloneShell.js` is the signed-in user's own MuAPI
   balance, and that it refreshes after a generation completes.
4. Confirm that clearing the key (`DELETE /api/auth/muapi-key`) leaves no usable copy
   behind — check `localStorage`, the `muapi_key` cookie, and `window.__MUAPI_KEY__`
   (referenced in `src/lib/muapi.js` and `src/shared/api/storyboard.ts`).
5. Write `docs/BYOK.md`: how a user obtains a MuAPI key, where it is stored, what is
   encrypted and what is not, who is billed for a generation, and what
   `ALLOW_SERVER_KEY_FALLBACK` does and why it defaults to off.

Point 4 matters because the key is written to three places on save and the delete path
must clear all of them. Verify, don't assume.

---

## Verification gate — one addition

Add to Step 3, run after Agent 4:

```bash
grep -rn "MUAPI_API_KEY\|MUAPI_KEY\b" app/ src/ --include=*.ts --include=*.js \
  | grep -v MUAPI_KEY_SECRET | grep -v ALLOW_SERVER_KEY_FALLBACK
```

Every line this returns must be justified in Agent 10's report. Unexplained operator-key
reads are how BYOK quietly becomes "the operator pays."

---

# Original Remediation Prompt

## Step 2 — Dispatch subagents

Run them in the waves below. Each returns a diff and a report; you review before merging.
Every agent must be told the Prime Directive verbatim.

### Wave 1 — Critical, parallel

**Agent 1 — Netlify function auth (audit C1)**
Scope: `netlify/functions/{brands,brand,campaigns,assets,photo-studio}.js`, `netlify.toml`.
Add Clerk session verification at the top of each handler and scope every Supabase query
by the resolved user or workspace. Replace `Access-Control-Allow-Origin: '*'` with the
app's own origin from an env var.
**Keep all five functions and all five redirects live.** Every request shape that works
today must still work for an authenticated caller. Return 401 for unauthenticated
callers, not 404.
Note: `brands.js` currently does an unscoped `.select('*')` on `brand_dna` — add the
tenant filter, do not narrow the returned columns.

**Agent 2 — Supabase RLS (audit C2, C3, M6)**
Scope: **new files in `supabase/migrations/` only.** Never edit an applied migration.
Write one new migration that replaces the permissive policies with scoped ones, using
`20260706150100_multi_tenant_rls.sql` as the template (`to authenticated` +
`current_clerk_user_id()`):
- `brand_dna`, `brand_campaigns`, `brand_assets`, `brand_photoshoots`, `brand_animations`
  — currently `for all using (true) with check (true)`
- `vfx-uploads` bucket — currently public read + public write; scope writes to
  authenticated users under an owner-prefixed path, keep reads working for already-
  uploaded assets
- `public.users` — currently `select using (true)` exposing every email; scope to self
  and shared-workspace members
Use `drop policy if exists` + `create policy` so it's idempotent and re-runnable.
Include a rollback migration alongside it.
**Do not drop tables, columns or buckets.** Existing rows must remain readable by their
legitimate owners — say in your report how you verified that.

**Agent 3 — `/api/v1` routing contradiction (audit C4, M4)**
Scope: `middleware.js`, `app/api/v1/[...slug]/route.ts`,
`app/api/api/v1/[[...path]]/route.js`.
The middleware rewrite (lines ~66–86) bypasses the route handler for every path except
`creative-agent`, `get_upload_url` and `upload-binary`, and runs with no session check.
Pick ONE path and add the auth gate to it. Preferred: keep the route handler, narrow the
middleware rewrite, since the handler already has timeouts and error sanitising.
**Every path that proxies successfully today must still proxy successfully for an
authenticated caller** — including the `/api/api/v1` double-prefix the AiAgent library
depends on. Extract a shared forwarder if it helps, but keep both entry paths mounted.

### Wave 2 — High, after Wave 1 review

**Agent 4 — VFX auth (audit H3, H4)**
Scope: `app/api/vfx/*`, `app/api/design-agent/lib/auth.ts`.
`vfx/generate` and `vfx/status` fall back to `process.env.MUAPI_API_KEY` with no session
check — anonymous requests spend your credits. Add a Clerk gate in front of the server-
key fallback. **Keep the client-supplied `x-api-key` path working exactly as-is** (BYOK
callers must not break). Apply the answer from Step 1 to whether the server fallback
survives at all.
Do not touch `_validation.ts` — the allowlists there are correct and complete.

**Agent 5 — Build and submodules (audit H1)**
Scope: submodules, `package.json`, `netlify.toml`.
`npx next build` fails with `Module not found: 'ai-agent'` because
`packages/Open-AI-Design-Agent` is uninitialized. Run
`git submodule update --init --recursive && npm run setup`, confirm the build passes,
and document what Netlify needs for submodule fetching.
This also fixes `withRetry.test.js` and `api-keys-integration.test.js`.
**Do not vendor, stub, or inline the submodule contents.** Do not remove the `ai-agent`
import to make the build pass.

**Agent 6 — Test runner (audit H6)**
Scope: `vitest.config.ts`, `package.json` scripts, the 3 failing test files.
Every file in `tests/` targets `node:test` but `vitest.config.ts` globs them in, so
vitest reports 14/16 "failed" when it simply can't collect them. Fix the wiring — either
exclude `tests/**` from vitest and run via `node --test`, or port the files.
Then fix the real failures: `settings-modal.test.js` (5 fail, `alert is not defined` —
add a jsdom pragma or stub `globalThis.alert`), and the two module-not-found files once
Agent 5 lands.
**Do not delete or skip a failing test.** `auth-pages.test.js` is empty and
`muapi-key-route.test.js` collects nothing — report these, leave them in place.

**Agent 7 — Dependencies (audit H5)**
Scope: `package.json`, `package-lock.json`.
Run `npm audit fix` (no `--force`) to clear the axios ReDoS and the five undici
advisories. Confirm typecheck, lint and tests are unchanged afterward.
**Do not run `npm audit fix --force`** — the Electron toolchain advisories need a
separate, tested upgrade. Report them; don't touch them.

### Wave 3 — Medium, after Wave 2 review

**Agent 8 — CSP and error hygiene (audit M1, M5)**
Remove `'unsafe-inline'` from `script-src` in `middleware.js` using Next.js nonces.
Keep `'unsafe-eval'` unless you prove nothing needs it. Verify every studio still
renders — a broken CSP fails silently in production, so test each tab.
Then sanitise the 10 routes returning raw `err.message` (all seven `design-agent/*`,
`v1/creative-agent`, `v1/[...slug]`, `auth/muapi-key`). Use the pattern already in
`app/api/api/v1/[[...path]]/route.js`: generic message to the client, detail to the log.
**Keep the 400-status validation messages user-visible** — those are actionable, not leaks.

**Agent 9 — Documentation, no code changes (audit M3, M7, M8, L3–L7)**
Write `.env.example` covering every variable referenced in the codebase
(`MUAPI_API_KEY`, `MUAPI_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `CLERK_WEBHOOK_SIGNING_SECRET`, and the rest — grep for
`process.env` and `Deno.env` to find them all). Values must be placeholders.
Then write `docs/CLEANUP-PROPOSALS.md` describing, **without performing**, the
duplication and hygiene items: the ~4,500 duplicated studio lines in `src/components/`
vs `packages/studio/`, the tracked `packages/studio/dist/`, `tsconfig.tsbuildinfo`, the
16 root screenshots, the 40 `console.log` calls, and the four parallel deploy configs.
For each: what it is, why it's a problem, what removing it would risk, and how to verify
nothing depends on it first.
**This agent writes no code and deletes nothing.**

## Step 3 — Verification gate

No wave merges until all of these hold:

```bash
npx tsc --noEmit                          # must be 0 errors
npx next lint 2>&1 | grep -c "Error:"     # must be <= 85
node --test tests/                        # passing count must be >= baseline
npx next build                            # must succeed after Agent 5
git ls-files 'app/api/**/route.*' | sort | diff - .audit-baseline/routes.txt
grep -oE '"[a-zA-Z]+"' netlify.toml | sort -u | diff - .audit-baseline/netlify.txt
```

The two `diff` commands must produce **no output**. Any removed route or redirect is a
failure — revert and re-approach.

Manual smoke test before declaring done. Sign in, then confirm each of these still
works: Image Studio generate, Video Studio generate, Cinema Studio, LipSync Studio,
Workflow Studio, VFX Studio, Design Agent, Storyboard, Thumbnail Studio, the settings
modal saving and clearing a MuAPI key, and an upload through the reference picker.

## Step 4 — Report

One commit per agent, message prefixed with the finding ID (`C1:`, `H3:`). Then produce
`docs/REMEDIATION-REPORT.md` with: what changed and why, per finding; anything you chose
not to do and the reason; the before/after verification output; a list of everything you
identified as removable but deliberately left in place; and any place where fixing one
finding would have broken a feature, and how you resolved it.

## Working style

Read before you write — this codebase has real subtlety in it (`muapiKeyCrypto.ts`,
the VFX validation allowlists, the `thumbnail` SSRF guard). Where you find code that
already does the right thing, leave it alone and say so.

When an instruction here conflicts with the Prime Directive, the Prime Directive wins.

<environment_details>
Current time: 2026-08-10T23:09:23-04:00
Working directory: /Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt
Workspace root folder: /Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt
</environment_details>
