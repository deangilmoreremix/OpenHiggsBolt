# RELEASE RECORD — PR #70 Phase-1 env hardening and preview retrigger

- Date: 2026-10-22 (UTC), agent: release-infrastructure, site: marvelous-strudel-a6dc23 (76f606a3)
- PR branch: feat/playback-catalog-repair (head at retrigger: 7a2715843 + this doc commit)

## What failed

- Preview 6ad93cb03628acb75d40fcdf (deploy-preview, commit 7a2715843) failed:
  "Failed during stage 'building site': Build script returned non-zero exit code: 2".
- The same error hit 5+ unrelated branches the same day (fix/guided-inline-asset-review 22:23Z,
  shotcraft-motion-library 00:24Z 10-22, feature/remotion-personalization-phase-2, fix/find-business-and-assets)
  AND main itself: production 00:22Z 10-22 ERROR, then READY 00:45Z on the same branch 23 min later.
  Previews of main flap green->error->green within minutes. => infra-level flake inside the build command stage.

## Evidence (Netlify APIs + local repro)

- Env API (GET /sites/{id}/env + /accounts/{id}/env): 23 app vars (Clerk/Supabase/Resend/Stripe) only.
  NO toolchain vars exist in the env store; all toolchain vars come from netlify.toml
  [build.environment] (NPM_CONFIG_PRODUCTION=false, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1,
  ELECTRON_SKIP_BINARY_DOWNLOAD=1, NODE_VERSION=22, GIT_SUBMODULE_DEPTH=1), byte-identical on
  main and this branch, applied to every context. Context scoping of stored env vars ruled out.
  (PNPM_ALLOW_BUILD_SCRIPTS/PNPM_IGNORE_BUILDS in netlify.toml are not recognized pnpm vars; inert.)
- Log endpoints for 6ad93cb03628acb75d40fcdf: /deploys/{id}/log, /builds/{id}/log,
  /deploys/{id}/log_instructions, /deploys/{id}/log_files all 404 -> logs UI-only.
- Local repro (fresh clone 7a2715843 + submodules): CI=true pnpm install --frozen-lockfile
  (build scripts ON) -> exit 0 in 19.4s; real `netlify build --context deploy-preview`
  (@netlify/build 37.3.3, site env + netlify.toml + @netlify/plugin-nextjs 5.16.2) -> complete, exit 0.
- Netlify build env: build_image=noble, cmd not overridden in UI, queue has occasional stuck
  'new' deploys on main (22:34Z stuck ~2.5h; 01:07Z in progress).

## What was changed this commit

- No repo code, no netlify.toml, no lockfiles, no Netlify env values changed. This commit only
  records the evidence and retriggers the PR #70 preview into a green build window.
- Netlify env: NO CHANGES (nothing context-scoped existed to reconcile; app secrets untouched).

## Retrigger #1 result (01:20Z) and the env fix

- Preview 6ad964d1336444a562b41f1b (this doc commit 5c9cdbc4732) FAILED with the identical
  "Build script returned non-zero exit code: 2". Only delta vs 7a2715843 was this docs file,
  proving the failure is independent of commit content.
- Targeted environment-only change applied on Netlify (no repo/code changes):
  PNPM_VERSION=10.30.3 set for contexts production + deploy-preview + branch-deploy (scope builds).
  Rationale: the repo ships pnpm-lock.yaml so Netlify installs with pnpm; PNPM_VERSION was unset,
  so builds previously rode the image-default pnpm (or a corepack resolution) instead of the exact
  pnpm@10.30.3 pinned by packageManager and proven green locally. Nothing else was changed;
  the Netlify env store contained no toolchain vars and no secrets were touched.
