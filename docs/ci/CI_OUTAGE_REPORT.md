# CI Outage Report — repo-wide GitHub Actions failure

**Status:** DIAGNOSED (read-only analysis). **No fix applied.**
**Repository:** `deangilmoreremix/OpenHiggsBolt` (public, default branch `main`)
**Analyzed branch:** `feature/remotion-personalization-phase-2` @ `84a9d1586` (pinned baseline)
**Agent:** A2 — CI Triage Analyst (Wave 1)
**Date:** 2026-10-21
**Ownership:** `docs/ci/CI_OUTAGE_REPORT.md` (this file) + `docs/phase2/handoffs/A2.md`.
`.github/**` was **not** modified. The patches below are **proposals only**.

---

## 1. Root cause (one sentence)

**The GitHub account that owns the repository is locked out of GitHub Actions for a billing
reason, so GitHub refuses to allocate a runner for *any* job — every workflow in the repo
fails in 3–5 seconds with zero steps executed, before a single line of workflow code runs.**

The exact annotation GitHub attaches to every failing job:

```
The job was not started because your account is locked due to a billing issue.
```

This is an **account-level, out-of-repo** condition. It is not a bug in any workflow file,
not a bug in the repository, and not caused by the Phase 1/2 diffs.

---

## 2. Impact surface

| Scope | Affected |
|---|---|
| All workflows in this repo | Yes — 4 distinct workflow names observed failing identically |
| All branches / all open PRs | Yes — PRs #62, #63, #64 and every prior PR |
| Scheduled runs | Yes — `Upstream Sync` (schedule), `Upstream Sync Monitor` (schedule), `MUAPI Catalog Sync` (schedule) |
| Push-to-`main` runs | Yes — `Production Studio Acceptance Tests` (push) |
| Other repositories owned by the same account | **Yes** (the lock is account-scoped, not repo-scoped) |
| Phase 1/2 code | **No** — no code was ever executed |

### Run inventory — the entire recorded history of the repository

| Metric | Value |
|---|---|
| Total workflow runs in repo history | **612** (pages 1–7 of `actions/runs`) |
| Runs with conclusion `success` | **0** |
| Runs that ever got a **runner** (`steps > 0`) | **1** (run `38418902330`, 2026-10-13T15:04:35Z) |
| Distinct workflows observed | `SmartVideo GO Personalization CI`, `SmartVideo GO Personalization E2E`, `Upstream Sync`, `Upstream Sync Monitor`, `MUAPI Catalog Sync`, `Production Studio Acceptance Tests` |

---

## 3. Raw evidence

### 3.1 The failing annotation, via the CLI (run `39496203903` = PR #62, Phase 1)

Note `head_sha` of this run is `84a9d1586ee448ae81f941780c7fd5c6b9ec99c6` — **the pinned
baseline itself**. The failure is therefore provably independent of any diff.

```
$ gh run view 39496203903

X feature/remotion-personalization-phase-1 SmartVideo GO Personalization CI deangilmoreremix/OpenHiggsBolt#62 · 39496203903
Triggered via pull_request about 6 hours ago

JOBS
X Image Editor Typecheck, Tests and Build in 4s (ID 118881771706)

ANNOTATIONS
X The job was not started because your account is locked due to a billing issue.
Image Editor Typecheck, Tests and Build: .github#1

- "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026. For more information, see https://github.com/actions/runner-images/issues/14748"
Image Editor Typecheck, Tests and Build: .github#1


To see what failed, try: gh run view 39496203903 --log-failed
View this run on GitHub: https://github.com/deangilmoreremix/OpenHiggsBolt/actions/runs/39496203903
```

### 3.2 The same annotation, raw REST

```
$ gh api repos/deangilmoreremix/OpenHiggsBolt/check-runs/<id>/annotations
[{"path":".github","blob_href":"https://github.com/deangilmoreremix/OpenHiggsBolt/blob/84a9d1586ee448ae81f941780c7fd5c6b9ec99c6/.github","start_line":1,"start_column":null,"end_line":1,"end_column":null,"annotation_level":"failure","title":"","message":"The job was not started because your account is locked due to a billing issue.","raw_details":""},{"path":".github","blob_href":"https://github.com/deangilmoreremix/OpenHiggsBolt/blob/84a9d1586ee448ae81f941780c7fd5c6b9ec99c6/.github","start_line":1,"start_column":null,"end_line":1,"end_column":null,"annotation_level":"notice","title":"","message":"\"The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026. For more information, see https://github.com/actions/runner-images/issues/14748\"","raw_details":""}]
```

`annotation_level: "failure"` — this is a hard failure emitted by the Actions service, not a
notice, and it is attached to the **job**, not to any step.

### 3.3 Step counts across 10 runs (all workflows, all branches, both events)

```
$ for id in 39537261252 39537261283 39496203903 39496203772 39260537818 39199091117 \
           38408213025 38404278282 38339144357 38418902330; do
    gh api "repos/.../actions/runs/$id/jobs" --jq '.jobs[] | "name=\(.name) | conclusion=\(.conclusion) | steps=\(.steps|length) | runner=\(.runner_name // "NONE") | labels=\(.labels|join(","))"'
  done
--- run 39537261252 ---
name=Image Editor Typecheck, Tests and Build | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
--- run 39537261283 ---
name=Personalization E2E Tests | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
--- run 39496203903 ---
name=Image Editor Typecheck, Tests and Build | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
--- run 39496203772 ---
name=Personalization E2E Tests | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
--- run 39260537818 ---
name=Image Editor Typecheck, Tests and Build | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
--- run 39199091117 ---
name=sync | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
name=validate-scope | conclusion=skipped | steps=0 | runner=NONE | labels=ubuntu-latest
--- run 38408213025 ---
name=Check Upstream Changes | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
name=Sync Changes & Create PR | conclusion=skipped | steps=0 | runner=NONE | labels=ubuntu-latest
--- run 38404278282 ---
name=Fetch & Detect Changes | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
name=Endpoint Health Report | conclusion=skipped | steps=0 | runner=NONE | labels=ubuntu-latest
name=Create Sync PR | conclusion=skipped | steps=0 | runner=NONE | labels=ubuntu-latest
name=Critical Change Alert | conclusion=skipped | steps=0 | runner=NONE | labels=ubuntu-latest
--- run 38339144357 ---
name=Production Studio Acceptance | conclusion=failure | steps=0 | runner= | labels=ubuntu-latest
--- run 38418902330 ---
name=Production Studio Acceptance | conclusion=failure | steps=11 | runner=GitHub Actions 1000003056 | labels=ubuntu-latest
```

