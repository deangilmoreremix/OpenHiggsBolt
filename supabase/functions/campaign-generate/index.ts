import { createServerClient } from "../_shared/supabase.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { MissingOpenAiKeyError, openAiFromRequest } from "../_shared/openai.ts";

const OPENAI_MODEL = "gpt-4o";

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

function stripMarkdownFences(value: string): string {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
    .trim();
}

function parseJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(stripMarkdownFences(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function responseText(response: unknown): string {
  const result = response as any;
  if (typeof result.output_text === "string") return result.output_text;
  const first = result.output?.[0];
  if (!first) return "";
  const content = Array.isArray(first.content)
    ? first.content[0]
    : first.content;
  return typeof content?.text === "string" ? content.text : "";
}

function csvToArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCors();

  try {
    const body = await readJson(req);
    const brandId = String(body.brand_id || body.brandId || "");
    const goal = String(body.goal || "");
    const direction = body.direction ? String(body.direction) : null;

    if (!brandId || !goal) {
      return jsonResponse({ error: "Missing brand_id or goal" }, 400);
    }

    const supabase = createServerClient();
    const openai = openAiFromRequest(req);

    const { data: brand, error: brandError } = await supabase.from("brand_dna")
      .select("*").eq("id", brandId).single();
    if (brandError) throw brandError;
    if (!brand) return jsonResponse({ error: "Brand not found" }, 404);

    const prompt =
      `You are a senior campaign strategist. Use every brand field below to generate exactly 4 distinct campaign concepts.

Return ONLY a valid JSON array with exactly these fields on each item:
[
  {
    "title": "string",
    "tagline": "string",
    "visualTheme": "string",
    "copyAngle": "string"
  }
]

Brand fields:
id: ${brand.id}
url: ${brand.url}
brand_name: ${brand.brand_name}
industry: ${brand.industry}
tagline: ${brand.tagline}
value_proposition: ${brand.value_proposition}
tone_of_voice: ${brand.tone_of_voice}
brand_personality: ${brand.brand_personality}
target_audience: ${brand.target_audience}
key_messages: ${brand.key_messages}
primary_colors: ${brand.primary_colors}
secondary_colors: ${brand.secondary_colors}
fonts: ${brand.fonts}
logo_url: ${brand.logo_url}
screenshot_url: ${brand.screenshot_url}
imagery_style: ${brand.imagery_style}
layout_style: ${brand.layout_style}

Campaign goal: ${goal}
Optional direction: ${direction || "none"}

Make the concepts distinct, specific to this brand, and ready for visual execution. Do not include markdown fences.`;

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 1800,
    });

    const concepts = parseJsonArray(responseText(response)).slice(0, 4);

    if (!concepts.length) {
      return jsonResponse(
        { error: "OpenAI did not return campaign concepts" },
        502,
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("brand_campaigns")
      .insert({
        brand_id: brandId,
        goal,
        direction,
        concepts,
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    return jsonResponse(campaign);
  } catch (error) {
    if (error instanceof MissingOpenAiKeyError) {
      return jsonResponse({ error: error.message }, 400);
    }
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
