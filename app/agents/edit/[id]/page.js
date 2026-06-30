import { cookies } from "next/headers";
import AgentEditClient from "./AgentEditClient";

const BASE_URL = 'https://api.muapi.ai';

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

async function fetchAgentDetails(id, apiKey) {
  if (!apiKey || !id) return null;
  // Try by-id (UUIDs >20 chars) via the proxy; fall back to by-slug.
  const tryFetch = async (path) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/agents/${path}`,
        { cache: "no-store", headers: { "x-api-key": apiKey } }
      );
      if (res.ok) return await res.json();
    } catch {}
    return null;
  };

  if (id.length > 20) {
    const byId = await tryFetch(id);
    if (byId) return byId;
  }
  return await tryFetch(`by-slug/${id}`);
}

export default async function EditAgentPage({ params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("muapi_key")?.value;

  const [userData, agent] = await Promise.all([
    fetchUserData(apiKey),
    fetchAgentDetails(id, apiKey),
  ]);

  return (
    <AgentEditClient userData={userData} agent={agent} />
  );
}
