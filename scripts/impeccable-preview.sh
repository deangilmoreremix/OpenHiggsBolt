#!/usr/bin/env bash
# Start the app locally so /impeccable critique, audit and live can look at the
# rendered landing page. Safe to re-run: each step is skipped once it is done.
#
#   bash scripts/impeccable-preview.sh [port]   (default port 3000)
#
# Real Clerk keys from the environment or .env.local are used when present.
# Without them, placeholder keys let the signed-out landing page render; sign-in
# will not work in that mode.
set -euo pipefail

cd "$(dirname "$0")/.."
PORT="${1:-3000}"

# The ai-agent package lives in a submodule.
if [ ! -f packages/Open-Poe-AI/packages/agents/package.json ]; then
  git submodule update --init --depth 1 packages/Open-Poe-AI
fi

[ -d node_modules ] || pnpm install --frozen-lockfile

# Local packages the studio imports from their dist/ builds.
[ -d packages/workflow-builder/dist ] || pnpm --filter workflow-builder run build
if [ ! -d packages/Open-Poe-AI/packages/agents/dist ]; then
  (cd packages/Open-Poe-AI/packages/agents && npm install --no-audit --no-fund --ignore-scripts && npm run build)
fi

if [ -z "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" ] && ! grep -qs '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' .env.local; then
  echo "No Clerk keys found: using placeholders (landing page renders signed out; auth is disabled)."
  export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_$(printf 'clerk.example.com$' | base64)"
  export CLERK_SECRET_KEY="sk_live_placeholder"
fi

exec node scripts/dev-prod.js -p "$PORT"
