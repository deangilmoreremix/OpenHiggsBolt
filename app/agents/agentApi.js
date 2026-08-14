const BASE_URL = "https://api.muapi.ai";
const AGENT_FETCH_TIMEOUT_MS = 15000;

// Wrapper that aborts the upstream request if it hangs, so a slow/unresponsive
// MuAPI endpoint degrades to a null result instead of stalling the whole
// server-rendered page.
async function fetchWithTimeout(url, options = {}, timeoutMs = AGENT_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Resolve an agent by id or slug. The live API only accepts a UUID at
// GET /agents/{id} and a slug at GET /agents/by-slug/{slug}. The studio
// navigates via agent_id (a slug for templates, an id for user agents), so we
// try both candidates. The previous implementation only tried by-slug and only
// fell back to the id route when the id looked like a UUID (length > 20), which
// left short ids (e.g. "agent_12345") unresolved and the chat empty.
export async function fetchAgentDetails(agentId, apiKey) {
  if (!apiKey) return null;

  const candidates = [
    `${BASE_URL}/agents/by-slug/${agentId}`,
    `${BASE_URL}/agents/${agentId}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(url, {
        cache: "no-store",
        headers: { "x-api-key": apiKey },
      });
      if (res.ok) {
        const json = await res.json();
        // Guard against error payloads that still return HTTP 200.
        if (json && (json.id || json.name !== undefined)) return json;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        console.error(`[agentApi] Timeout fetching agent details: ${url}`);
      } else {
        console.error(`[agentApi] Fetch error for ${url}:`, error);
      }
    }
  }

  console.warn(`[agentApi] Failed to fetch agent details for: ${agentId}`);
  return null;
}

// Resolve an existing conversation's history. Same by-slug/id dual-candidate
// strategy as fetchAgentDetails, with the same timeout protection.
export async function fetchHistory(agentId, conversationId, apiKey) {
  if (!apiKey) return null;

  const candidates = [
    `${BASE_URL}/agents/by-slug/${agentId}/${conversationId}`,
    `${BASE_URL}/agents/${agentId}/${conversationId}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(url, {
        cache: "no-store",
        headers: { "x-api-key": apiKey },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.messages || json.history || json.id)) return json;
        if (json) return json;
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(`[agentApi] Fetch error for ${url}:`, error);
      }
    }
  }

  return null;
}

export async function fetchUserData(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/account/balance`, {
      cache: "no-store",
      headers: { "x-api-key": apiKey },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
