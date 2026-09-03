import { safeApiJson } from '@/lib/safeApiResponse';
import { NextRequest, NextResponse } from 'next/server'
import { getDesignAgentApiKey } from '../lib/auth'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'
import { requireOwnership } from '../lib/ownership'

const BASE = 'https://api.muapi.ai/api/v1/creative-agent'

function latestUserInput(messagesSnapshot: any[]) {
  const latest = [...(Array.isArray(messagesSnapshot) ? messagesSnapshot : [])]
    .reverse()
    .find((message) => message?.role === 'user' && typeof message?.content === 'string')

  if (!latest?.content) return ''

  // SmartVideo appends reference/brand/mode notes for agent context. Expert
  // skill inputs should receive the user's premise itself, matching the
  // upstream Design Agent client rather than the internal context annotations.
  return latest.content.split('\n\n[')[0].trim()
}

async function resolvePrimaryInputKey(key: string, skillName: string) {
  try {
    const res = await fetch(`${BASE}/agent-skills`, {
      headers: { 'x-api-key': key },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return 'premise'

    const skills = await safeApiJson(res)
    const skill = Array.isArray(skills)
      ? skills.find((item) => item?.name === skillName)
      : null
    return skill?.inputs?.[0] || 'premise'
  } catch {
    return 'premise'
  }
}

// POST /api/design-agent/run-skill  ->  POST /api/v1/creative-agent/sessions/{sessionId}/run-skill
// Directly invokes a named expert skill (bypasses the agent's intent detection).
// https://muapi.ai/docs/design-agent-api
export async function POST(req: NextRequest) {
  const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
  if (!entitlementCheck.allowed) {
    if (entitlementCheck.status === 401) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
  }

  try {
    const key = await getDesignAgentApiKey(req)
    const { sessionId, ...body } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    if (!body?.skill_name) return NextResponse.json({ error: 'skill_name required' }, { status: 400 })

    const ownershipResult = await requireOwnership(sessionId, 'session');
    if (ownershipResult instanceof Response) {
      return NextResponse.json({ error: ownershipResult.status === 401 ? 'UNAUTHENTICATED' : 'Forbidden' }, { status: ownershipResult.status });
    }

    const payload = { ...body }
    if (!payload.model) payload.model = 'gpt-5-mini'

    if (!payload.inputs || Object.keys(payload.inputs).length === 0) {
      const primaryInputKey = await resolvePrimaryInputKey(key, payload.skill_name)
      payload.inputs = {
        [primaryInputKey]: latestUserInput(payload.messages_snapshot),
      }
    }

    const res = await fetch(`${BASE}/sessions/${encodeURIComponent(sessionId)}/run-skill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })
    const data = await safeApiJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 500
    const message = status === 401 ? 'Unauthorized' : status === 400 ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
