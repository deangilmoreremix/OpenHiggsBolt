import { corsHeadersFor, handleCors } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function jsonResponse(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeadersFor(req),
      "Content-Type": "application/json",
    },
  });
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  return text ? JSON.parse(text) : {};
}

function normalizeMuapiResult(raw: unknown): {
  requestId: string | null;
  status: string;
  url: string | null;
  error: string | null;
} {
  const body = (raw && typeof raw === "object" && "data" in raw) ? (raw as any).data : raw;
  const video = (raw && typeof raw === "object" && "video" in raw) ? (raw as any).video : (body && typeof body === "object" && "video" in body ? (body as any).video : null);
  const requestId =
    (typeof raw === "object" && raw && ("request_id" in raw || "id" in raw)
      ? (raw as any).request_id || (raw as any).id
      : null) ||
    (typeof body === "object" && body && ("request_id" in body || "id" in body)
      ? (body as any).request_id || (body as any).id
      : null);
  const status = String(
    (typeof raw === "object" && raw && "status" in raw ? (raw as any).status : "") ||
      (typeof body === "object" && body && "status" in body ? (body as any).status : "") || ""
  ).toLowerCase();
  const outputs = (typeof raw === "object" && raw && "outputs" in raw ? (raw as any).outputs : null) ||
    (typeof body === "object" && body && "outputs" in body ? (body as any).outputs : null) ||
    (video && typeof video === "object" && "url" in video ? [video.url] : null);
  const url =
    (Array.isArray(outputs) && outputs[0]) ||
    (typeof raw === "object" && raw && ("url" in raw || "video_url" in raw)
      ? (raw as any).url || (raw as any).video_url
      : null) ||
    (typeof body === "object" && body && ("url" in body || "video_url" in body)
      ? (body as any).url || (body as any).video_url
      : null) ||
    (video && typeof video === "object" && "url" in video ? video.url : null) ||
    (typeof raw === "object" && raw && "output" in raw && typeof (raw as any).output === "object" && "url" in (raw as any).output
      ? (raw as any).output.url
      : null) ||
    (typeof body === "object" && body && "output" in body && typeof (body as any).output === "object" && "url" in (body as any).output
      ? (body as any).output.url
      : null) ||
    null;
  const error = (typeof raw === "object" && raw && "error" in raw ? (raw as any).error : null) ||
    (typeof body === "object" && body && "error" in body ? (body as any).error : null) ||
    null;
  return { requestId, status, url, error };
}

async function pollForResult(
  baseUrl: string,
  requestId: string,
  key: string,
  maxAttempts = 120,
  interval = 2000
): Promise<{ url: string | null; error: string | null }> {
  const pollUrl = `${baseUrl}/api/v1/predictions/${encodeURIComponent(requestId)}/result`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval));

    try {
      const response = await fetch(pollUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status >= 500) continue;
        return { url: null, error: `Poll failed: ${response.status} - ${errText.slice(0, 100)}` };
      }

      const data = await response.json();
      const norm = normalizeMuapiResult(data);
      const status = norm.status;

      if (status === "completed" || status === "succeeded" || status === "success") {
        return { url: norm.url, error: norm.error };
      }

      if (status === "failed" || status === "error") {
        return { url: null, error: norm.error || "Generation failed" };
      }
    } catch (err) {
      if (attempt === maxAttempts) {
        return { url: null, error: err instanceof Error ? err.message : "Polling failed" };
      }
    }
  }

  return { url: null, error: "Generation timed out" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCors(req);

  try {
    const body = await readJson(req);
    const sourceImageUrl = String(body.sourceImageUrl || "");
    const prompt = String(body.prompt || "");
    const duration = body.duration ? Number(body.duration) : 5;
    const resolution = String(body.resolution || "720p");
    const muapiKey = String(body.muapiKey || "");

    if (!sourceImageUrl || !prompt) {
      return jsonResponse(req, { error: "sourceImageUrl and prompt are required" }, 400);
    }

    if (!muapiKey) {
      return jsonResponse(req, { error: "MuAPI key is required" }, 400);
    }

    const baseUrl = "https://api.muapi.ai";
    const endpoint = "seedance-2-image-to-video";
    const url = `${baseUrl}/api/v1/${endpoint}`;

    const payload: Record<string, unknown> = {
      image_url: sourceImageUrl,
      prompt,
      duration,
      resolution,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": muapiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return jsonResponse(req, { error: `MuAPI request failed: ${response.status} - ${errText.slice(0, 200)}` },
        response.status >= 500 ? 502 : 400
      );
    }

    const submitData = await response.json();
    const requestId =
      (typeof submitData === "object" && submitData && ("request_id" in submitData || "id" in submitData)
        ? (submitData as any).request_id || (submitData as any).id
        : null);

    if (!requestId) {
      // Some endpoints return the result directly
      const norm = normalizeMuapiResult(submitData);
      return jsonResponse(req, { videoUrl: norm.url, error: norm.error });
    }

    const result = await pollForResult(baseUrl, requestId, muapiKey);
    if (!result.url) {
      return jsonResponse(req, { error: result.error || "video generation failed" }, 502);
    }

    return jsonResponse(req, { videoUrl: result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse(req, { error: message }, 500);
  }
});
