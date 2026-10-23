# Motion Studio Completion — Multi-Agent Workflow Design

A workflow for identifying, analyzing, and completing all pending/incomplete
tasks on a repository, with defined roles, sequencing, communication
protocol, and completion verification. It is the design that was actually
used (and refined through failures) on this repo, generalized.

---

## 0. Ground rules that decide success

1. **"Interrupted" ≠ "failed".** A sub-agent whose tool call is cut off may
   still be running and may still land its work. Before re-dispatching,
   check the shared board and the worktree (`git status`, log files).
2. **One exclusive owner per resource.** Nothing corrupts results faster
   than `next build` and a Playwright run in the same worktree, or two
   agents editing one file.
3. **Fan-out ≤ 2, and never two build/browser agents at once.** Free-tier
   sub-agent models rate-limit hard (5 req/min) and long-running agents get
   their parent tool call severed.
4. **Every agent must run its own verification and report exit codes.**
   A report without a command + exit status is an opinion.

---

## 1. Roles

| Agent | Persona | Owns | Produces |
|---|---|---|---|
| **Task Auditor** | Skeptical reviewer. Verifies claims against the actual code with grep/read; trusts no prior report. | Read-only audit of every requirement → a gap list with `file:line` evidence, each gap marked PARTIAL/FAIL. | Gap register (G1…Gn), each with: symptom, root cause, exact work needed. |
| **Planner** | Sequencer. Decomposes gaps into non-overlapping work packages; assigns file ownership; orders the DAG by resource dependency. | The plan: work packages, agent assignments, resource tokens, gates. | Work-package briefs + a coordination contract. |
| **Executor ×N** | Specialist. Implements one work package; verifies its own work; reports command + exit code. | One work package; a named file set. | Code + proof (tests, measurements, screenshots). |
| **Gatekeeper** | QA. Runs the full verification suite independently of the Executors; refuses "weakened assertions". | Test suites, lint, type-check, build. | Pass/fail matrix with counts, plus defect list. |
| **Release Engineer** | Infra. Owns packaging, deploy pipeline, and the deploy artifact; validates the artifact end-to-end (not just "HTTP 200"). | Deploy config, artifact verification script. | Deployed preview + verification output. |
| **Orchestrator (main agent)** | Coordinator. Owns the git index, the shared board, sequencing, and the final report. Never implements. | Git index, gates, board. | Final report + decision requests. |

---

## 2. Phases and sequencing

```
Phase 0  Groundwork (Orchestrator)
         · Free disk / env headroom (builds fail at 100% disk)
         · Kill stale processes; single clean state
         · Confirm baseline: tsc, build, test suite green count

Phase 1  AUDIT (Task Auditor, read-only, 1 agent)
         · Requirements R1..Rn vs actual code
         · Output: gap register with evidence
         GATE A1 → gap register accepted by Orchestrator

Phase 2  PLAN (Planner)
         · Decompose gaps into non-overlapping work packages
         · Assign file ownership (no two agents touch one file)
         · Sequence: independent packages parallel, shared-file packages serial
         GATE P1 → briefs published to shared board

Phase 3  EXECUTE (Executors, ≤2 concurrent)
         · Independent packages in parallel; shared-file packages serial
         · Each Executor: implement → self-verify → report
         GATE E1 → all work packages reported

Phase 4  VERIFY (Gatekeeper)
         · Independent full-suite run; no trust in Executor claims
         · Classify failures: real defect vs environment artifact
         GATE V1 → pass/fail matrix

Phase 5  RELEASE (Release Engineer)
         · Build artifact → deploy → END-TO-END artifact check
         · The check must validate what the artifact actually serves
           (every asset the SSR HTML references), not the build tree
         GATE R1 → deployed artifact verified

Phase 6  REPORT (Orchestrator)
         · Final verdict table, remaining blockers, commit
```

---

## 3. Communication protocol

### 3.1 Artifacts of record (not chat)
* **Shared board** — agents post `RESULT` / `HOLD` / `ASK` / `INFO` with
  evidence. The Orchestrator collects results from the board, never from a
  lost chat turn.
* **Gate files** on a shared path (`…/gates/phase1.done`) — a phase may only
  start when its dependency gate exists.
* **Resource tokens** (`…/locks/next_dev.lock`,
  `…/locks/next_build.lock`) — acquire before touching a resource; release
  after. A build rewriting the build output directory while a dev server or
  a test run holds it produces *false* failures that look like product bugs.

### 3.2 Report contract
Every agent's final message must contain, for each claim:
* the exact command,
* the exit status,
* the measured output (counts, sizes, hashes).

A claim without a command is rejected.

### 3.3 Handoff rules
* Executor → Gatekeeper: file list changed + how to verify.
* Gatekeeper → Orchestrator: pass/fail matrix + defect list with root cause.
* Orchestrator → Executor (rework): the defect, the file set, and what NOT
  to change (to prevent clobbering completed work).
* Release Engineer → Orchestrator: deployed URL + artifact verification
  output + explicit "still unproven" list.

### 3.4 Defect protocol
* A failing test is classified first: **real defect** vs **environment
  artifact** (disk full, server down, concurrent build).
* Real defects go back to an Executor with a minimal patch brief.
* Assertions are never weakened to make a suite pass.

---

## 4. Validation protocols (what "done" means)

| Layer | Protocol |
|---|---|
| Types | `tsc --noEmit` → 0 errors |
| Units | Targeted suite green; full-suite delta vs pristine HEAD explained |
| Browser | Full Playwright suite, one file at a time, server health-checked before and after each file |
| Artifact | Deployed artifact checked against what it actually serves: every `<script src>` / `<link href>` in the SSR HTML → 200; bundle contains the feature |
| Preview | Authenticated run of the real user flow on the deployed preview |

---

## 5. Failure playbook (learned the hard way)

| Symptom | Likely cause | Response |
|---|---|---|
| Sub-agent "interrupted" | Harness cut the parent tool call; agent may still be running | Check board + worktree; never blindly re-dispatch |
| Fan-out all failed at once | Model rate limit | Cap concurrency; retry single |
| Build error only in CI/fresh clone | Undeclared dependency (resolves locally by accident) | Audit bare imports against package.json mechanically |
| Deployed page 404s all chunks | Publish tree and function bundle from different builds | Self-check script over the deployed HTML; ensure one build feeds both |
| Function 502 | Missing runtime env (e.g. Blobs context) | Reproduce the handler locally with the runtime env; fix provisioning |
| Test failures appear mid-suite | Concurrent build in same worktree | Resource tokens; serialize |
