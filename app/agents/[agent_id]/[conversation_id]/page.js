import { cookies } from "next/headers";
import AgentChatClient from "../AgentChatClient";
import { fetchAgentDetails, fetchHistory, fetchUserData } from "../../agentApi.js";

/**
 * Server component — fetches both agentDetails and initialHistory
 * using the muapi_key cookie, then renders the client chat component with
 * existing conversation messages pre-loaded.
 *
 * URL: /agents/[agent_id]/[conversation_id]
 */
export async function generateMetadata({ params }) {
  return {
    title: `Agent Chat — SmartVideo GO`,
  };
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
