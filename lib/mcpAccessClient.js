// Client for SmartVideo GO MCP keys (app/api/mcp-keys). The browser session (Clerk cookie) authenticates; the key is shown once.
export const MCP_KEYS_ENDPOINT = '/api/mcp-keys';

async function call(body, fetchImpl = fetch) {
  const res = await fetchImpl(MCP_KEYS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (res.status === 401) throw new Error('Sign in to manage MCP access.');
  if (!res.ok || !data?.ok) throw new Error(data?.error?.message || (typeof data?.error === 'string' ? data.error : '') || `MCP access is unavailable (HTTP ${res.status}).`);
  return data;
}

export const listMcpKeys = (f) => call({ action: 'list' }, f).then((d) => d.keys);
export const createMcpKey = (label, f) => call({ action: 'create', label }, f);
export const revokeMcpKey = (id, f) => call({ action: 'revoke', id }, f);

export function mcpInstallSnippets(rawKey, { url = 'https://go.smartvid.app/api/mcp-gateway', repoPath = '/path/to/OpenHiggsBolt' } = {}) {
  return {
    claudeCode: `claude mcp add smartvideo-go -e SMARTVIDEO_GO_API_KEY=${rawKey} -- node ${repoPath}/mcp/index.js`,
    json: JSON.stringify({ mcpServers: { 'smartvideo-go': { command: 'node', args: [`${repoPath}/mcp/index.js`], env: { SMARTVIDEO_GO_API_KEY: rawKey, SMARTVIDEO_GO_API_URL: url } } } }, null, 2),
  };
}
