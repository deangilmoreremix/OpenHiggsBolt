import OpenAI from "npm:openai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PHOTO_CATEGORIES } from "../../../src/types/brand.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { mirrorUrlToStorage } from "../_shared/supabase.ts";

const IMAGE_MODEL = "dall-e-3";

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
    const brandId = body.brand_id || body.brandId
      ? String(body.brand_id || body.brandId)
      : null;
    const productUrl = body.product_url || body.productUrl
      ? String(body.product_url || body.productUrl)
      : null;
    const category = String(body.category || "");
    const style = String(body.style || "");

    if (!category || !style) {
      return jsonResponse({ error: "Missing category or style" }, 400);
    }

    const supabase = createServerClient();
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") || "" });

    let brand = null;
    if (brandId) {
      const { data, error } = await supabase.from("brand_dna").select("*").eq(
        "id",
        brandId,
      ).single();
      if (error) throw error;
      brand = data;
    }

    const categoryEntry = PHOTO_CATEGORIES.find((item) =>
      item.category.toLowerCase() === category.toLowerCase()
    );
    const photoStyle = categoryEntry?.styles.find((item) =>
      item.style.toLowerCase() === style.toLowerCase()
    );
    const stylePrompt = photoStyle?.prompt ||
      "professional photorealistic product photography";

    const colors = brand
      ? csvToArray(brand.primary_colors).concat(
        csvToArray(brand.secondary_colors),
      ).join(", ")
      : "a polished commercial palette";
    const imageryStyle = brand?.imagery_style || "clean commercial photography";
    const productContext = productUrl
      ? `Create an image for the product referenced by ${productUrl}. Keep the product recognizable and commercially appealing.`
      : "Create a product-focused commercial image without relying on a specific reference photo.";
    const brandContext = brand
      ? `Brand context: brand name ${brand.brand_name}; primary colors ${colors}; imagery style ${imageryStyle}. Reflect the brand mood without adding logos, watermarks, or text.`
      : "Use a premium commercial look without logos, watermarks, or text.";

    const prompt =
      `Create a photorealistic ${category} product image in the "${style}" style. ${stylePrompt}. ${productContext} ${brandContext} High-end advertising photography, sharp focus, realistic materials, no text.`;

    const imageResponse = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "url",
    });

    const temporaryImageUrl = imageResponse.data?.[0]?.url;
    if (!temporaryImageUrl) {
      throw new Error("OpenAI did not return a DALL-E image URL");
    }

    const storedImageUrl = await mirrorUrlToStorage(
      temporaryImageUrl,
      `photoshoot-${brandId || "anonymous"}-${crypto.randomUUID()}.png`,
      "brand-photoshoots",
    );

    const { data: photoshoot, error: photoshootError } = await supabase
      .from("brand_photoshoots")
      .insert({
        brand_id: brandId,
        style,
        category,
        product_url: productUrl,
        image_url: storedImageUrl,
      })
      .select()
      .single();

    if (photoshootError) throw photoshootError;

    return jsonResponse(photoshoot);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
