# Sync Quick Reference

Quick reference for upstream sync commands. See [upstream-sync-runbook.md](../docs/upstream-sync-runbook.md) for full documentation.

## Check Sync Status

```bash
# View last synced commit
cat .upstream-sync

# See new upstream commits since last sync
git fetch upstream
SYNC_POINT=$(cat .upstream-sync)
git log $SYNC_POINT..upstream/main --oneline

# Quick one-liner
git fetch upstream && git log $(cat .upstream-sync)..upstream/main --oneline
```

## Dry Run (Preview Changes)

```bash
# See what would change without committing
git merge upstream/main --no-commit --no-ff
git diff --cached --name-only
git merge --abort
```

## Manual Sync

```bash
# 1. Prepare
git checkout main && git pull origin main

# 2. Create sync branch
git checkout -b sync-upstream-$(date +%Y%m%d)

# 3. Fetch and merge
git fetch upstream
git merge upstream/main --no-commit --no-ff

# 4. Apply exclusions (restore fork-only files)
git checkout HEAD -- middleware.js clerkAppearance.js app/sign-in/ app/sign-up/ supabase/ src/apps/ apps/cutai/ e2e/ tests/

# 5. Resolve conflicts if any
git diff --name-only --diff-filter=U
# ... edit conflicted files ...
git add .

# 6. Record sync point and commit
echo $(git rev-parse upstream/main) > .upstream-sync
git add .upstream-sync
git commit -m "chore: sync upstream to $(cat .upstream-sync)"

# 7. Push and create PR
git push origin sync-upstream-$(date +%Y%m%d)
gh pr create --title "sync: upstream $(date +%Y-%m-%d)" --base main --head sync-upstream-$(date +%Y%m%d)
```

## Resolve Common Conflicts

```bash
# Keep fork version
git checkout --ours path/to/file && git add path/to/file

# Take upstream version
git checkout --theirs path/to/file && git add path/to/file

# Fix package-lock.json conflicts
git checkout --theirs package-lock.json && npm install && git add package-lock.json
```

## Rollback

```bash
# Revert merge commit (safe)
git revert -m 1 <merge-commit-hash>
git push origin main

# Reset to pre-sync (destructive — use with caution)
git branch backup/pre-rollback-$(date +%Y%m%d) main
git reset --hard <pre-sync-commit>
git push origin main --force-with-lease
```

## Submodule Sync

```bash
# Update upstream-sourced submodules
git submodule update --remote packages/Open-AI-Design-Agent
git submodule update --remote packages/Open-Poe-AI

# Commit submodule updates
git add packages/Open-AI-Design-Agent packages/Open-Poe-AI
git commit -m "chore: update upstream submodules"
```

## Useful Aliases

Add to `~/.gitconfig`:

```ini
[alias]
    sync-status = "!git fetch upstream && git log $(cat .upstream-sync)..upstream/main --oneline"
    sync-dry = "!git merge upstream/main --no-commit --no-ff && git diff --cached --name-only && git merge --abort"
```

## Emergency Commands

```bash
# Abort a merge in progress
git merge --abort

# Find sync-related commits
git log --oneline --all --grep="upstream"

# See all differences between fork and upstream
git diff main..upstream/main --stat

# Check submodule status
git submodule status
```
