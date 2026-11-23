# SmartVideo GO MCP server

Use every SmartVideo GO studio (image, video, edit, audio, lip sync, cinema, marketing, motion control, body swap/recast, layers and more) from Claude, Cursor or any MCP client.

## 1. Get a key
Open **/studio/mcp-cli** in SmartVideo GO and create an MCP key (save your API key in Settings first: the MCP uses it). The key is shown once; revoke it there any time.

## 2. Install (Claude Code)
```bash
claude mcp add smartvideo -e SMARTVIDEO_GO_API_KEY=sv_live_... -- node /path/to/OpenHiggsBolt/mcp/index.js
```

## Claude Desktop / Cursor
```json
{
  "mcpServers": {
    "smartvideo": {
      "command": "node",
      "args": ["/path/to/OpenHiggsBolt/mcp/index.js"],
      "env": { "SMARTVIDEO_GO_API_KEY": "sv_live_..." }
    }
  }
}
```
Run `npm --prefix packages/studio-mcp-core install --workspaces=false` once to install the server's dependencies.

## Tools
`smartvideo_list_studios`, `_search_models`, `_get_model`, `_estimate_cost`, `_image_generate`, `_image_edit`, `_video_generate`, `_video_from_image`, `_video_to_video`, `_lipsync`, `_audio_generate`, `_motion_control`, `_recast`, `_clip_video`, `_motion_graphics`, `_marketing_ad`, `_get_result`, `_upload_file`, `_account_balance`.

Flow: `search_models` → `get_model` (see the exact fields) → a generation tool with `{ model, inputs }`. Media inputs are public https URLs; `upload_file` re-hosts a URL. Long jobs return a `request_id` for `get_result`.

Studios: `_viral_prompts_search`, `_viral_seedance_search`; `_thumbnail_generate`, `_thumbnail_refine` (need your OpenAI key saved in Settings); Design Agent `_design_agent_session`, `_design_agent_sessions`, `_design_agent_chat`, `_design_agent_job`, `_design_agent_assets`, `_design_agent_decide`, `_design_agent_run_skill`; Brand Studio `_brand_analyze`, `_brands_list`, `_brand_save`, `_campaign_generate`, `_campaigns_list`; Zack D `_zackd_trends`, `_zackd_script`, `_zackd_submit`.

Notes: these run the app's own route handlers as you (entitlement, ownership and validation are the app's). Brand Studio keeps brands in an in-memory store per server instance, so a saved brand can be missing on a later call. Campaign listing is limited to your own brands. Zack D's script and topic ideas use your OpenAI key and are an MCP addition: the app itself drafts its script offline.

Recipes and agents: `_skills_list`, `_skill_run` (the 65 ready-made recipes), `_workflows_list`, `_workflow_inputs`, `_workflow_run`, `_workflow_status`, `_agents_list`, `_agent_chat`.

## Deploying and checking it live
`mcp/DEPLOY.md` is the checklist (migration, preview, key, smoke run). `npm run mcp:smoke` runs one cheapest call per model kind and per custom tool, refuses to spend without `--confirm-spend <max> --yes`, and `npm run mcp:coverage` turns the results into the Live column of `mcp/COVERAGE.md`.

## Which studios are covered
`mcp/studios.json` classifies every studio tab: the tools that serve it, or why it is not exposed. `tests/mcp/studio-coverage.test.js` fails when a tab is added without being classified; `tests/mcp/skills-parity.test.js` runs every recipe through both the Skills panel code and the MCP and compares the requests.

## How it works
`mcp/index.js` (brand: `mcp/brand.js`) uses `packages/studio-mcp-core`, which calls the gateway `app/api/mcp-gateway/[[...path]]/route.ts` (`/api/mcp-gateway`, logic in `lib/mcpGateway.js`). The key is bring-your-own and used per request only. Regenerate the catalog after model changes: `npm run mcp:catalog`. Tests: `npm run test:mcp`.
