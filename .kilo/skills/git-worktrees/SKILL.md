---
name: git-worktrees
description: Isolate feature work from current workspace
---

Use when starting feature work that needs isolation from current workspace.

Procedure:
1. Check for existing worktree — `git worktree list`
2. Create worktree — `git worktree add ../feature-branch feature/branch-name`
3. Work independently — all changes isolated to that directory
4. Finish properly — update PR, merge, or discard worktree

Benefits:
- Parallel work without conflicts
- Easy to test integration
- Clean separation of concerns
- Simple to abandon if approach fails

Remember: setup scripts and run scripts need to account for worktree paths. Use `WORKTREE_PATH` and `REPO_PATH` env vars when available.