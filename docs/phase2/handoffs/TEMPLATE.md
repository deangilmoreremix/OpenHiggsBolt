# Agent handoff template

Copy this file to `docs/phase2/handoffs/<YOUR-ID>.md` and fill it in. **This file is the
deliverable** — the orchestrator reads it, not your return message. Post a `RESULT` message on
the shared board as well, so the result survives if the return channel dies.

---

```markdown
# <ID> — <Role>

**Agent:** <ID>
**Wave:** <1|2|3>
**Status:** ✅ complete | ⚠️ partial | ❌ blocked
**Lane used:** <lane name | none>
**Files changed:** <path list>
**Files NOT changed (owned by others):** <path list>

## Commands run and raw output

### <command>
```
<raw output — do not summarise, do not paraphrase>
```

## Decisions

- <decision> — <why>

## Interface changes (consumers must know)

- <file> — <what changed, and who must adapt>

## Open questions / blockers

- <question or blocker, or "none">

## Wave compliance

- [ ] Edited only files listed against my ID in `docs/phase2/OWNERSHIP.md`
- [ ] Did not run a build/test/e2e command without the build lock
- [ ] Did not rebase, reset, or touch `origin/main`, `netlify.toml` or `.github/`
- [ ] Wrote this handoff file and posted a `RESULT` to the board
```

---

## Rules that are not optional

1. **Raw output only.** A summary is not evidence. Paste the terminal output.
2. **Never claim a test passed that you did not run.** If a command was not run, say so.
3. **Pre-existing failures must be proven**, not asserted: stash your changes, re-run at the
   pinned baseline, restore, and paste both outputs.
4. **Do not rebase.** The orchestrator rebases once, at the end.
5. **Do not touch** `netlify.toml`, `.github/`, `package.json`, lock files, or `origin/main`.
