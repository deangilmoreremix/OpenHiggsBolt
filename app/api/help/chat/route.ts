import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ENTITLEMENTS } from '@/access/entitlements';
import { entitlementForbiddenResponse, requireApiEntitlement } from '@/access/apiRequireEntitlement';
import { rateLimit, rateLimit429 } from '../../../../lib/rateLimit';
import { getIndex, search } from '@/lib/helpSearch';
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer';
import { canAccessTraining, resolveResellerEntitlements } from '@/lib/resellerAccess';
import { HELP_SYSTEM_PROMPT, HelpLlmError, buildSourcesBlock, streamAnswer, type ChatTurn } from '@/lib/helpLlm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/help/chat — "Ask SmartVideo" help agent (streaming, grounded).
 *
 *   401 UNAUTHENTICATED · 403 PAYMENT_REQUIRED (existing SMARTVIDEO_GO gate)
 *   409 OPENAI_KEY_REQUIRED (customer has not added their OpenAI key) · 429 rate limited · 400 bad input
 *   200 text/event-stream: `sources` → `delta`* → `done`  (or `error`)
 *
 * Runs on the CUSTOMER'S OWN OpenAI key (read server-side with
 * getOpenAiKeyForUser; never returned, logged or sent to the browser).
 * The route only READS the existing access helpers; it never touches
 * entitlements. Paid reseller training (walkthrough lessons, app workshops) is only
 * retrieved for learners who pass the existing canAccessTraining gate. Retrieved text is sent to the model as delimited data.
 */

const MAX_TURNS = 6;
const MAX_CHARS = 1500;
const SECRET = /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}|\bwhsec_[A-Za-z0-9]{10,}|\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|\bghp_[A-Za-z0-9]{20,}/g;

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/** Tells the popup whether the signed-in customer has an OpenAI key saved (never the key itself). */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ available: false, hasKey: false }, { status: 401 });
  const hasKey = !!(await getOpenAiKeyForUser());
  return NextResponse.json({ available: true, hasKey }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const gate = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!gate.allowed) {
    return gate.status === 401
      ? NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
      : entitlementForbiddenResponse(gate.entitlement);
  }
  const apiKey = await getOpenAiKeyForUser();
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_KEY_REQUIRED' }, { status: 409 });

  const minute = rateLimit(`help:min:${userId}`, { windowMs: 60_000, max: 10 });
  if (!minute.allowed) return rateLimit429(minute.retryAfterMs);
  const day = rateLimit(`help:day:${userId}`, { windowMs: 86_400_000, max: 150 });
  if (!day.allowed) return rateLimit429(day.retryAfterMs);

  let body: { messages?: unknown; studioId?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const turns: ChatTurn[] = raw
    .filter((m): m is { role: string; content: string } => !!m && typeof m === 'object' && typeof (m as { content?: unknown }).content === 'string')
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as ChatTurn['role'], content: m.content.slice(0, MAX_CHARS).replace(SECRET, '[redacted secret]') }));
  while (turns.length && turns[0].role !== 'user') turns.shift();
  const last = turns[turns.length - 1];
  if (!last || last.role !== 'user' || !last.content.trim()) return NextResponse.json({ error: 'NO_QUESTION' }, { status: 400 });
  const studioId = typeof body.studioId === 'string' && body.studioId.length <= 60 ? body.studioId : null;

  // The reseller walkthrough and app workshops are paid training. The pages enforce that with
  // canAccessTraining, so the assistant must not hand the same content to anyone without it.
  // Anything unclear (lookup failed) counts as not entitled.
  let hasTraining = false;
  try {
    hasTraining = canAccessTraining(await resolveResellerEntitlements(userId));
  } catch {
    hasTraining = false;
  }

  // retrieval: last question plus the previous user turn for follow-ups
  const prevUser = [...turns].slice(0, -1).reverse().find((t) => t.role === 'user');
  const hits = search(await getIndex(), `${last.content} ${prevUser && last.content.split(/\s+/).length < 6 ? prevUser.content : ''}`, { studioId, limit: 6, excludeKinds: hasTraining ? [] : ['reseller', 'app'] });
  const sources = hits.map((h, i) => ({ id: `S${i + 1}`, title: h.chunk.title, url: h.chunk.url, kind: h.chunk.kind, ...(h.chunk.guideUrl ? { guideUrl: h.chunk.guideUrl } : {}) }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: string, d: unknown) => controller.enqueue(encoder.encode(sse(e, d)));
      send('sources', sources);
      if (!hits.length) {
        send('delta', { text: "I couldn't find anything about that in the SmartVideo GO AI studios or courses. Try rephrasing, or browse the Academy and the studio list." });
        send('done', { grounded: false });
        controller.close();
        return;
      }
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 45_000);
      try {
        const system = `${HELP_SYSTEM_PROMPT}\n\nSOURCES:\n${buildSourcesBlock(hits.map((h) => h.chunk))}`;
        for await (const text of streamAnswer({ apiKey, system, messages: turns, signal: ctl.signal })) send('delta', { text });
        send('done', { grounded: true });
      } catch (e) {
        const code = e instanceof HelpLlmError ? e.code : 'ERROR';
        const message =
          code === 'OPENAI_KEY_INVALID' ? 'Your OpenAI key was rejected. Check it in the API keys settings.'
          : code === 'OPENAI_QUOTA' ? 'Your OpenAI account is out of credit. Add billing credit at OpenAI, then try again.'
          : code === 'OPENAI_RATE' ? 'OpenAI is rate limiting your key. Please wait a moment and try again.'
          : 'The assistant is unavailable right now. Please try again in a moment.';
        send('error', { code, message });
      } finally {
        clearTimeout(timer);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' },
  });
}
