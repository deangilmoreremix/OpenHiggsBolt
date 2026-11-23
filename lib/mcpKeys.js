// lib/mcpKeys.js
// SmartVideo GO MCP keys: generation, hashing, store access and resolution to a user.
// Pure and injectable (no Next/Clerk imports) so it is testable and shared by the keys route and the gateway.
// Unlike the SmartVid app, no upstream key is copied here: the user's generation key already lives encrypted in
// app_users.muapi_key, so resolution takes a `loadUserKeys(userId)` function that reads and decrypts it.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const KEY_PREFIX = 'sv_live_';
const KEY_RE = /^sv_live_[A-Za-z0-9_-]{32,64}$/;
export const MAX_ACTIVE_KEYS = 10;

export const newRawKey = () => `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
export const isMcpKey = (s) => typeof s === 'string' && KEY_RE.test(s);
export const hashKey = (raw) => createHash('sha256').update(String(raw)).digest('hex');
export const displayPrefix = (raw) => `${raw.slice(0, KEY_PREFIX.length + 4)}…`;

/** Supabase-backed store. `admin` is a service-role client. */
export function createStore(admin) {
  const T = 'mcp_keys';
  const unwrap = ({ data, error }) => { if (error) throw error; return data; };
  return {
    insert: async (row) => unwrap(await admin.from(T).insert(row).select('id, label, key_prefix, created_at, expires_at').single()),
    byHash: async (hash) => unwrap(await admin.from(T).select('*').eq('key_hash', hash).is('revoked_at', null).maybeSingle()),
    listForUser: async (userId) => unwrap(await admin.from(T).select('id, label, key_prefix, created_at, last_used_at, expires_at').eq('clerk_user_id', userId).is('revoked_at', null).order('created_at', { ascending: false })),
    countActive: async (userId) => unwrap(await admin.from(T).select('id').eq('clerk_user_id', userId).is('revoked_at', null)).length,
    revoke: async (userId, id) => unwrap(await admin.from(T).update({ revoked_at: new Date().toISOString() }).eq('id', id).eq('clerk_user_id', userId).is('revoked_at', null).select('id')).length > 0,
    touch: async (id) => { await admin.from(T).update({ last_used_at: new Date().toISOString() }).eq('id', id); },
  };
}

/** Create a key for a user who already saved a generation key. `hasUpstreamKey` is checked by the caller. */
export async function createMcpKey(store, { userId, label, expiresInDays, now = Date.now, maxActive = MAX_ACTIVE_KEYS }) {
  if ((await store.countActive(userId)) >= maxActive) return { error: 'too_many_keys', message: `You can have at most ${MAX_ACTIVE_KEYS} active MCP keys. Revoke one first.` };
  const raw = newRawKey();
  const row = await store.insert({ clerk_user_id: userId, label: String(label || 'MCP key').slice(0, 60), key_hash: hashKey(raw), key_prefix: displayPrefix(raw),
    ...(Number.isFinite(expiresInDays) && expiresInDays > 0 ? { expires_at: new Date(now() + expiresInDays * 86_400_000).toISOString() } : {}) });
  return { key: raw, id: row.id, label: row.label, prefix: row.key_prefix, created_at: row.created_at, expires_at: row.expires_at ?? null };
}

/**
 * Raw MCP key → { id, userId, keys: { muapi } } or null (unknown, revoked, or the user has no saved generation key).
 * `loadUserKeys(userId)` returns { muapi, openai } decrypted, or null.
 */
export async function resolveMcpKey(store, loadUserKeys, raw, { now = Date.now } = {}) {
  if (!isMcpKey(raw)) return null;
  const h = hashKey(raw);
  const row = await store.byHash(h);
  if (!row || row.revoked_at) return null;
  if (row.expires_at && Date.parse(row.expires_at) <= now()) return null; // expired keys stop working like revoked ones
  if (!timingSafeEqual(Buffer.from(row.key_hash), Buffer.from(h))) return null;
  const keys = await loadUserKeys(row.clerk_user_id);
  if (!keys?.muapi) return null;
  Promise.resolve(store.touch(row.id)).catch(() => {});
  return { id: row.id, userId: row.clerk_user_id, workspaceId: 'personal', keys: { muapi: keys.muapi, openai: keys.openai || null } };
}

/** Days until a new key expires. MCP_KEY_MAX_DAYS caps it (and is the default when set); with neither, keys do not expire. */
export function expiryDays(requested, env = process.env) {
  const max = Number(env.MCP_KEY_MAX_DAYS);
  const asked = Number(requested);
  const hasMax = Number.isFinite(max) && max > 0;
  if (Number.isFinite(asked) && asked > 0) return hasMax ? Math.min(asked, max) : Math.min(asked, 3650);
  return hasMax ? max : undefined;
}

/**
 * Replace a key. The new one is made first (ignoring the key-count limit, since the old one is about to go) and the old one is revoked
 * only once the new one exists, so a failure never leaves the user with no key. Returns { error, status } or the new key.
 */
export async function rotateMcpKey(store, { userId, id, expiresInDays }) {
  const current = (await store.listForUser(userId)).find((k) => k.id === id);
  if (!current) return { error: 'not_found', message: 'Key not found', status: 404 };
  const made = await createMcpKey(store, { userId, label: current.label, expiresInDays, maxActive: Infinity });
  if (made.error) return { ...made, status: 400 };
  await store.revoke(userId, current.id);
  return { ...made, replaced: current.id };
}
