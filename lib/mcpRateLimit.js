// lib/mcpRateLimit.js
// Per-key request limit for the SmartVideo GO MCP: shared by the gateway and the hosted endpoint.
// MCP_RATE_PER_MIN=0 turns it off; default 120 per minute per key. Counts live in Supabase (mcp_rate_hit) so serverless instances share them.
import { createRateLimiter, createMemoryRateStore, createSupabaseRateStore, DEFAULT_PER_MINUTE } from '../packages/studio-mcp-core/src/limiter.js';

export const BRAND = 'SmartVideo GO';

/** @param {{ env?: Record<string, string | undefined>, admin?: any, now?: () => number }} [o] */
export function defaultRateLimiter({ env = process.env, admin, now } = {}) {
  const perMinute = env.MCP_RATE_PER_MIN === undefined || env.MCP_RATE_PER_MIN === '' ? DEFAULT_PER_MINUTE : Number(env.MCP_RATE_PER_MIN);
  if (!Number.isFinite(perMinute) || perMinute <= 0) return null;
  let store = createMemoryRateStore();
  if (admin) store = createSupabaseRateStore(admin);
  return createRateLimiter({ store, perMinute, brandName: BRAND, ...(now ? { now } : {}) });
}
