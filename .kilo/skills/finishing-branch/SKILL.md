---
name: finishing-branch
description: Complete development branch with verification and integration options
---

Use when implementation is complete and all tests pass.

Process:
1. **Verify tests pass** — Run full test suite, confirm all green
2. **Detect environment** — Check if this is a worktree, what branch tracks
3. **Present options**:
   - Merge — Integrate into target branch immediately
   - Create PR — Submit for review, link to issue
   - Keep branch — Continue iteration elsewhere
   - Discard — Delete work, no changes needed
4. **Clean up** — Remove worktree if used, update remote if needed
5. **Document** — What was accomplished, what issues remain (if any)