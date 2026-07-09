import { cookies } from "next/headers";
import AgentChatClient from "../AgentChatClient";

/**
 * Server component — fetches both agentDetails and initialHistory
 * from the /api/agents proxy using the muapi_key cookie, then renders
 * the client chat component with existing conversation messages pre-loaded.
 *
 * URL: /agents/[agent_id]/[conversation_id]
 */
export async function generateMetadata({ params }) {
  return {
    title: `Agent Chat — SmartVideo GO`,
  };
}

const BASE_URL = 'https://api.muapi.ai';

async function fetchAgentDetails(agentId, apiKey) {
  if (!apiKey) return null;
  // Documented endpoint first (GET /agents/{agent_id}), then by-slug fallback.
  // Live API: GET /agents/{id} only accepts a UUID, while slugs must go
  // through /agents/by-slug/{slug}. The studio navigates via agent_id (a slug
  // for templates, an id for user agents), so try by-slug first and fall back
  // to the documented id route to cover both shapes.
  const candidates = [
    `${BASE_URL}/agents/by-slug/${agentId}`,
    `${BASE_URL}/agents/${agentId}`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "x-api-key": apiKey },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.id || json.name !== undefined)) return json;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function fetchHistory(agentId, conversationId, apiKey) {
  if (!apiKey) return null;
  // Try the documented id-based route first, then the by-slug route. The old
  // code gated the id fallback on length > 20, which broke short ids.
  const candidates = [
    `${BASE_URL}/agents/${agentId}/${conversationId}`,
    `${BASE_URL}/agents/by-slug/${agentId}/${conversationId}`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "x-api-key": apiKey },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.messages || json.history || json.id)) return json;
        if (json) return json;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function fetchUserData(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/account/balance`, {
      cache: "no-store",
      headers: { "x-api-key": apiKey },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AgentConversationPage({ params }) {
  const { agent_id, conversation_id } = await params;
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("muapi_key")?.value;

  console.log(`[ConvPage] Loading for agent: ${agent_id}, conv: ${conversation_id}, hasKey: ${!!apiKey}`);

  const [agentDetails, initialHistory, userData] = await Promise.all([
    fetchAgentDetails(agent_id, apiKey),
    fetchHistory(agent_id, conversation_id, apiKey),
    fetchUserData(apiKey)
  ]);

  return (
    <AgentChatClient 
      agentDetails={agentDetails} 
      initialHistory={initialHistory} 
      userData={userData}
    />
  );
}
