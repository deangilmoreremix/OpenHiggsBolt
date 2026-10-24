# P3-A — Persistence Contract Engineer — handoff (Wave 1)

**Agent:** P3-A · **Lane:** `persistence` · **Item:** 1
**Branch:** `feature/remotion-personalization-phase-2` @ pin `ef13ab9bc` · **Committed:** no (working tree)
**Dispatch note:** dispatched three times — twice interrupted, once by the harness, once by a
model-usage cap — the last two as background sessions. **The work is complete in the working tree**;
this handoff was written by the orchestrator after auditing the landed files, because the agent's
final responses were lost to the interruptions. E1 in reverse: the files WERE finished.

## Files changed (ownership ledger row only)

| File | Change |
|---|---|
| `src/shared/personalization/supabaseProjectPersistence.ts` | +339/−12 — row⇄state mapping (`projectStateFromRow`), request-shape guards, `listProjects`/`deleteProject` invariants |
| `app/api/personalization/project/route.ts` | +30/−2 — `sourceId` param, tolerant jsonb source filter, `sourceFilter` marker, `SOURCE_FILTER_UNAVAILABLE` log |
| `src/shared/personalization/DemoPersonalizeProvider.tsx` | **unchanged** — the `loadProject({ sourceId: src.id })` call site (line 1708) was already correct once the persistence layer sends `list=true&sourceId=…` |
| `src/shared/personalization/__tests__/projectPersistence.test.ts` | **new**, 426 lines, 16 tests |

**No other file touched** (`git status` below). No commit, no rebase, no deploy.

## 1. The evidence for the column location (not guessed)

`supabase/migrations/20261013000000_personalization_saved_projects.sql:45-61` — the table has five
**jsonb** columns (`source`, `client`, `assets`, `prompt`, `generation`) plus scalars. **There is no
top-level `sourceDemoId` column.** The first-cut filter (reading `row.sourceDemoId`) would have
dropped every row and silently disabled the restore — the same symptom as the 400, only quieter.
The demo id lives at `source->>'id'`.

`readSourceDemoId` (`app/api/personalization/project/route.ts:43`) reads, in order:
top-level `sourceDemoId` / `source_demo_id` (none today, forward-compat), then the `source` jsonb
object's `id`, `demoId`, `demo_id`, `sourceDemoId`, `source_demo_id`. The client's `projectStateFromRow`
probe set is **the same list in the same order**, with a comment in both files warning that drift
between the two is the failure mode.

## 2. The final request shape

| Call | URL issued | Server outcome |
|---|---|---|
| `loadProject({ sourceId: 'demo-1' })` | `GET /api/personalization/project?list=true&sourceId=demo-1` | 200 `{projects:[…]}` — filtered to that demo, or the full list if rows carry no source id (`sourceFilter:'unavailable'`), or `[]` |
| `loadProject({ projectId: 'proj-9' })` | `GET /api/personalization/project?id=proj-9` | 200 single project |
| `loadProject({})` / empty / whitespace id | **no fetch** | loud dev `console.error`, `{ok:false}` |
| route, no params at all | — | 400 `MISSING_PROJECT_ID` — now **unreachable from `loadProject`** |

The 400 of the bug report is gone from the modal-open path: the restore request always carries
`list=true&sourceId=…`, and the route answers it 200 in every case (matching row, no row, or
degraded list). The 400 branch remains only as server-side armour.

## 3. Raw validation output (orchestrator-run)

```
$ npx vitest run src/shared/personalization/__tests__/projectPersistence.test.ts --maxWorkers=1 --reporter=dot

················

 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  11:43:36
   Duration  4.25s

$ npx vitest run src/shared/personalization/__tests__/projectRestore.test.ts src/shared/personalization/__tests__/durableFieldRestore.test.tsx --maxWorkers=1 --reporter=dot

···········

 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  11:44:03
   Duration  11.41s

$ docs/phase3/validate.sh P3-A
== P3-A Persistence Contract ==
  PASS  projectPersistence.test.ts exists
  ....  loadProject still called with sourceId — check the persistence layer sends id/list
  PASS  server reads id/list params
  ....  route source filter does not read the jsonb source id — verify it is not filtering a non-existent column
  PASS  route reports whether the source filter was applied or unavailable
      Tests  16 passed (16)
P3-A: ALL CHECKS PASSED
```

Both `....` notes are informational and verified:
1. the `loadProject` call site keeps `sourceId` — correct, because the persistence layer now turns it
   into `list=true&sourceId` (proven by the request-shape test);
2. the validator's grep pattern does not match code that reads `sourceRecord['id']` — a **false
   negative of the grep heuristic**; the jsonb location IS read (see `readSourceDemoId` above).

Host at the time of the runs: load1 206 → 147 (elevated; a PASS is not affected by load, and both
runs were repeated inside `validate.sh`). Test durations 4.25–4.75 s — far from any worker timeout.

## 4. What the 16 tests lock in

`loadProject request shape`: sourceId → `list=true` + no `id` · projectId → `id` + no `list` · both →
projectId wins · a sweep over the guarded branches `{}`/empty/whitespace asserting **zero fetches** ·
happy paths assert the param · loud-guard behaviour (ok:false, no fetch, console.error) ·
`listProjects()` sends `list=true` · `deleteProject(id)` sends `id`, rejects a blank id without a
fetch.

`restore semantics`: a saved project restores with `sourceDemoId`/`originalPrompt`/
`personalizedPrompt`/`outputType` mapped from the row · a never-saved demo returns ok/empty · a row
with no source id is accepted in degraded mode **with a console.warn** · a row for a DIFFERENT source
is not restored.

`GET route`: empty RPC result → 200 `{projects:[]}`, never 400 · missing both params → 400
`MISSING_PROJECT_ID` (logged) · empty `id` alone still 400s · `list=true` alone 200s · the filter
keeps the matching row and drops the other(s), and reports `sourceFilter:'applied'` · rows with no
source id degrade to the unfiltered list and log `SOURCE_FILTER_UNAVAILABLE` · an `id` request
returns the single project.

## 5. Residuals

- **DB-side (documented, not blocking):** filtering happens route-side because the RPC
  `personalization_saved_projects_list` takes no source argument. Cutting it into SQL would
  require a migration (out of scope; `supabase/migrations/**` is not in the ownership ledger). The
  route-side filter is RLS-safe: the RPC already scopes rows to the authenticated user, so the
  additional filter cannot leak another user's row. Closing the residual = add a `p_source_id`
  argument to the function and filter in SQL.
- **`git status` (verified lane-clean):**

```
 M .gitignore                                        (P3-D)
 M app/api/personalization/project/route.ts          (P3-A)
 M packages/studio/src/components/MotionControlStudio.jsx   (P3-B)
 M src/apps/vfx-studio/components/ImageUrlModal.tsx  (P3-B)
 M src/apps/vfx-studio/pages/VFXGenerate.tsx         (P3-B)
 M src/shared/personalization/supabaseProjectPersistence.ts (P3-A)
 M src/shared/personalization/templates/typography.ts (P3-C)
?? src/shared/personalization/__tests__/projectPersistence.test.ts (P3-A)
```
- Pre-existing failure rule: no scope failed, so no baseline proof was needed.
