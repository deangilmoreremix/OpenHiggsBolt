# SmartVideo GO MCP: deploy and live check

Nothing here has been run against a real deployment yet. This is the checklist for doing that once, and for reading the result.

## 1. Database
Apply `supabase/migrations/20261119000000_mcp_keys.sql` to the Supabase project the app uses. It creates `public.mcp_keys` (hash only, no secrets) with row-level security on and no client grants. MCP keys use the generation key each user already saved in Settings (`app_users.muapi_key`, encrypted by `src/lib/muapiKeyCrypto.ts`), so there is no new secret to set.

Also apply, in this order:
- `supabase/migrations/20261123000000_mcp_governor.sql`: per-key daily counters and the audit log (`mcp_usage_daily`, `mcp_audit`).
- `supabase/migrations/20261123010000_mcp_bridge.sql`: the live-tab bridge (`mcp_bridge_sessions`, `mcp_bridge_commands`). Commands expire after 60 seconds and hold no secrets.

All of these have row-level security on and no client grants (service role only).

Check: `select count(*) from public.mcp_keys;` works with the service role and fails for the `anon` role. Do the same for the other four tables.

## 2. Environment
Nothing new is required. These must already be set for the app (they are read by the new routes):

| Variable | Read by |
|---|---|
| `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabaseServer.ts` |
| Clerk keys | `@clerk/nextjs` (`auth()`), entitlement lookup in `src/access/resolveAccess.ts` |
| `MUAPI_KEY_SECRET` (or the service-role fallback) | `src/lib/muapiKeyCrypto.ts`, to read each user's saved key |
| `MCP_CAP_DESTRUCTIVE`, `MCP_CAP_PUBLISH` (optional) | `app/api/mcp-gateway`: per-key daily limits for confirmed delete / publish calls (defaults 50 and 20) |
| `MCP_ALLOW_BYOK` | **leave unset in any deployed environment.** Local development only. |

Thumbnails, Zack D script/topic steps and Brand Studio text need the user's own **OpenAI key saved in Settings** (`app_users.openai_key`); without it those tools answer with a clear "save your key" message.

The gateway checks the `SMARTVIDEO_GO` entitlement for the key's owner on every request (same rule as the app's proxy routes) and refuses if it cannot be confirmed.

## 3. Deploy a preview
Push the branch and let the host build a preview. New routes: `/api/mcp-keys` (create, list, revoke; needs a signed-in session), `/api/mcp-gateway/*` (the MCP's address), `/api/mcp-bridge` (the tab half of tab control; signed-in session) and the page `/studio/mcp-cli`.

Set the real gateway address in `mcp/brand.js` (`gatewayUrl`, currently a guess), or pass `--url` / `SMARTVIDEO_GO_API_URL`: `https://<preview>/api/mcp-gateway`.

## 4. Create a key
Sign in on the preview, make sure an API key is saved in Settings, open `/studio/mcp-cli` and **Create MCP key**. Copy it now; it is shown once.

## 5. Look before you spend
```bash
SMARTVIDEO_GO_API_KEY=sv_live_... SMARTVIDEO_GO_API_URL=https://<preview>/api/mcp-gateway \
  node scripts/mcp-smoke.mjs --sample-image https://<public image> --sample-video https://<public short video> --agent-slug <one of your agent slugs>
```
With no spend flags it checks the key (balance), asks the estimate route for prices, prints the plan with its estimated total, and exits with code 2 without generating anything. Read the plan. Custom tools marked "(assumed)" use a fixed figure I picked, not a measured price.

Options: `--only t2i,i2i,tool:skill_run`, `--candidates 12`, `--sample-audio URL`, `--allow-unknown-cost`. `workflow_run` is not in the default plan (it needs one of your workflow ids); run it by hand.

## 6. Run it
```bash
SMARTVIDEO_GO_API_KEY=... SMARTVIDEO_GO_API_URL=... node scripts/mcp-smoke.mjs <same sample flags> --confirm-spend 3 --yes
npm run mcp:coverage
```
The run stops before any call that would push the running estimate past the cap and writes `mcp/smoke-results.json`. `mcp:coverage` rewrites `mcp/COVERAGE.md` (Live column per studio, gateway checks, which verb the upstream status route accepted). Commit both.

## 7. Checks the script cannot do
- **Cross-user isolation:** with two accounts, create a Design Agent session with account A's key and try to read its assets with account B's key: expect 403. List campaigns with B: A's must not appear.
- **App route exposure (not part of the MCP):** `GET /api/campaigns` in the app has no sign-in check and returns every user's campaigns. The MCP never calls it, but anyone can. Worth fixing separately.
- **Revoked key:** revoke the key at `/studio/mcp-cli`, call a tool again: expect "Missing, invalid or revoked SmartVideo GO MCP key".
- **No saved API key:** remove the key in Settings; the MCP key stops working (401) until one is saved again.
- **No entitlement:** an account without `SMARTVIDEO_GO` access gets 403 from the gateway.
- **Real MCP client:** `claude mcp add smartvideo-go -e SMARTVIDEO_GO_API_KEY=sv_live_... -e SMARTVIDEO_GO_API_URL=... -- node mcp/index.js`, then ask Claude to list studios, run `skills_list`, and make one image.

## 8. Tab control (check by hand: it needs a real browser)
Offline tests drive the tab controller, the tab endpoint, the gateway and the MCP server together against an in-memory store, but nothing here has run in a real browser. To check it:
1. Open a studio (Storyboard, Motion Director or Layers) in a signed-in tab. A small "Let MCP control this tab" button appears bottom-left. Click it.
2. In the MCP client, call `smartvideo_studio_sessions`: the tab and its tools should be listed. Call a read tool (`storyboard_get_state`) through `smartvideo_studio_call`: it runs without a prompt. Call a change (`storyboard_add_shot`): the tab asks first; try No, Allow once, Allow all.
3. A delete (`storyboard_remove_shot`) must be refused until `confirm: true`.
4. Close the tab: `studio_sessions` should empty within ~20 seconds.
Tab tools work only while the tab is open, signed in and switched on, and reset when the page reloads.

## What is not smoke-run
The smoke run covers read-only tools and the confirm checks. Tools that create, publish or delete (`video_pages_*`, `social_publish`, `assets_library_delete`, `history_delete_media`, `workflow_*`) change or send real data: run them once by hand with `confirm: true` against a throwaway page or workflow.

## Rollback
1. Revoke keys: `update public.mcp_keys set revoked_at = now() where revoked_at is null;` (the gateway then answers 401 to everything).
2. Switch tab control off: `update public.mcp_bridge_sessions set closed_at = now() where closed_at is null;`.
3. Remove completely: `drop table public.mcp_keys, public.mcp_usage_daily, public.mcp_audit, public.mcp_bridge_commands, public.mcp_bridge_sessions;` and delete `app/api/mcp-keys`, `app/api/mcp-gateway`, `app/api/mcp-bridge`, `lib/mcpKeys.js`, `lib/mcpGateway.js`.

## What a pass does and does not show
A ✔ means the tool returned a finished result for one cheap input through the real gateway. It does not mean every model of that kind works, that a recipe's output is good, or that the 9 recipes listed in `tests/mcp/skills-parity.test.js` (registry data problems) run.
