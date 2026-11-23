# smartvideo-go-mcp

Use SmartVideo GO from Claude, Cursor and any other MCP app: generate images, video and audio, run the studios, and (with an open SmartVideo GO tab) control Storyboard, Motion Director and Layers.

## 1. Get a key
Sign in to SmartVideo GO, save your API key in Settings, then open **/studio/mcp-cli** and choose **Create MCP key**. Copy it; it is shown once. Your MCP key uses the API key you saved.

## 2. Add it to your MCP app

### Claude Code (nothing to install)
```bash
claude mcp add --transport http smartvideo-go https://go.smartvid.app/api/mcp --header "Authorization: Bearer sv_live_YOUR_KEY"
```

### Claude Code (local, via npx)
```bash
claude mcp add smartvideo-go -e SMARTVIDEO_GO_API_KEY=sv_live_YOUR_KEY -- npx -y smartvideo-go-mcp
```

### Claude Desktop / Cursor
```json
{
  "mcpServers": {
    "smartvideo-go": {
      "command": "npx",
      "args": ["-y", "smartvideo-go-mcp"],
      "env": { "SMARTVIDEO_GO_API_KEY": "sv_live_YOUR_KEY" }
    }
  }
}
```

## Settings
| Variable | Purpose |
|---|---|
| `SMARTVIDEO_GO_API_KEY` | Your MCP key (required). |
| `SMARTVIDEO_GO_API_URL` | Use another SmartVideo GO address, for example a preview deployment (optional). |

Needs Node 22 or newer.

## Safety
Anything that deletes, overwrites or publishes needs `confirm: true` and is capped per day. Saving API keys, checkout and connecting accounts can only be done by you in the app. Revoke or rotate a key any time at /studio/mcp-cli.
