# SmartVideo GO MCP server

Use every SmartVideo GO studio (image, video, edit, audio, lip sync, cinema, marketing, motion control, body swap/recast, layers and more) from Claude, Cursor or any MCP client.

## Install (Claude Code)
```bash
claude mcp add smartvideo -e SMARTVIDEO_GO_API_KEY=your_key -- node /path/to/OpenHiggsBolt/mcp/index.js
```

## Claude Desktop / Cursor
```json
{
  "mcpServers": {
    "smartvideo": {
      "command": "node",
      "args": ["/path/to/OpenHiggsBolt/mcp/index.js"],
      "env": { "SMARTVIDEO_GO_API_KEY": "your_key" }
    }
  }
}
```
Run `npm --prefix packages/studio-mcp-core install --workspaces=false` once to install the server's dependencies.

## Tools
`smartvideo_list_studios`, `_search_models`, `_get_model`, `_estimate_cost`, `_image_generate`, `_image_edit`, `_video_generate`, `_video_from_image`, `_video_to_video`, `_lipsync`, `_audio_generate`, `_motion_control`, `_recast`, `_get_result`, `_upload_file`, `_account_balance`.

Flow: `search_models` → `get_model` (see the exact fields) → a generation tool with `{ model, inputs }`. Media inputs are public https URLs; `upload_file` re-hosts a URL. Long jobs return a `request_id` for `get_result`.

## How it works
`mcp/index.js` (brand: `mcp/brand.js`) uses `packages/studio-mcp-core`, which calls the gateway `app/api/mcp-gateway/[[...path]]/route.ts` (`/api/mcp-gateway`, logic in `lib/mcpGateway.js`). The key is bring-your-own and used per request only. Regenerate the catalog after model changes: `npm run mcp:catalog`. Tests: `npm run test:mcp`.
