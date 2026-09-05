# Rebase / Merge Plan — Personalization API onto origin/main

## Current State
- Branch: `fix/production-security-p0-p1`
- HEAD: `84f1a499`
- origin/main: `28201b17`
- Relationship: **4 commits ahead, 0 behind**

## Commits on fix/production-security-p0-p1 (not in origin/main)
1. `8b7a094f` — fix(personalization-api): wire SettingsModal into demo page and fix typecheck
2. `cafb7f5f` — fix: resolve personalization-demo merge conflict
3. `ba79686d` — fix(personalization-api): separate CTA headline/button and fix prompt personalization
4. `84f1a499` — fix(personalization-api): add retry branding, fix merge drift, document verify drift

## Recommendation: Merge, Not Rebase
These commits are already based on a recent `origin/main` snapshot and include a merge conflict resolution. A clean rebase is possible but not necessary.

### Option A: Merge (Recommended)
```bash
git checkout main
git merge fix/production-security-p0-p1
git push origin main
```

**Pros**:
- Preserves the merge conflict resolution commit
- No rewrite of public history
- Fast-forward or true merge depending on remote state

**Cons**:
- Adds a merge commit to main history

### Option B: Rebase and Force Push
```bash
git checkout fix/production-security-p0-p1
git rebase origin/main
git push --force-with-lease origin fix/production-security-p0-p1
```

**Pros**:
- Linear history
- All personalization fixes in one clean block

**Cons**:
- Force push required
- Rewrites branch history

## Files Changed by These Commits
- `app/personalization-demo/page.tsx` — SettingsModal integration, auth wiring
- `src/shared/personalization/DemoPersonalizeProvider.tsx` — retry branding, CTA separation
- `src/shared/personalization/PersonalizationModal.tsx` — retry branding UI, post-processing failure state
- `src/shared/personalization/postProcessor.ts` — new file, exact logo/CTA composition
- `src/shared/personalization/generationRouter.ts` — model ID fixes, post-processing metadata
- `src/shared/personalization/modelCapabilityResolver.ts` — catalog-backed capability resolution
- `src/shared/personalization/types.ts` — CTA headline/button separation
- `src/shared/personalization/clientProfile.ts` — ctaHeadline field
- `src/shared/personalization/promptPersonalizer.ts` — separate CTA headline/button in prompt
- `src/shared/personalization/__tests__/modelCapabilityResolver.test.ts` — new tests
- `src/shared/personalization/__tests__/postProcessor.test.ts` — new tests
- `e2e/personalization-demo.spec.ts` — Playwright coverage
- `docs/personalization-verify-muapi-drift.md` — drift documentation
- `scripts/verify-muapi-apis.mjs` — temp-file import fix

## Merge Checklist
- [ ] Run `npm run typecheck` on target branch
- [ ] Run `npm run test:unit` on target branch
- [ ] Run `npm run build` on target branch
- [ ] Verify Playwright tests pass in CI (if credentials available)
- [ ] Review and accept `verify:muapi` drift as known issue or schedule catalog sync
- [ ] Merge with `--no-ff` to preserve feature branch history

## Post-Merge
1. Delete `fix/production-security-p0-p1` branch
2. Tag release: `git tag -a personalization-api-v1 -m "Personalization API audit complete"`
3. Update internal runbook with manual smoke test steps