Two things to read out of this table:

1. `steps=0` and `runner=` (empty) on **every** failing job → **no runner was ever assigned**,
   therefore no step could ever start. This is a *dispatch/allocation* failure.
2. Jobs whose `if:` condition evaluated false are reported as `conclusion=skipped`
   (`validate-scope`, `Sync Changes & Create PR`, `Endpoint Health Report`, …), **not**
   `failure`. The failing jobs are genuinely `failure`.

### 3.4 Exhaustive scan — all 612 runs in the repository's history

Every run was queried for the number of executed steps. A job that reached a runner always
reports `steps > 0` (see `38418902330` → 11). The result:

```
$ # all 612 runs, paged, then queried for step count
runs scanned:      612
runs with steps>0: 1
38418902330 11
```

**One run in the entire history of the repository ever obtained a runner** — and that run
(`38418902330`, `Production Studio Acceptance Tests`, push to `main`, 2026-10-13T15:04:35Z)
got a runner, then failed for a *completely different, ordinary* reason:

```
$ gh api repos/.../actions/runs/38418902330/jobs --jq '.jobs[0].steps[] | "\(.number). \(.name) => \(.conclusion)"'
1. Set up job => success
2. Checkout repository => success
3. Setup Node.js => success
4. Install dependencies => failure
5. Install Playwright browsers => skipped
6. Run production studio acceptance tests => skipped
7. Upload Playwright report => success
8. Upload authentication state => success
15. Post Setup Node.js => skipped
16. Post Checkout repository => success
17. Complete job => success
```

That is a real dependency-install failure inside a job that *did* start — categorically
different from the 3-second, zero-step dispatch failures.

### 3.5 Conclusion distribution

```
$ gh run list --limit 200 --json conclusion --jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})'
[{"conclusion":"failure","count":200}]

$ # pages 1..7 of the REST API (612 runs)
success count over 612 runs: 0
```

**The repository has never produced a green workflow run.** The failure predates the Phase 1
branch by a wide margin.

### 3.6 The oldest runs in the repository already carry the same annotation

```
$ # run 35369253390 — 2026-09-18, "Production Studio Acceptance Tests", push to main
failure: The job was not started because your account is locked due to a billing issue.
notice: "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026. For more information, see https://github.com/actions/runner-images/issues/14748"

$ # run 38323954511 — 2026-10-12, "SmartVideo GO Personalization CI", pull_request
failure: The job was not started because your account is locked due to a billing issue.
notice: "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026. ..."
```

The `ubuntu-latest → Ubuntu 26` item is a **notice** and it is present on the *oldest* run
in the repository (2026-09-18) — long before the 2026-10-19 migration date and long before
the first observed failure. It is a global informational notice, retroactively attached by
GitHub, and it is **not** the cause. (See §4, alternative 5.)

### 3.7 Repository configuration — everything Actions-related is *enabled*

```
$ gh api repos/deangilmoreremix/OpenHiggsBolt/actions/runners
{"total_count":0,"runners":[]}

$ gh api repos/deangilmoreremix/OpenHiggsBolt/actions/permissions
{"enabled":true,"allowed_actions":"all","sha_pinning_required":false}

$ gh api repos/deangilmoreremix/OpenHiggsBolt/actions/permissions/workflow
{"default_workflow_permissions":"read","can_approve_pull_request_reviews":false}

$ gh api users/deangilmoreremix --jq '{login,type}'
{"login":"deangilmoreremix","type":"User"}

$ gh api orgs/deangilmoreremix/actions/permissions
{"message":"Not Found", ... ,"status":"404"}
```

`total_count: 0` is the *self-hosted* runner list. GitHub-hosted runners (`ubuntu-latest`)
are never listed there, so this is expected and irrelevant. The owner is a **personal
account**, so there is no org-level Actions policy that could be responsible.

### 3.8 Billing API is not readable with the current token

```
$ gh api /users/deangilmoreremix/settings/billing/actions
{"message":"Not Found", ... ,"status":"404"}
gh: This API operation needs the "user" scope. To request it, run:  gh auth refresh -h github.com -s user
```

The billing state itself is only visible to the account owner in the web UI. The *lock*,
however, is already proven by the annotation text and by the zero-runner behaviour.

### 3.9 The `paths` filter is NOT the problem — the runs were created

```
$ gh api repos/.../actions/runs/39496203903 --jq '{id,name,event,head_branch,head_sha,path,...}'
{"actor":"deangilmoreremix","attempt":1,"conclusion":"failure","created_at":"2026-10-20T20:56:04Z",
 "event":"pull_request","head_branch":"feature/remotion-personalization-phase-1",
 "head_sha":"84a9d1586ee448ae81f941780c7fd5c6b9ec99c6",
 "id":39496203903,"name":"SmartVideo GO Personalization CI",
 "path":".github/workflows/personalization-image-editor-ci.yml", ...}
```

A run object exists and a job object exists. A `paths` filter that did not match would have
produced **no run at all**.

### 3.10 All three workflow files parse cleanly and are byte-identical to `origin/main`

```
$ python3 -c "import yaml,glob; [print('OK', f, list(yaml.safe_load(open(f))['jobs'])) for f in sorted(glob.glob('.github/workflows/*.yml'))]"
OK .github/workflows/personalization-e2e.yml  ['personalization-e2e']
OK .github/workflows/personalization-image-editor-ci.yml  ['image-editor']
OK .github/workflows/upstream-sync.yml  ['validate-scope', 'sync']

$ # blob SHA: local worktree vs origin/main
personalization-e2e.yml             | local=c4ddada2c0b81f989d5cccdbfa2c10085eadc97f | origin/main=c4ddada2c0b81f989d5cccdbfa2c10085eadc97f | identical=YES
personalization-image-editor-ci.yml | local=326f9cb75ba3e723eb7ef7e2dd3eedb99cdff1ae | origin/main=326f9cb75ba3e723eb7ef7e2dd3eedb99cdff1ae | identical=YES
upstream-sync.yml                   | local=797f74e75ae3dd94f907a2b6909d2b4cc52886ed | origin/main=797f74e75ae3dd94f907a2b6909d2b4cc52886ed | identical=YES

$ git diff --stat 84a9d1586 origin/main -- .github/
(empty — .github/ is identical between the pinned Phase-1 baseline and origin/main)
```

### 3.11 The repository owner already diagnosed this exact failure and removed the workflows

