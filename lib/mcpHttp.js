// lib/mcpHttp.js
// Hosted SmartVideo GO MCP over streamable HTTP (app/api/mcp), stateless. Every tool call goes through the gateway handler in-process
// (no network hop), so confirm rules, daily caps and the audit log apply exactly as they do for a local MCP.
import { createMcpHttpHandler, bearerFrom, createBrandedServer, createCatalog, createGatewayClient } from '../packages/studio-mcp-core/src/index.js';
import { isMcpKey } from './mcpKeys.js';
import { BRAND } from './mcpRateLimit.js';

/** Turn a gateway call into an in-process handler call and back, so the client needs no network. */
export function inProcessFetch(gateway) {
  return async (url, init = {}) => {
    const u = new URL(url);
    const headers = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const out = await gateway({
      httpMethod: init.method || 'GET', path: u.pathname + u.search, queryStringParameters: Object.fromEntries(u.searchParams),
      headers, body: typeof init.body === 'string' ? init.body : undefined,
    });
    return { ok: out.statusCode < 400, status: out.statusCode, statusText: '', headers: { get: (n) => out.headers?.[n] ?? null }, text: async () => out.body ?? '' };
  };
}

/**
 * @param {{ brand: any, customTools: any[], catalogEntries: any[], endpointFixes?: any, gateway: (event: any) => Promise<any>, resolveCaller: (raw: string) => Promise<any>, limiter?: { check: (id: string) => Promise<any> } | null }} o
 */
export function createHttpHandler({ brand, customTools, catalogEntries, endpointFixes, gateway, resolveCaller, limiter = null }) {
  let catalog;
  const getCatalog = () => (catalog ||= createCatalog(catalogEntries, { endpointFixes }));
  return createMcpHttpHandler({
    brandName: BRAND,
    authenticate: async (request) => {
      const token = bearerFrom(request);
      if (!token || !isMcpKey(token)) return null;
      const who = await resolveCaller(token);
      return who ? { who, token } : null;
    },
    // Counted once per MCP request here; the in-process gateway calls it makes are not counted again.
    limit: limiter ? (caller) => limiter.check(caller.who.id) : undefined,
    buildServer: ({ token }) => createBrandedServer({
      brand: { ...brand, customTools },
      catalog: getCatalog(),
      client: createGatewayClient({ gatewayUrl: 'http://gateway.internal/api/mcp-gateway', apiKey: token, brandName: brand.name, fetchImpl: inProcessFetch(gateway) }),
    }),
  });
}
