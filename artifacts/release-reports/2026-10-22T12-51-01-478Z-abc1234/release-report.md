# Release diagnostic report

result: FAILED

> **RESULT: FAILED** — this release attempt did not succeed. Do not treat it as a passing release.

| Field | Value |
| --- | --- |
| Timestamp | 2026-10-22T12:51:02.907Z |
| Purpose | Business Asset Finder repair |
| Branch | fix/lead-finder |
| Git SHA | abc1234def5678 |
| Netlify site id | 76f606a3-8546-440f-8469-33a0236a8a23 |
| Netlify deploy id | none |
| Netlify deploy url | none |
| Failed stage | netlify-build |
| Failed stage exit code | 7 |
| Classification | netlify build stage exited 7 |
| Run directory | /Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/.kilo/worktrees/fix-the-lead-finder/artifacts/release-reports/2026-10-22T12-51-01-478Z-abc1234 |

## Deployment message

```
release: Business Asset Finder repair (branch fix/lead-finder, sha abc1234) — DRAFT do not promote
release: Business Asset Finder repair (branch fix/lead-finder, sha abc1234) — PRODUCTION promotion
```

## Stages

| # | Stage | Status | Exit code | Duration | Log |
| --- | --- | --- | --- | --- | --- |
| 1 | dependency-install | ok | 0 | 390ms | `/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/.kilo/worktrees/fix-the-lead-finder/artifacts/release-reports/2026-10-22T12-51-01-478Z-abc1234/logs/01-dependency-install.log` |
| 2 | application-build | ok | 0 | 739ms | `/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/.kilo/worktrees/fix-the-lead-finder/artifacts/release-reports/2026-10-22T12-51-01-478Z-abc1234/logs/02-application-build.log` |
| 3 | netlify-build | FAILED | 7 | 291ms | `/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/.kilo/worktrees/fix-the-lead-finder/artifacts/release-reports/2026-10-22T12-51-01-478Z-abc1234/logs/03-netlify-build.log` |

## Error output

Tail of stage `netlify-build` (exit code 7):

```
$ node /var/folders/2q/980_t4n950j58k8g6m2z4ps80000gn/T/tmp.8xuQjItWtj/failing-stage.mjs
Authorization: ***REDACTED*** ***REDACTED***
Failed during stage 'building site': Build script returned non-zero exit code: 2

```

## Root cause

**Classification:** netlify build stage exited 7

The Netlify site build exited 7. Netlify reports this as "Failed during stage 'building site'" with no build log, so the local netlify-build stage log is the only trace. Netlify reported the remote build failure with no build log; the same build failed locally in the netlify-build stage.

**Corrective action:**

Read the netlify-build stage log: it runs the same build command Netlify runs remotely (netlify.toml [build] command). Fix the first error, then re-run the release.

## Verification

Not verified — the pipeline did not reach preview verification.

## Notes

Production was NOT promoted: the production stage was skipped because no explicit authorization was given. This report covers a DRAFT deploy only.