Commit `d3267cee9` (2026-10-13, author `deanellgilmore`) — *"chore(ci): retire GitHub Actions
— Netlify is the build and deployment gate"* — removed all eight workflow files, and its
message quotes the **identical** annotation:

```
    the two pull_request workflows (`personalization-e2e.yml`,
    `personalization-image-editor-ci.yml`) both **fail in ~2 seconds having
    executed zero steps**, because the runner never starts

        "The job was not started because your account is locked due to a billing
         issue."

    so the PR's `mergeStateStatus` reads UNSTABLE even though the real gate —
    the Netlify deploy — is green. Meanwhile `main` has **no branch protection**
    and the repository has **zero rulesets**, so those checks were never
    enforced; they only produced noise.
```

The files were **re-introduced afterwards** by commit `28a1c96d9` (2026-10-14, *"Complete
in-browser branded render, export UI, persistence guards and certification tests"*), which
re-added `personalization-e2e.yml` and `personalization-image-editor-ci.yml`; `upstream-sync.yml`
came back through a merge. `origin/main` today carries all three again.

`git log --oneline --diff-filter=AD --follow -- .github/workflows/personalization-e2e.yml`:

```
28a1c96d9 Complete in-browser branded render, export UI, persistence guards and certification tests
d3267cee9 chore(ci): retire GitHub Actions — Netlify is the build and deployment gate
7b5c20b0d ci(personalization): add regression-protected personalization test workflows
```

So this is a **regression of a deliberate, already-made decision**, not a new fault.

### 3.12 The red checks are not actually enforcing anything

```
$ gh api repos/deangilmoreremix/OpenHiggsBolt/branches/main/protection
{"message":"Branch not protected", ... ,"status":"404"}

$ gh api repos/deangilmoreremix/OpenHiggsBolt/rulesets
[]

$ gh pr view 62 --json number,mergeStateStatus,mergeable,statusCheckRollup
{"mergeable":"MERGEABLE","mergeStateStatus":"UNSTABLE",
 "checks":[{"name":"Image Editor Typecheck, Tests and Build","conclusion":"FAILURE","status":"COMPLETED"},
           {"name":"Personalization E2E Tests","conclusion":"FAILURE","status":"COMPLETED"},
           {"name":"Macroscope - Correctness Check","conclusion":"SKIPPED","status":"COMPLETED"},
           {"name":null,"conclusion":null,"status":null},
           {"name":"Kilo Code Review","conclusion":"SUCCESS","status":"COMPLETED"}]}

$ gh pr view 64 --json number,mergeStateStatus,mergeable
{"mergeable":"MERGEABLE","mergeStateStatus":"UNSTABLE", ...}
```

`main` has **no branch protection** and the repo has **zero rulesets**. The failing checks
are therefore **advisory only** — they mark the PR `UNSTABLE` in the UI but they do **not**
block a merge. The "blocking every open PR" framing is a UI signal, not a hard gate.

### 3.13 Billing: zero minutes consumed

```
$ gh api repos/.../actions/runs/38418902330/timing
{"billable":{"UBINTU":...},"run_duration_ms":70000}
{"billable":{"UBUNTU":{"total_ms":0,"jobs":1,"job_runs":[{"job_id":115370638370,"duration_ms":0}]}},"run_duration_ms":70000}
```

`total_ms: 0` — the job is registered as billable but consumes zero minutes because it never
started. This is the signature of a lock, not of exhausted-but-running minutes.

---

## 4. Candidate causes, ranked

### 1. ✅ CONFIRMED — Account locked out of GitHub Actions for a billing issue

**Supporting evidence**
- The literal GitHub annotation on every failing job:
  `"The job was not started because your account is locked due to a billing issue."`
  (levels `failure`), §3.1 / §3.2.
- `steps = 0` and `runner_name = ""` on every failing job across 10 sampled runs and all
  612 runs in history — the job never reached a runner, so no workflow code could run.
  §3.3, §3.4.
- It affects **all six** workflow names, **all** branches, **all** events
  (`pull_request`, `push`, `schedule`, `workflow_dispatch`), and the **oldest** run in the
  repository (2026-09-18). §3.3, §3.6.
- The account owner already recorded this exact diagnosis in commit `d3267cee9`. §3.11.
- The owner is a personal account (`type: "User"`), so a personal billing state
  (failed payment card, exhausted free minutes, an unpaid invoice) is the direct cause.
- Billable minutes consumed = 0. §3.13.

**What would have refuted it** — and did not
- If it were a code/dependency failure, at least one step would appear. None does, ever.
- If it were a YAML/parse error, no *job* would be created (or the check would say
  "invalid workflow file"). Jobs are created and are attributed to the correct commit
  (`head_sha: 84a9d1586…`, `path: .github/workflows/personalization-image-editor-ci.yml`).
- If it were a `paths`-filter miss, no run would exist. Runs exist. §3.9.
- If it were a skip due to `if:`, the conclusion would be `skipped`. It is `failure`. §3.3.

### 2. ❌ RULED OUT — Missing / mismatched self-hosted runner label

**Supporting** — `gh api .../actions/runners` returns `{"total_count":0,"runners":[]}`, and a
job with no matching runner would fail exactly like this.

**Refuting** — all three workflows declare `runs-on: ubuntu-latest`, a **GitHub-hosted**
label. GitHub-hosted runners are *never* listed in the self-hosted runner API, so
`total_count: 0` is the expected, healthy state. Decisive: the one run that did obtain a
runner (`38418902330`) used `labels: ubuntu-latest` with
`runner_name: "GitHub Actions 1000003056"` — a GitHub-hosted runner, allocated fine.
§3.3, §3.4. **No runner registration is required.**

### 3. ❌ RULED OUT — Read-only `GITHUB_TOKEN` / `default_workflow_permissions: read`

**Supporting** — the repo's default workflow permission *is* `read`, and the task brief
flagged this as a classic cause.

**Refuting** — a token-permission problem fails *inside* a step (`actions/checkout` 403s, or
`gh pr create` 403s), which means the job **starts** and `steps > 0`. Every failing job has
`steps = 0` and no runner. Additionally, `permissions` are irrelevant to the two
personalization workflows (they declare no `permissions:` block, and only
`upstream-sync.yml` uses `secrets.GITHUB_TOKEN`, in a *late* step, and it never reached
that step). Decisive: the failing run `39496203903` is on the **pinned baseline** commit.
§3.1, §3.3.

### 4. ❌ RULED OUT — `if:` conditions recording a skip as a failure

**Supporting** — `upstream-sync.yml` has two mutually exclusive `if:` guards
(`github.event_name == 'push'` / `!= 'push'`).

**Refuting** — GitHub reports a condition-false job as `conclusion: skipped`, and we can see
exactly that in the same runs: `validate-scope` → `skipped`, `Sync Changes & Create PR` →
`skipped`, `Endpoint Health Report` → `skipped`, `Create Sync PR` → `skipped`,
`Critical Change Alert` → `skipped`. The failing job is reported as `conclusion: failure`
with a `failure`-level annotation. Different states, clearly distinguished in the same
response. §3.3.

### 5. ❌ RULED OUT — `ubuntu-latest` → Ubuntu 26 label migration (2026-10-19)

**Supporting** — GitHub attaches the notice to the failing checks, and the migration date
(2026-10-19) is close to the observed failure window (first observed 2026-10-12/13).

**Refuting** — it is a `notice`, not a `failure`, and it is attached to runs from
**2026-09-18**, i.e. GitHub back-fills it retroactively. More decisively, the first
observed failures predate the migration by a week, and the one run that got a runner
(`2026-10-13`) used `ubuntu-latest` successfully. §3.6.
*Forward-looking note:* when the migration lands, `ubuntu-latest` will resolve to Ubuntu 26;
if any workflow depends on Ubuntu 24 behaviour it will need pinning to `ubuntu-24.04`.
That is a **future** risk, not the current outage.

### 6. ❌ RULED OUT — Invalid YAML / workflow parse error

**Supporting** — a malformed workflow fails at dispatch, before steps.

**Refuting** — all three files parse cleanly under PyYAML and expose the expected job
structure (§3.10); the runs and jobs are created and attributed to the correct commit and
workflow path (§3.9); and a parse error produces an "Invalid workflow file" annotation,
not "account is locked due to a billing issue". §3.1, §3.2.

### 7. ❌ RULED OUT — Fork PR pending approval

**Supporting** — a PR from a fork awaiting a maintainer's approval sits un-started.

**Refuting** — a fork PR awaiting approval produces `conclusion: action_required` on the
*run* and a *pending* job, never a completed `failure` with zero steps. All runs here are
`completed`/`failure`, `actor == triggering_actor == deangilmoreremix`, and every head
branch lives in the same repository (`git ls-remote --heads origin` shows all of them).
§3.9, §3.12.

### 8. ❌ RULED OUT — `concurrency` group cancellation

**Supporting** — a `concurrency` group can cancel an in-flight run.

**Refuting** — **none of the three workflow files contains a `concurrency:` key** (verified by
reading all three files in full and by the YAML key dump in §3.10). A cancelled run would
report `conclusion: cancelled`, not `failure`. §3.10.

### 9. ❌ RULED OUT — `paths` filter not matching the changed files

**Supporting** — the task brief raised it; the workflows do use `paths:` filters.

**Refuting** — a `paths` filter that does not match produces **no run and no job**. Here the
run exists, the job exists, and `run.path` is the expected workflow file. The Phase-1
baseline commit `84a9d1586` touches `src/shared/personalization/**`, which is inside both
filters, and the run fired. §3.9.

---

## 5. Remediation plan

There are **two independent axes**. The repo can stop showing red *without* billing being
fixed (Axis A); billing must be fixed for CI to actually *run* (Axis B).

### Axis A — repository change (optional; removes the red immediately)

The owner already made this decision on 2026-10-13 in commit `d3267cee9`: **Netlify is the
build and deployment gate; GitHub Actions is not used.** The workflows were re-added
afterwards by `28a1c96d9`, which re-created the outage without anyone intending to.

**Recommended — Patch A1: re-apply the owner's decision (delete the three workflows).**

This is the smallest change that restores the repository to a state its owner already chose
and documented. It matches `origin/main`'s intent, and given that `main` has **no branch
protection** and **zero rulesets**, nothing is lost: the checks were never enforced.

```diff
diff --git a/.github/workflows/personalization-e2e.yml b/.github/workflows/personalization-e2e.yml
deleted file mode 100644
index c4ddada2c..000000000
--- a/.github/workflows/personalization-e2e.yml
+++ /dev/null
@@ -1,145 +0,0 @@
-name: SmartVideo GO Personalization E2E
-
-on:
-  pull_request:
-    paths:
-      - 'e2e/personalization-live.spec.ts'
-      - 'e2e/personalization-image-editor-certification.spec.ts'
-      - 'src/shared/personalization/**'
-      - 'app/personalization-demo/**'
-      - 'app/api/personalization/**'
-      - 'playwright.shared.ts'
-      - 'playwright.config.ts'
-      - 'e2e/global.setup.ts'
-      - '.github/workflows/personalization-e2e.yml'
-  workflow_dispatch:
-
-jobs:
-  personalization-e2e:
-    name: Personalization E2E Tests
-    runs-on: ubuntu-latest
-    timeout-minutes: 60
-
-    steps:
-      - name: Checkout
-        uses: actions/checkout@v4
-        with:
-          submodules: recursive
-
-      - name: Setup Node.js
-        uses: actions/setup-node@v4
-        with:
-          node-version: '20'
-          cache: 'npm'
-
-      - name: Install dependencies
-        run: npm ci --ignore-scripts
-
-      - name: Initialize required package submodules
-        id: submodules
-        continue-on-error: true
-        shell: bash
-        run: |
-          set -o pipefail
-          git submodule update --init \
-            packages/Open-AI-Design-Agent \
-            packages/Open-Poe-AI \
-            packages/Vibe-Workflow \
-            2>&1 | tee /tmp/smartvideo-go-submodules.log
-
-      - name: Install Playwright browsers
-        run: npx playwright install --with-deps chromium
-
-      - name: Start Next.js dev server
-        id: dev-server
-        shell: bash
-        run: |
-          npx next dev --port 3111 --turbopack > /tmp/next-dev.log 2>&1 &
-          echo $! > /tmp/next-dev.pid
-          for i in $(seq 1 60); do
-            if curl -sf http://localhost:3111 > /dev/null 2>&1; then
-              echo "Dev server ready after ${i}0s"
-              exit 0
-            fi
-            sleep 10
-          done
-          echo "::error::Dev server did not become ready within 600s"
-          exit 1
-
-      - name: Run personalization-live tests
-        id: live-tests
-        continue-on-error: true
-        shell: bash
-        run: |
-          echo "ran" > /tmp/live-status.txt
-          set -o pipefail
-          npx playwright test e2e/personalization-live.spec.ts \
-            --config=playwright.config.ts \
-            --reporter=list \
-            --trace=on-first-retry \
-            --video=on-first-retry \
-            2>&1 | tee /tmp/personalization-live.log
-
-      - name: Run personalization image editor certification
-        id: cert-tests
-        continue-on-error: true
-        env:
-          E2E_CLERK_USER_EMAIL: ${{ secrets.E2E_CLERK_USER_EMAIL }}
-          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
-          CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
-          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
-          NEXT_PUBLIC_CLERK_SECRET_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_SECRET_KEY }}
-        shell: bash
-        run: |
-          if [ -z "${{ secrets.E2E_CLERK_USER_EMAIL }}" ] || [ -z "${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}" ] || [ -z "${{ secrets.CLERK_SECRET_KEY }}" ]; then
-            echo "skipped" > /tmp/cert-status.txt
-            echo "::warning::Skipping image editor certification: required secrets are not configured."
-            exit 0
-          fi
-          echo "ran" > /tmp/cert-status.txt
-          set -o pipefail
-          npx playwright test e2e/global.setup.ts \
-            --config=playwright.config.ts \
-            --reporter=list \
-            --trace=on-first-retry \
-            --video=on-first-retry \
-            2>&1 | tee /tmp/personalization-auth-setup.log
-          npx playwright test e2e/personalization-image-editor-certification.spec.ts \
-            --config=playwright.config.ts \
-            --reporter=list \
-            --trace=on-first-retry \
-            --video=on-first-retry \
-            2>&1 | tee /tmp/personalization-cert.log
-
-      - name: Upload Playwright artifacts
-        if: always()
-        uses: actions/upload-artifact@v4
-        with:
-          name: personalization-e2e-artifacts
-          path: |
-            playwright-report/
-            test-results/
-            /tmp/personalization-live.log
-            /tmp/personalization-auth-setup.log
-            /tmp/personalization-cert.log
-            /tmp/next-dev.log
-            /tmp/smartvideo-go-submodules.log
-          if-no-files-found: warn
-          retention-days: 7
-
-      - name: Enforce E2E gate
-        if: always()
-        shell: bash
-        run: |
-          echo "live-tests=${{ steps.live-tests.outcome }}"
-          echo "cert-tests=${{ steps.cert-tests.outcome }}"
-          test "${{ steps.live-tests.outcome }}" = "success"
-          CERT_STATUS=$(cat /tmp/cert-status.txt 2>/dev/null || echo "unknown")
-          if [ "$CERT_STATUS" = "ran" ]; then
-            test "${{ steps.cert-tests.outcome }}" = "success"
-          elif [ "$CERT_STATUS" = "skipped" ]; then
-            echo "::notice::Certification tests were skipped (secrets not configured)."
-          else
-            echo "::error::Unknown certification test status."
-            exit 1
-          fi
diff --git a/.github/workflows/personalization-image-editor-ci.yml b/.github/workflows/personalization-image-editor-ci.yml
deleted file mode 100644
index 326f9cb75..000000000
--- a/.github/workflows/personalization-image-editor-ci.yml
+++ /dev/null
@@ -1,139 +0,0 @@
-name: SmartVideo GO Personalization CI
-
-on:
-  pull_request:
-    paths:
-      - 'src/shared/personalization/**'
-      - 'src/shared/api/openaiImage.ts'
-      - 'app/api/personalization/**'
-      - 'app/personalization-demo/**'
-      - 'tests/personalization-*.vitest.test.ts'
-      - 'src/shared/personalization/__tests__/**'
-      - '.github/workflows/personalization-image-editor-ci.yml'
-  workflow_dispatch:
-
-jobs:
-  image-editor:
-    name: Image Editor Typecheck, Tests and Build
-    runs-on: ubuntu-latest
-    timeout-minutes: 30
-
-    steps:
-      - name: Preflight
-        shell: bash
-        run: |
-          echo "runner-started" > /tmp/smartvideo-go-preflight.log
-
-      - name: Checkout
-        id: checkout
-        continue-on-error: true
-        uses: actions/checkout@v4
-        with:
-          submodules: false
-
-      - name: Setup Node.js
-        id: setup_node
-        continue-on-error: true
-        uses: actions/setup-node@v4
-        with:
-          node-version: '20'
-          cache: 'npm'
-
-      - name: Record setup outcomes
-        if: always()
-        shell: bash
-        run: |
-          echo "checkout=${{ steps.checkout.outcome }}" >> /tmp/smartvideo-go-preflight.log
-          echo "setup_node=${{ steps.setup_node.outcome }}" >> /tmp/smartvideo-go-preflight.log
-
-      - name: Initialize required package submodules
-        id: submodules
-        continue-on-error: true
-        shell: bash
-        run: |
-          set -o pipefail
-          git submodule update --init \
-            packages/Open-AI-Design-Agent \
-            packages/Open-Poe-AI \
-            packages/Vibe-Workflow \
-            2>&1 | tee /tmp/smartvideo-go-submodules.log
-
-      - name: Install dependencies
-        id: install
-        continue-on-error: true
-        shell: bash
-        run: |
-          set -o pipefail
-          npm ci --ignore-scripts 2>&1 | tee /tmp/smartvideo-go-install.log
-
-      - name: Typecheck
-        id: typecheck
-        continue-on-error: true
-        shell: bash
-        run: |
-          set -o pipefail
-          npm run typecheck 2>&1 | tee /tmp/smartvideo-go-typecheck.log
-
-      - name: Run personalization unit tests
-        id: tests
-        continue-on-error: true
-        shell: bash
-        run: |
-          set -o pipefail
-          npx vitest run \
-            src/shared/personalization/__tests__/DemoPersonalizeProvider.test.tsx \
-            src/shared/personalization/__tests__/PersonalizationModal.test.tsx \
-            src/shared/personalization/__tests__/PersonalizationPR31Regression.test.tsx \
-            src/shared/personalization/__tests__/ImageEditorModal.test.tsx \
-            src/shared/personalization/__tests__/imageEditRegistry.test.ts \
-            src/shared/personalization/__tests__/responsesVisionApi.test.ts \
-            src/shared/personalization/__tests__/promptPersonalizerVision.test.ts \
-            src/shared/personalization/__tests__/DiscoveredAssets.test.tsx \
-            src/shared/personalization/__tests__/modelCapabilityResolver.test.ts \
-            src/shared/personalization/__tests__/postProcessor.test.ts \
-            src/shared/personalization/__tests__/batchVideoReady.test.ts \
-            tests/personalization-image-edit.vitest.test.ts \
-            tests/personalization-responses-vision.vitest.test.ts \
-            2>&1 | tee /tmp/smartvideo-go-tests.log
-
-      - name: Build
-        id: build
-        continue-on-error: true
-        shell: bash
-        run: |
-          set -o pipefail
-          npm run build 2>&1 | tee /tmp/smartvideo-go-build.log
-
-      - name: Upload diagnostics
-        if: always()
-        uses: actions/upload-artifact@v4
-        with:
-          name: smartvideo-go-image-editor-diagnostics
-          path: |
-            /tmp/smartvideo-go-preflight.log
-            /tmp/smartvideo-go-submodules.log
-            /tmp/smartvideo-go-install.log
-            /tmp/smartvideo-go-typecheck.log
-            /tmp/smartvideo-go-tests.log
-            /tmp/smartvideo-go-build.log
-          if-no-files-found: warn
-          retention-days: 3
-
-      - name: Enforce release gate
-        if: always()
-        shell: bash
-        run: |
-          echo "checkout=${{ steps.checkout.outcome }}"
-          echo "setup_node=${{ steps.setup_node.outcome }}"
-          echo "submodules=${{ steps.submodules.outcome }}"
-          echo "install=${{ steps.install.outcome }}"
-          echo "typecheck=${{ steps.typecheck.outcome }}"
-          echo "tests=${{ steps.tests.outcome }}"
-          echo "build=${{ steps.build.outcome }}"
-          test "${{ steps.checkout.outcome }}" = "success"
-          test "${{ steps.setup_node.outcome }}" = "success"
-          test "${{ steps.submodules.outcome }}" = "success"
-          test "${{ steps.install.outcome }}" = "success"
-          test "${{ steps.typecheck.outcome }}" = "success"
-          test "${{ steps.tests.outcome }}" = "success"
-          test "${{ steps.build.outcome }}" = "success"
diff --git a/.github/workflows/upstream-sync.yml b/.github/workflows/upstream-sync.yml
deleted file mode 100644
index 797f74e75..000000000
--- a/.github/workflows/upstream-sync.yml
+++ /dev/null
@@ -1,240 +0,0 @@
-name: Upstream Sync
-
-on:
-  push:
-    branches:
-      - parity/upstream-full-2026-09-02
-    paths:
-      - .github/workflows/upstream-sync.yml
-  schedule:
-    - cron: '0 0 * * 1'
-  workflow_dispatch:
-
-permissions:
-  contents: read
-  pull-requests: read
-
-jobs:
-  validate-scope:
-    if: github.event_name == 'push'
-    runs-on: ubuntu-latest
-    permissions:
-      contents: read
-    steps:
-      - name: Checkout branch
-        uses: actions/checkout@v4
-        with:
-          persist-credentials: false
-
-      - name: Verify SmartVideo exclusions
-        shell: bash
-        run: |
-          set -euo pipefail
-          test ! -f packages/studio/src/components/McpCliStudio.jsx
-          test ! -f packages/studio/src/messages/en/mcpCliStudio.json
-          grep -Fq "redirect('/studio/image')" app/studio/mcp-cli/page.js
-          if git grep -niEi 'white[-_ ]?label|whitelabel' -- components/StandaloneShell.js src/apps/design-agent app/api/design-agent; then
-            echo "::error::White-label logic detected in active SmartVideo product code."
-            exit 1
-          fi
-
-  sync:
-    if: github.event_name != 'push'
-    runs-on: ubuntu-latest
-    timeout-minutes: 60
-    permissions:
-      contents: write
-      pull-requests: write
-    steps:
-      - name: Checkout maintained branch
-        uses: actions/checkout@v4
-        with:
-          fetch-depth: 0
-          token: ${{ secrets.GITHUB_TOKEN }}
-
-      - name: Configure Git
-        run: |
-          git config user.name "github-actions[bot]"
-          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
-
-      - name: Fetch upstream
-        run: |
-          git remote remove upstream 2>/dev/null || true
-          git remote add upstream https://github.com/Anil-matcha/Open-Generative-AI.git
-          git fetch upstream main --tags
-
-      - name: Check for upstream changes
-        id: check
-        shell: bash
-        run: |
-          set -euo pipefail
-          SYNC_POINT=$(cat .upstream-sync 2>/dev/null || echo none)
-          UPSTREAM_HEAD=$(git rev-parse upstream/main)
-          echo "sync_point=$SYNC_POINT" >> "$GITHUB_OUTPUT"
-          echo "upstream_head=$UPSTREAM_HEAD" >> "$GITHUB_OUTPUT"
-          if [ "$SYNC_POINT" = "$UPSTREAM_HEAD" ]; then
-            echo "has_changes=false" >> "$GITHUB_OUTPUT"
-            echo "No new upstream commits since $SYNC_POINT"
-          else
-            echo "has_changes=true" >> "$GITHUB_OUTPUT"
-            echo "New upstream commits: $SYNC_POINT..$UPSTREAM_HEAD"
-          fi
-
-      - name: Create sync branch
-        if: steps.check.outputs.has_changes == 'true'
-        shell: bash
-        run: |
-          set -euo pipefail
-          SYNC_BRANCH="sync-upstream-$(date +%Y%m%d)-${GITHUB_RUN_ID}"
-          echo "SYNC_BRANCH=$SYNC_BRANCH" >> "$GITHUB_ENV"
-          git checkout -b "$SYNC_BRANCH"
-
-      - name: Merge upstream without committing
-        if: steps.check.outputs.has_changes == 'true'
-        id: merge
-        shell: bash
-        run: |
-          set +e
-          git merge upstream/main --no-commit --no-ff
-          merge_exit=$?
-          set -e
-          echo "merge_exit=$merge_exit" >> "$GITHUB_OUTPUT"
-
-      - name: Fail on non-conflict merge errors
-        if: steps.check.outputs.has_changes == 'true'
-        shell: bash
-        run: |
-          set -euo pipefail
-          merge_exit="${{ steps.merge.outputs.merge_exit }}"
-          if [ "$merge_exit" -ne 0 ] && [ -z "$(git diff --name-only --diff-filter=U)" ]; then
-            echo "::error::Upstream merge failed without merge conflicts."
-            exit "$merge_exit"
-          fi
-
-      - name: Preserve SmartVideo-owned product surfaces
-        if: steps.check.outputs.has_changes == 'true'
-        shell: bash
-        run: |
-          set -euo pipefail
-          for path in \
-            middleware.js \
-            clerkAppearance.js \
-            packages/studio/src/persistKey.js \
-            components/StandaloneShell.js \
-            messages/en/common.json \
-            packages/studio/src/index.js \
-            packages/studio/src/components/AppsStudio.jsx \
-            packages/studio/src/components/AppsStudio.test.jsx \
-            packages/studio/src/components/McpCliStudio.jsx \
-            packages/studio/src/messages/en/appsStudio.json \
-            packages/studio/src/messages/zh/appsStudio.json \
-            packages/studio/src/messages/en/McpCliStudio.json \
-            packages/studio/src/messages/zh/McpCliStudio.json \
-            packages/studio/src/i18nUtils.js \
-            components/StandaloneShell.scope.test.js \
-            app/studio/apps \
-            app/studio/mcp-cli \
-            app/sign-in \
-            app/sign-up \
-            app/forgot-password \
-            app/api/webhooks \
-            app/api/auth \
-            app/api/design-agent \
-            app/api/photo-studio \
-            app/api/storyboard \
-            app/api/thumbnail \
-            app/api/vfx \
-            app/api/brand \
-            app/api/brands \
-            app/api/workspace \
-            supabase \
-            src/apps \
-            apps/cutai \
-            e2e \
-            tests; do
-            if git cat-file -e "HEAD:$path" 2>/dev/null; then
-              git checkout HEAD -- "$path"
-            fi
-          done
-
-          # Remove locale-bridge surfaces that must not exist on SmartVideo.
-          # NOTE: packages/studio/src/messages/zh is intentionally NOT removed —
-          # 12 studio components statically import zh message bundles at build
-          # time (including AppsStudio.jsx), so deleting the directory breaks
-          # `next build`. SmartVideo ships no Chinese *route* (app/zh), which is
-          # asserted by components/StandaloneShell.scope.test.js.
-          git rm -rf --ignore-unmatch \
-            app/zh \
-            messages/zh
-
-          WHITE_LABEL_PATHS=$(git ls-files | grep -Ei '(^|/)(white[-_]?label|whitelabel)(/|\.|$)' || true)
-          if [ -n "$WHITE_LABEL_PATHS" ]; then
-            while IFS= read -r path; do
-              [ -n "$path" ] && git rm -rf --ignore-unmatch "$path"
-            done <<< "$WHITE_LABEL_PATHS"
-          fi
-
-          if git grep -niEi 'white[-_ ]?label|whitelabel' -- components/StandaloneShell.js src/apps/design-agent app/api/design-agent 2>/dev/null; then
-            echo "::error::White-label logic detected in active SmartVideo product code."
-            exit 1
-          fi
-
-      - name: Fail on unresolved conflicts
-        if: steps.check.outputs.has_changes == 'true'
-        shell: bash
-        run: |
-          set -euo pipefail
-          CONFLICTS=$(git diff --name-only --diff-filter=U)
-          if [ -n "$CONFLICTS" ]; then
-            echo "::error::Manual parity resolution required for these files:"
-            echo "$CONFLICTS"
-            exit 1
-          fi
-
-      - name: Commit protected sync
-        if: steps.check.outputs.has_changes == 'true'
-        shell: bash
-        run: |
-          set -euo pipefail
-          NEW_SYNC_POINT=$(git rev-parse upstream/main)
-          printf '%s\n' "$NEW_SYNC_POINT" > .upstream-sync
-          git add -A
-          if git diff --cached --quiet; then
-            echo "No protected sync changes to commit."
-          else
-            git commit -m "chore: protected upstream sync to $NEW_SYNC_POINT"
-          fi
-
-      - name: Push sync branch and open review PR
-        if: steps.check.outputs.has_changes == 'true'
-        shell: bash
-        env:
-          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
-        run: |
-          set -euo pipefail
-          BASE_BRANCH="$GITHUB_REF_NAME"
-          git push origin "$SYNC_BRANCH"
-
-          {
-            echo "## Automated Upstream Sync"
-            echo
-            echo "- Sync point: $(cat .upstream-sync)"
-            echo "- Previous: ${{ steps.check.outputs.sync_point }}"
-            echo "- Target branch: $BASE_BRANCH"
-            echo
-            echo "### SmartVideo scope"
-            echo "- Explore Apps remains protected as a SmartVideo-owned surface"
-            echo "- MCP / CLI remains excluded"
-            echo "- White-label product layers remain excluded"
-            echo "- SmartVideo-owned auth, studios, personalization and Design Agent remain authoritative"
-            echo
-            echo "### Review"
-            echo "- Review the diff before merge"
-            echo "- Run release validation before production integration"
-          } > /tmp/upstream-sync-pr.md
-
-          gh pr create \
-            --title "sync: protected upstream $(date +%Y-%m-%d)" \
-            --body-file /tmp/upstream-sync-pr.md \
-            --base "$BASE_BRANCH" \
-            --head "$SYNC_BRANCH"
```

**Full, unabridged patch:** the complete 533-line deletion patch was generated and
**validated** against the current worktree with `git apply --check` (result: *"OK: patch
applies cleanly (pure deletion, no content change)"*; `3 files changed, 524 deletions(-)`).
It is reproduced verbatim in `docs/phase2/handoffs/A2.md` §"Remediation patches" so the
orchestrator can apply it verbatim. It was **not applied** here.

**Alternative — Patch A2: keep the files, stop triggering doomed runs on PRs.**

If the owner wants the workflows preserved for manual use after billing is fixed, restrict
the two PR-triggered workflows to `workflow_dispatch` only. The files stay, the red on every
PR disappears, and the scheduled `upstream-sync` run remains (cosmetic; it does not gate
PRs):

```diff
--- a/.github/workflows/personalization-e2e.yml
+++ b/.github/workflows/personalization-e2e.yml
@@ -1,17 +1,6 @@
 name: SmartVideo GO Personalization E2E
 
 on:
-  pull_request:
-    paths:
-      - 'e2e/personalization-live.spec.ts'
-      - 'e2e/personalization-image-editor-certification.spec.ts'
-      - 'src/shared/personalization/**'
-      - 'app/personalization-demo/**'
-      - 'app/api/personalization/**'
-      - 'playwright.shared.ts'
-      - 'playwright.config.ts'
-      - 'e2e/global.setup.ts'
-      - '.github/workflows/personalization-e2e.yml'
   workflow_dispatch:
 
 jobs:
--- a/.github/workflows/personalization-image-editor-ci.yml
+++ b/.github/workflows/personalization-image-editor-ci.yml
@@ -1,15 +1,6 @@
 name: SmartVideo GO Personalization CI
 
 on:
-  pull_request:
-    paths:
-      - 'src/shared/personalization/**'
-      - 'src/shared/api/openaiImage.ts'
-      - 'app/api/personalization/**'
-      - 'app/personalization-demo/**'
-      - 'tests/personalization-*.vitest.test.ts'
-      - 'src/shared/personalization/__tests__/**'
-      - '.github/workflows/personalization-image-editor-ci.yml'
   workflow_dispatch:
 
 jobs:
```

Both patched files were re-validated with PyYAML after the edit:
`OK /tmp/.../personalization-e2e.yml triggers= {'workflow_dispatch': None}` and
`OK /tmp/.../personalization-image-editor-ci.yml triggers= {'workflow_dispatch': None}`.

> **Unverified hedge (do not rely on it without testing):** adding a job-level
> `continue-on-error: true` to the two jobs *might* neutralise the check, because the
> billing refusal is recorded as a job conclusion. This was **not** executed and **not**
> verified — the billing refusal occurs before the job body runs, and GitHub's behaviour
> here is not documented. It is listed for completeness only. Patch A2 does not depend on
> it.

**Recommendation:** Patch A1 if the owner reaffirms the Netlify-only model (which their own
commit message already does); Patch A2 if the workflows are wanted back once billing is
fixed. Either way, **A1/A2 is optional** if the owner prefers to fix billing first and
simply live with red checks in the meantime (they are advisory — §3.12).

### Axis B — human action, outside the repository (required for CI to actually run)

**No code change can make a GitHub-hosted job start while the account is billing-locked.**
A human account owner must clear the lock on the personal account `deangilmoreremix`:

1. Open **<https://github.com/settings/billing>** while signed in as `deangilmoreremix`
   (or <https://github.com/settings/billing/summary>).
2. Resolve whichever of these is shown:
   - **A failed or expired payment method** → update the card / re-verify the billing
     address and save. This is the most common cause of "your account is locked due to a
     billing issue".
   - **An unpaid invoice** → pay it.
   - **Free-plan minutes exhausted / spending limit reached** → either raise the Actions
     spending limit, purchase a paid plan (Pro/Team), or buy GitHub Actions minutes
     (or set a non-zero spending limit for Actions).
   - **Account flagged for an unusual payment / verification required** → complete GitHub's
     identity/verification prompts.
3. Confirm the lock is cleared by re-running a workflow manually
   (`gh workflow run personalization-image-editor-ci.yml`) or by
   `gh api repos/.../actions/runs/<new-id>/jobs` showing `steps > 0`.
4. Note that **the lock is account-wide**: it also blocks every other repository owned by
   `deangilmoreremix`, and it blocks GitHub Pages/Codespaces/Actions artifacts.

**No self-hosted runner registration is needed** (all workflows target `ubuntu-latest`,
a GitHub-hosted label; §4 alternative 2). **No org policy change is needed** — the owner is
a personal account, and the repository's Actions permissions are already
`{"enabled":true,"allowed_actions":"all"}` (§3.7).

**No change to `netlify.toml`, `package.json`, lock files, or `origin/main` is required or
recommended by this report.**

---

## 6. Verdict — is the CI red pre-existing and independent of the Phase 1/2 diffs?

**YES. Unambiguously pre-existing and completely independent of the Phase 1/2 work.**

| Proof | Evidence |
|---|---|
| The failing run ran on the **pinned baseline commit itself** | run `39496203903` has `head_sha: 84a9d1586ee448ae81f941780c7fd5c6b9ec99c6` (§3.1, §3.9) |
| The failure predates the Phase 1 branch by 8 days | oldest failing runs are 2026-09-18 / 2026-10-12 / 2026-10-13, all with the same annotation (§3.6) |
| It hits **unrelated branches** | `integrate/muapi-upload-release-v2` (`39260537818`), `feat/expand-demo-library-categories`, `fix/find-business-and-assets`, `shotcraft-motion-library`, `fix/personalization-release-blockers`, `adding-preview-to-personalization-modal`, `feat/free-landing-discovery`, `intergration-worktree` (§3.3) |
| It hits **unrelated workflows and events** | `pull_request`, `push` to `main`, `schedule`, `workflow_dispatch` — 6 distinct workflow names (§3.3) |
| It hits **pushes to `main`**, which contain no Phase 1/2 code at all | `Production Studio Acceptance Tests` (push, `main`) and the two scheduled syncs (§3.3) |
| The **entire 612-run history** has zero successful runs and exactly **one** runner allocation | §3.4, §3.5 |
| The **workflow files are byte-identical** between the baseline and `origin/main` | `git diff --stat 84a9d1586 origin/main -- .github/` → empty; blob SHAs match (§3.10) |
| The owner had already **diagnosed and mitigated** this exact condition on 2026-10-13 | commit `d3267cee9` quotes the identical annotation and removed all eight workflows (§3.11) |

**Therefore:** no agent in Wave 1 or Wave 2 should attempt to "fix" CI by changing
application code, test files, or the workflow YAML. There is nothing in the diff to fix. The
correct action is a **billing action by the account owner** (Axis B), optionally combined
with a **repository change** to re-affirm the owner's own Netlify-only decision (Axis A).

**Note on the Phase-2 branch specifically:** `feature/remotion-personalization-phase-2` is
**not pushed to `origin`** and has **no open PR**, so it has **no CI runs of its own**:

```
$ git ls-remote --heads origin feature/remotion-personalization-phase-2
(empty)
$ gh run list --limit 100 --json headBranch --jq '.[] | select(.headBranch|test("phase-2"))'
(empty)
```

The red checks being discussed belong to the sibling PRs **#62 (Phase 1)**, **#63**, and
**#64**.

---

## 7. Blast radius of this analysis

- **Files created:** `docs/ci/CI_OUTAGE_REPORT.md` (this file), `docs/phase2/handoffs/A2.md`.
- **Files modified:** **none** other than the two above.
- **`.github/**`:** read only. No workflow file was edited, added, or deleted. The patches in
  §5 are **proposals** and were validated with `git apply --check` (read-only) only.
- **`src/**`:** read only. Nothing under `src/` was touched.
- **No build, no tests, no Playwright** were run (no build lock was taken or needed — this
  is a pure API/analysis task).
- **No rebase, no reset, no commit, no merge, no deploy.**
- **`origin/main`, `netlify.toml`, `package.json`, lock files:** untouched.
- The `git apply --check` validation and the 612-run scan were performed with a **temporary
  index file** (`GIT_INDEX_FILE=/tmp/a2_tmp_index`) and read-only REST calls; the
  repository's real index and working tree were not modified.
