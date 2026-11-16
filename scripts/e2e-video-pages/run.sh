#!/usr/bin/env bash
# End-to-end checks for Video Pages against the REAL Next.js routes with a stand-in Supabase REST server.
#   - public.cjs: /p/<slug> render (desktop + phone), 404s, personal link, lead form, events
#   - studio.cjs: the studio (create, edit, save, publish, CSV contacts, AI rewrite + undo, MailerLite, analytics)
# Clerk is NOT contacted (dummy keys, signed-out cookies); OpenAI/MailerLite calls are mocked in the browser.
set -euo pipefail
cd "$(dirname "$0")/../.."
HERE=scripts/e2e-video-pages
PORT=${PORT:-3111}
node "$HERE/seed.mjs"
SEED="$PWD/$HERE/seed.json" node "$HERE/fake-supabase.cjs" & FAKE=$!
mkdir -p app/harness-e2e && cp "$HERE/harness-page.tsx" app/harness-e2e/page.tsx   # dev-only page that mounts the studio without sign-in
cleanup() { kill "$FAKE" "${NEXT:-0}" 2>/dev/null || true; rm -rf app/harness-e2e; }
trap cleanup EXIT
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_$(printf 'example.clerk.accounts.dev$' | base64)" CLERK_SECRET_KEY=sk_test_dummy \
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=fake SUPABASE_SERVICE_ROLE_KEY=fake \
  npx next dev --port "$PORT" --turbopack > "$HERE/next.log" 2>&1 & NEXT=$!
for i in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 2; done
curl -s -o /dev/null --max-time 170 "http://127.0.0.1:$PORT/p/SparkPage01" || true   # warm the first compile
node "$HERE/public.cjs"
node "$HERE/studio.cjs"
