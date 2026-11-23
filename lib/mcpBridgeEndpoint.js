// Request logic of the tab half of the bridge (app/api/mcp-bridge/route.ts wraps it with the Clerk session). Kept free of Next so tests drive it directly.
import { BridgeError } from '../packages/studio-mcp-core/src/bridge.js';

const ID = /^[0-9a-f-]{36}$/i;
const fail = (status, code, message) => ({ status, body: { ok: false, error: { code, message } } });

/** @param {{ bridge: any }} deps  @returns {(userId: string | null, body: any) => Promise<{ status: number, body: any }>} */
export function createTabEndpoint({ bridge }) {
  return async (userId, body) => {
    if (!userId) return fail(401, 'not_signed_in', 'Sign in first');
    try {
      if (body?.action === 'register') {
        if (body.sessionId && !ID.test(String(body.sessionId))) return fail(400, 'bad_request', 'Invalid sessionId');
        return { status: 200, body: { ok: true, session: await bridge.register(userId, { label: body.label, studio: body.studio, tools: body.tools, sessionId: body.sessionId || undefined }) } };
      }
      if (!ID.test(String(body?.sessionId || ''))) return fail(400, 'bad_request', 'Invalid sessionId');
      if (body.action === 'poll') return { status: 200, body: { ok: true, ...(await bridge.poll(userId, body.sessionId)) } };
      if (body.action === 'respond') {
        if (!ID.test(String(body.commandId || ''))) return fail(400, 'bad_request', 'Invalid commandId');
        const row = await bridge.respond(userId, body.sessionId, body.commandId, { status: body.status, result: body.result, error: body.error });
        return row ? { status: 200, body: { ok: true } } : fail(404, 'not_found', 'That command is not waiting for an answer.');
      }
      if (body.action === 'close') { await bridge.close(userId, body.sessionId); return { status: 200, body: { ok: true } }; }
      return fail(400, 'bad_request', 'Unknown action');
    } catch (err) {
      if (err instanceof BridgeError) return fail(err.status, err.code, err.message);
      console.error('[mcp-bridge]', err?.message || 'error');
      return fail(500, 'server_error', 'Could not complete that request.');
    }
  };
}
