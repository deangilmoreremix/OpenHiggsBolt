#!/usr/bin/env bash
# Phase 3 machine validator. The ORCHESTRATOR runs this, not the agent.
# Usage: docs/phase3/validate.sh <AGENT-ID>
# Exit 0 = all checks pass. Non-zero = at least one check failed.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

ID="${1:-}"
FAIL=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAIL=1; }
note() { printf '  ....  %s\n' "$1"; }

host_gate() {
  local load avail
  load=$(uptime | sed 's/.*average[s]*: *//' | awk '{gsub(",","",$1); print $1}' | cut -d. -f1)
  avail=$(vm_stat | awk '/Pages (free|inactive|spec|purgeable)/{s+=$3} END{printf "%.1f", s*4096/1024/1024/1024}')
  if awk -v l="$load" 'BEGIN{exit !(l<40)}' && awk -v a="$avail" 'BEGIN{exit !(a>1.5)}'; then
    pass "host gate (load1=${load}, available=${avail} GiB)"
  else
    fail "host gate (load1=${load}, available=${avail} GiB) — results under this load are not trusted"
  fi
}

case "$ID" in
  P3-A)
    echo "== P3-A Persistence Contract =="
    [ -f src/shared/personalization/__tests__/projectPersistence.test.ts ] \
      && pass "projectPersistence.test.ts exists" || fail "projectPersistence.test.ts missing"
    if grep -n "loadProject" src/shared/personalization/DemoPersonalizeProvider.tsx \
       | grep -q "sourceId"; then
      note "loadProject still called with sourceId — check the persistence layer sends id/list"
    fi
    if grep -qE "searchParams.get\('id'\)|searchParams.get\('list'\)" app/api/personalization/project/route.ts; then
      pass "server reads id/list params"
    else fail "server does not read id/list params"; fi
    # WAVE1_AUDIT §2.1: the demo id lives at source->>'id' (a jsonb column), NOT in a
    # top-level sourceDemoId column. The filter must read the jsonb location.
    if grep -qE "source\??\.\?id|source\?\.id|source\.id|source_id" app/api/personalization/project/route.ts; then
      pass "source filter reads the jsonb source id"
    else
      note "route source filter does not read the jsonb source id — verify it is not filtering a non-existent column"
    fi
    grep -q "sourceFilter" app/api/personalization/project/route.ts \
      && pass "route reports whether the source filter was applied or unavailable" \
      || note "route does not report a sourceFilter marker (degraded mode would be silent)"
    npx vitest run src/shared/personalization/__tests__/projectPersistence.test.ts --reporter=dot 2>&1 | tail -4
    ;;
  P3-B)
    echo "== P3-B Layering (modals only; toasts/dropdowns may legitimately be topmost) =="
    # WAVE1_AUDIT §2.2: the scan was widened from three directories to the whole app tree,
    # because the validator cannot see a bare `zIndex: 2000` far from its modal context.
    #
    # The authoritative check is the regression test, which knows the two allowed layers
    # (the Personalization Modal reference at z-[250] and the upgrade gate at z-[300]),
    # excludes toasts/dropdowns, and is proven to fail on a real regression
    # (see docs/phase3/handoffs/P3-B.md).
    if npx vitest run packages/studio/src/components/__tests__/studioLayering.test.jsx --reporter=dot 2>&1 \
         | grep -qE "Tests +[0-9]+ failed"; then
      fail "studioLayering.test.jsx failed — a modal is layered at or above z-250"
    else
      pass "studioLayering.test.jsx: no modal at/above z-250 outside the allowed layers"
    fi
    # Independent, script-level cross-check — the test alone is not trusted.
    BAD=$(
      grep -rnE "z-\[[0-9]{2,4}\]|zIndex: *[0-9]{3,5}" \
        packages/studio/src src app components 2>/dev/null \
        | grep -vE "node_modules|/\.next/|/dist/|\.test\.|\.spec\.|__tests__" \
        | grep -iE "z-\[(2[5-9][0-9]|[3-9][0-9]{2})\]|zIndex: *(2[5-9][0-9]|[3-9][0-9]{3})" \
        | grep -viE "Toaster|toast|dropdown|99999|UpgradeModal|PersonalizationModal"
    )
    if [ -z "$BAD" ]; then
      pass "no shipped modal layer at/above z-250 (upgrade gate + Personalization Modal excluded)"
    else
      fail "modal layer(s) at/above z-250 outside the allowed set:"
      printf '%s\n' "$BAD"
    fi
    ;;
  P3-C)
    echo "== P3-C Credit, Font, Picker, Capability =="
    # WAVE1_AUDIT §2.3: the payload is a STATIC module (templates/fonts/*.ts), not an
    # fs.readFileSync() at module scope -- the latter breaks the browser bundle.
    if grep -rq "data:font/woff2;base64" src/shared/personalization/templates/ 2>/dev/null; then
      pass "font payload inlined as a base64 data URI (static module)"
    else
      fail "font payload not inlined as a base64 data URI"
    fi
    if grep -q "PERSONALIZATION_SANS_DATA_URI\|DESIGN_FONT_DATA_URI" \
         src/shared/personalization/templates/typography.ts 2>/dev/null; then
      pass "typography.ts references the static data-URI constant"
    else
      fail "typography.ts does not reference the static data-URI constant"
    fi
    # The browser bundle must not import node builtins. Test files are excluded:
    # they run in Node under vitest and are never bundled.
    if grep -rnE "from ['\"](fs|path|node:fs|node:path)['\"]" \
         src/shared/personalization/templates src/shared/personalization/preview \
         src/shared/personalization/guided 2>/dev/null \
         | grep -vE "node_modules|__tests__|\.test\.|\.spec\." \
         | grep -vE "templates/fonts/.*\.(mjs|cjs|js)"; then
      fail "node builtin (fs/path) imported into the browser-reachable personalization tree"
    else
      pass "no node builtin import in the browser-reachable personalization tree"
    fi
    grep -q "FontFace" src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts \
      && pass "FontFace.load spy present" || fail "no FontFace.load spy — zero-network is advisory"
    grep -rq "SIL OFL 1.1" src/shared/personalization/templates/ && pass "OFL attribution in the credit surface" \
      || fail "OFL attribution missing from the credit surface"
    npx vitest run src/shared/personalization/templates src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts --reporter=dot 2>&1 | tail -4
    ;;
  P3-D)
    echo "== P3-D Hygiene =="
    N=$(git ls-files packages/studio/dist | wc -l | tr -d ' ')
    [ "$N" = "0" ] && pass "packages/studio/dist untracked" || fail "$N dist file(s) still tracked"
    for i in 1 2 3 4 5; do
      npx vitest run src/shared/personalization/__tests__/PersonalizationModal.test.tsx --reporter=dot 2>&1 | grep -qE "Tests +[0-9]+ failed" \
        && { fail "PersonalizationModal.test.tsx flaked on run $i"; break; }
    done
    [ "$FAIL" = "0" ] && pass "PersonalizationModal.test.tsx: 5/5 consecutive clean runs"
    ;;
  P3-E)
    echo "== P3-E Export Matrix =="
    [ -f docs/phase3/EXPORT_MATRIX.md ] && pass "EXPORT_MATRIX.md exists" || fail "EXPORT_MATRIX.md missing"
    npx playwright test e2e/personalization-step4-remotion-export.spec.ts --project=chromium --reporter=list --retries=0 --workers=1 2>&1 | tail -6
    ;;
  P3-F)
    echo "== P3-F Studio Coverage =="
    for s in brand-studio academy; do
      grep -rq "DemoPersonalizeProvider" "app/$s" 2>/dev/null && pass "$s has a provider mount" || note "$s: no provider mount found"
    done
    npx tsc --noEmit && pass "typecheck clean" || fail "typecheck errors"
    ;;
  P3-G)
    echo "== P3-G Test Debt =="
    host_gate
    npm run test:unit 2>&1 | tail -6
    ;;
  P3-H|"")
    echo "== P3-H Full matrix =="
    host_gate
    npm run typecheck  && pass "typecheck" || fail "typecheck"
    npm run build      && pass "app build" || fail "app build"
    npm run build:packages && pass "package build" || fail "package build"
    npm run test:unit 2>&1 | tail -5
    npx playwright test e2e/personalization-step4-remotion-designs.spec.ts \
      e2e/personalization-step4-remotion-designs-all.spec.ts \
      e2e/personalization-studio-handoff.spec.ts \
      e2e/personalization-step4-remotion-export.spec.ts \
      --project=chromium --reporter=list --retries=0 --workers=1 2>&1 | tail -4
    git diff origin/main --name-only -- netlify.toml package.json pnpm-lock.yaml .github/ | grep -q . \
      && fail "protected files changed" || pass "protected files untouched"
    ;;
  *) echo "unknown agent id: $ID"; exit 2;;
esac

printf '\n%s: %s\n' "$ID" "$([ "$FAIL" = 0 ] && echo 'ALL CHECKS PASSED' || echo 'CHECKS FAILED')"
exit "$FAIL"
