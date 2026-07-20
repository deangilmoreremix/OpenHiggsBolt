import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { MissingOpenAiKeyError, openAiFromRequest } from "../_shared/openai.ts";

// enhance-prompt — text helper used by the frontend (`src/shared/api/openai.ts`).
// Contract (must not change without updating the frontend):
//   POST { prompt: string, mode?: "enhance" | "script" | "campaign" }
//   Header: x-openai-key  (the caller's own OpenAI key — BYOK)
//   200  { text: string, model: string }
//   4xx/5xx { error: string }
//
// Called at: `${SUPABASE_URL}/functions/v1/enhance-prompt`
// Powers: Thumbnail Studio "Enhance Prompt", generateText/generateScript
// (shared/api/muapi.ts), and campaign copy helpers.

const OPENAI_MODEL = "gpt-4o";

type Mode = "enhance" | "script" | "campaign";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  return text ? JSON.parse(text) : {};
}

function responseText(response: unknown): string {
  const result = response as any;
  if (typeof result.output_text === "string") return result.output_text;
  const first = result.output?.[0];
  if (!first) return "";
  const content = Array.isArray(first.content) ? first.content[0] : first.content;
  return typeof content?.text === "string" ? content.text : "";
}

const SYSTEM_PROMPTS: Record<Mode, string> = {
  enhance:
    "You are an expert prompt engineer for AI image and video generation. " +
    "Rewrite the user's prompt so it is vivid, specific, and production-ready: " +
    "add concrete subject, composition, lighting, mood, style, lens, and quality " +
    "cues while faithfully preserving the user's original intent. " +
    "Return ONLY the improved prompt as plain text — no preamble, no quotes, no markdown.",
  script:
    "You are a professional short-form video scriptwriter. Turn the user's " +
    "description into a tight, engaging script with a strong hook, clear beats, " +
    "and a call to action. Keep it punchy and ready to record. " +
    "Return ONLY the script as plain text — no preamble, no markdown.",
  campaign:
    "You are a senior marketing copywriter. Turn the user's description into " +
    "compelling campaign copy: a headline, a short body, and a call to action. " +
    "Make it specific and conversion-focused. " +
    "Return ONLY the copy as plain text — no preamble, no markdown.",
};

const MAX_TOKENS: Record<Mode, number> = {
  enhance: 500,
  script: 1200,
  campaign: 800,
};

function normalizeMode(value: unknown): Mode {
  return value === "script" || value === "campaign" ? value : "enhance";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCors();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await readJson(req);
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const mode = normalizeMode(body.mode);

    if (!prompt) {
      return jsonResponse({ error: "Missing prompt" }, 400);
    }

    const openai = openAiFromRequest(req);

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPTS[mode] },
        { role: "user", content: prompt },
      ] as any,
      max_output_tokens: MAX_TOKENS[mode],
    });

    const text = responseText(response).trim();
    if (!text) {
      return jsonResponse({ error: "OpenAI returned an empty response" }, 502);
    }

    return jsonResponse({ text, model: OPENAI_MODEL });
  } catch (error) {
    if (error instanceof MissingOpenAiKeyError) {
      return jsonResponse({ error: error.message }, 400);
    }
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
