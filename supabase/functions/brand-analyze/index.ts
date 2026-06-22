import OpenAI from "npm:openai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { mirrorUrlToStorage } from "../_shared/supabase.ts";

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

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toCsv(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(", ");
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean).join(
      ", ",
    );
  }
  return "";
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function metaContent(html: string, nameOrProperty: string): string {
  const tag = html.match(
    new RegExp(
      `<meta\\s+[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*>`,
      "i",
    ),
  )?.[0];
  return tag?.match(/content=["']([^"']*)["']/i)?.[1] || "";
}

function normalizeHex(value: string): string | null {
  const hex = value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex.toLowerCase();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function extractFonts(html: string): string[] {
  const matches = [...html.matchAll(/font-family\s*:\s*([^;}]+)/gi)];
  const fonts = matches.flatMap((match) =>
    match[1].split(",").map((font) => font.trim().replace(/^["']|["']$/g, ""))
  );
  return unique(fonts);
}

function extractBodyText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function extensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split(".").pop() || "bin";
    return extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  } catch {
    return "bin";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCors();

  try {
    const { url: websiteUrl } = await readJson(req);
    if (typeof websiteUrl !== "string" || !websiteUrl.trim()) {
      return jsonResponse({ error: "Missing website URL" }, 400);
    }

    const normalizedUrl = websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`;
    const htmlResponse = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "BrandStudioBot/1.0",
      },
    });

    if (!htmlResponse.ok) {
      throw new Error(
        `Failed to fetch ${normalizedUrl}: ${htmlResponse.status} ${htmlResponse.statusText}`,
      );
    }

    const html = await htmlResponse.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ||
      domainFromUrl(normalizedUrl);
    const description = metaContent(html, "description");
    const ogImage = metaContent(html, "og:image");
    const themeColor = metaContent(html, "theme-color");
    const colors = unique(
      [...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) =>
        normalizeHex(match[0])
      ).filter(Boolean) as string[],
    );
    const fonts = extractFonts(html);
    const bodyText = extractBodyText(html);
    const absoluteOgImage = ogImage ? new URL(ogImage, normalizedUrl).href : "";

    const supabase = createServerClient();
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") || "" });
    let screenshotUrl = "";

    if (absoluteOgImage) {
      const extension = extensionFromUrl(absoluteOgImage);
      screenshotUrl = await mirrorUrlToStorage(
        absoluteOgImage,
        `og-image-${crypto.randomUUID()}.${extension}`,
        "brand-analyze",
      );
    }

    const prompt =
      `You are a senior brand strategist. Analyze the website content and optional og:image. Return ONLY a valid JSON object with these exact keys:
{
  "brand_name": "string",
  "industry": "string",
  "tagline": "string",
  "value_proposition": "string",
  "tone_of_voice": ["string"],
  "brand_personality": ["string"],
  "target_audience": "string",
  "key_messages": ["string"],
  "primary_colors": ["#hex"],
  "secondary_colors": ["#hex"],
  "fonts": ["string"],
  "logo_url": "string or empty",
  "screenshot_url": "string or empty",
  "imagery_style": "string",
  "layout_style": "string"
}

Use the extracted website metadata, visible text, colors, fonts, and image when present. Keep arrays concise. Do not include markdown fences.

Website URL: ${normalizedUrl}
Extracted title: ${title}
Meta description: ${description}
Theme color: ${themeColor}
Hex colors found: ${colors.join(", ")}
Fonts found: ${fonts.join(", ")}
Mirrored og:image for vision: ${screenshotUrl || "none"}
HTML text excerpt: ${bodyText}`;

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content:
            "Extract structured brand DNA from the provided website evidence. Return only JSON.",
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            ...(screenshotUrl
              ? [{ type: "input_image", image_url: screenshotUrl }]
              : []),
          ],
        },
      ] as any,
      max_output_tokens: 3000,
    });

    const parsed = parseJsonObject(responseText(response));
    const fallbackColors = colors.length
      ? colors
      : themeColor
      ? [themeColor]
      : ["#111111", "#ffffff"];
    const row = {
      url: normalizedUrl,
      brand_name: String(
        parsed.brand_name || title || domainFromUrl(normalizedUrl),
      ),
      industry: String(parsed.industry || "General"),
      tagline: String(parsed.tagline || description || ""),
      value_proposition: String(parsed.value_proposition || description || ""),
      tone_of_voice: toCsv(parsed.tone_of_voice),
      brand_personality: toCsv(parsed.brand_personality),
      target_audience: String(parsed.target_audience || ""),
      key_messages: toCsv(parsed.key_messages),
      primary_colors: toCsv(
        asArray(parsed.primary_colors).length
          ? parsed.primary_colors
          : fallbackColors.slice(0, 3),
      ),
      secondary_colors: toCsv(
        asArray(parsed.secondary_colors).length
          ? parsed.secondary_colors
          : fallbackColors.slice(3, 6),
      ),
      fonts: toCsv(asArray(parsed.fonts).length ? parsed.fonts : fonts),
      logo_url: String(parsed.logo_url || ""),
      screenshot_url: String(parsed.screenshot_url || screenshotUrl || ""),
      imagery_style: String(parsed.imagery_style || ""),
      layout_style: String(parsed.layout_style || ""),
      raw_json: {
        title,
        description,
        theme_color: themeColor,
        og_image: absoluteOgImage,
        colors,
        fonts,
        body_text_excerpt: bodyText,
        ai: parsed,
      },
    };

    const { data, error } = await supabase.from("brand_dna").insert(row)
      .select().single();
    if (error) throw error;

    return jsonResponse(data);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
