import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { mirrorUrlToStorage } from "../_shared/supabase.ts";
import { MissingOpenAiKeyError, openAiFromRequest } from "../_shared/openai.ts";

const OPENAI_MODEL = "gpt-4o";
const IMAGE_MODEL = "dall-e-3";

type DalleSize = "1024x1024" | "1792x1024" | "1024x1792";

interface Platform {
  id: string;
  label: string;
  width: number;
  height: number;
  dalleSize: DalleSize;
  wordCap: number;
}

const PLATFORMS: Platform[] = [
  { id: "instagram_feed", label: "Instagram Feed", width: 1080, height: 1080, dalleSize: "1024x1024", wordCap: 125 },
  { id: "instagram_story", label: "Instagram Story", width: 1080, height: 1920, dalleSize: "1024x1792", wordCap: 80 },
  { id: "linkedin", label: "LinkedIn Post", width: 1200, height: 627, dalleSize: "1792x1024", wordCap: 150 },
  { id: "facebook_ad", label: "Facebook Ad", width: 1200, height: 628, dalleSize: "1792x1024", wordCap: 125 },
  { id: "twitter", label: "X / Twitter", width: 1600, height: 900, dalleSize: "1792x1024", wordCap: 100 },
  { id: "web_banner", label: "Web Banner", width: 1920, height: 600, dalleSize: "1792x1024", wordCap: 60 },
  { id: "email_header", label: "Email Header", width: 600, height: 200, dalleSize: "1792x1024", wordCap: 50 },
  { id: "youtube_thumb", label: "YouTube Thumbnail", width: 1280, height: 720, dalleSize: "1792x1024", wordCap: 60 },
];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function createServerClient() {
  const url = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ||
    Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
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

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(stripMarkdownFences(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
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
    const campaignId = String(body.campaign_id || body.campaignId || "");
    const platformId = String(body.platform || "");
    const conceptIndex = Number(body.concept_index ?? body.conceptIndex ?? 0);

    if (!campaignId || !platformId) {
      return jsonResponse({ error: "Missing campaign_id or platform" }, 400);
    }

    const platform = PLATFORMS.find((item) => item.id === platformId) ||
      PLATFORMS[0];
    const supabase = createServerClient();
    const openai = openAiFromRequest(req);

    const { data: campaignWithBrand, error: campaignError } = await supabase
      .from("brand_campaigns")
      .select("*, brand_dna(*)")
      .eq("id", campaignId)
      .single();

    if (campaignError) throw campaignError;
    if (!campaignWithBrand) {
      return jsonResponse({ error: "Campaign not found" }, 404);
    }

    let brand = campaignWithBrand.brand_dna;
    if (!brand) {
      const { data: fallbackBrand, error: brandError } = await supabase
        .from("brand_dna")
        .select("*")
        .eq("id", campaignWithBrand.brand_id)
        .single();
      if (brandError) throw brandError;
      brand = fallbackBrand;
    }
    if (!brand) return jsonResponse({ error: "Brand not found" }, 404);

    const concept = campaignWithBrand.concepts?.[conceptIndex] ||
      campaignWithBrand.concepts?.[0] || {};
    const colors = csvToArray(brand.primary_colors).concat(
      csvToArray(brand.secondary_colors),
    ).join(", ") || "the brand palette";
    const fonts = csvToArray(brand.fonts).join(", ") ||
      "clean brand typography";

    const copyPrompt =
      `You are a conversion-focused copywriter. Generate platform-specific ad copy for one selected campaign concept.

Return ONLY valid JSON:
{
  "headline": "string",
  "body": "string",
  "cta": "string"
}

Platform: ${platform.label}
Word cap for body: ${platform.wordCap} words
Brand: ${brand.brand_name}
Industry: ${brand.industry}
Tagline: ${brand.tagline}
Value proposition: ${brand.value_proposition}
Tone of voice: ${brand.tone_of_voice}
Brand personality: ${brand.brand_personality}
Target audience: ${brand.target_audience}
Key messages: ${brand.key_messages}
Colors: ${colors}
Fonts: ${fonts}
Imagery style: ${brand.imagery_style}
Layout style: ${brand.layout_style}
Campaign goal: ${campaignWithBrand.goal}
Direction: ${campaignWithBrand.direction || "none"}
Concept title: ${concept.title || ""}
Concept tagline: ${concept.tagline || ""}
Visual theme: ${concept.visualTheme || ""}
Copy angle: ${concept.copyAngle || ""}

Keep the body under ${platform.wordCap} words. Do not include markdown fences.`;

    const copyResponse = await openai.responses.create({
      model: OPENAI_MODEL,
      input: copyPrompt,
      max_output_tokens: 500,
    });

    const copy = parseJsonObject(responseText(copyResponse));
    const imagePrompt = `${
      concept.visualTheme || concept.copyAngle || concept.title ||
      "Brand-aligned marketing visual"
    }. Brand colors: ${colors}. Use ${fonts} inspired composition. NO text or typography.`;

    const imageResponse = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: imagePrompt,
      n: 1,
      size: platform.dalleSize,
      quality: "standard",
      response_format: "url",
    });

    const temporaryImageUrl = imageResponse.data?.[0]?.url;
    if (!temporaryImageUrl) {
      throw new Error("OpenAI did not return a DALL-E image URL");
    }

    const storedImageUrl = await mirrorUrlToStorage(
      temporaryImageUrl,
      `asset-${campaignId}-${platform.id}-${conceptIndex}-${crypto.randomUUID()}.png`,
      "brand-assets",
    );

    const { data: asset, error: assetError } = await supabase
      .from("brand_assets")
      .insert({
        campaign_id: campaignId,
        brand_id: brand.id,
        platform: platform.id,
        concept_index: Number.isInteger(conceptIndex) ? conceptIndex : 0,
        headline: String(copy.headline || ""),
        body: String(copy.body || ""),
        cta: String(copy.cta || "Learn More"),
        image_url: storedImageUrl,
        canvas_data: {
          width: platform.width,
          height: platform.height,
          platform: platform.label,
          copy: {
            headline: String(copy.headline || ""),
            body: String(copy.body || ""),
            cta: String(copy.cta || "Learn More"),
          },
        },
      })
      .select()
      .single();

    if (assetError) throw assetError;

    return jsonResponse(asset);
  } catch (error) {
    if (error instanceof MissingOpenAiKeyError) {
      return jsonResponse({ error: error.message }, 400);
    }
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
