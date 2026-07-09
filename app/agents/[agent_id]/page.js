import { cookies } from "next/headers";
import AgentChatClient from "./AgentChatClient";

/**
 * Server component — fetches agentDetails from the /api/agents proxy
 * (which forwards to https://api.muapi.ai/agents/by-slug/{id})
 * using the muapi_key cookie for auth, then renders the client chat component.
 *
 * URL: /agents/[agent_id]   (new chat — no conversation ID yet)
 */
export async function generateMetadata({ params }) {
  const { agent_id } = await params;
  return {
    title: `Agent Chat — SmartVideo GO`,
  };
}

const BASE_URL = 'https://api.muapi.ai';

async function fetchAgentDetails(agentId, apiKey) {
  if (!apiKey) return null;

  // Per the MuAPI docs the canonical endpoint is GET /agents/{agent_id}.
  // Try it first, then fall back to by-slug (older internal route) for agents
  // that are addressable by slug. The previous code only tried by-slug and only
  // fell back to the documented id route when the id looked like a UUID
  // (length > 20) — so short ids like "agent_12345" never resolved and the
  // agent chat rendered empty.
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
      console.log(`[AgentPage] Fetching agent details: ${url}`);
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "x-api-key": apiKey },
      });
      if (res.ok) {
        const json = await res.json();
        // Guard against error payloads that still return HTTP 200.
        if (json && (json.id || json.name !== undefined)) return json;
      }
    } catch (error) {
      console.error(`[AgentPage] Fetch error for ${url}:`, error);
    }
  }

  console.warn(`[AgentPage] Failed to fetch agent details for: ${agentId}`);
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

export default async function AgentPage({ params }) {
  const { agent_id } = await params;
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("muapi_key")?.value;

  console.log(`[AgentPage] Loading page for agent: ${agent_id}, hasKey: ${!!apiKey}`);

  const [agentDetails, userData] = await Promise.all([
    fetchAgentDetails(agent_id, apiKey),
    fetchUserData(apiKey)
  ]);

  return (
    <AgentChatClient 
      agentDetails={agentDetails} 
      initialHistory={null} 
      userData={userData}
    />
  );
}
