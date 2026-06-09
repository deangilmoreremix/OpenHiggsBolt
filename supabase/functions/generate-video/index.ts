import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MUAPI_BASE = "https://api.muapi.ai";
const MUAPI_KEY = Deno.env.get("MUAPI_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { prompt, model, aspect_ratio, duration, quality, tenant_id } =
      await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create video record
    const { data: video, error: insertError } = await supabase
      .from("videos")
      .insert({
        tenant_id: tenant_id ?? "default",
        name: prompt.slice(0, 60) + (prompt.length > 60 ? "..." : ""),
        prompt,
        type: "generation",
        status: "processing",
        metadata: { model, aspect_ratio, duration, quality },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Submit to Muapi
    const muapiPayload: Record<string, unknown> = { prompt };
    if (aspect_ratio) muapiPayload.aspect_ratio = aspect_ratio;
    if (duration) muapiPayload.duration = duration;
    if (quality) muapiPayload.quality = quality;

    const modelInfo = model ?? "kling-v2";
    const submitRes = await fetch(`${MUAPI_BASE}/api/v1/${modelInfo}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": MUAPI_KEY,
      },
      body: JSON.stringify(muapiPayload),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      await supabase.from("videos").update({ status: "failed" }).eq("id", video.id);
      return new Response(
        JSON.stringify({ error: `Muapi error: ${errText.slice(0, 200)}` }),
        { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const submitData = await submitRes.json();
    const requestId = submitData.request_id ?? submitData.id;

    if (!requestId) {
      // Synchronous result
      const videoUrl = submitData.outputs?.[0] ?? submitData.url ?? submitData.output?.url;
      if (videoUrl) {
        await supabase.from("videos").update({
          status: "completed",
          generated_url: videoUrl,
        }).eq("id", video.id);
      }
      return new Response(JSON.stringify({ video, result: submitData }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Poll for result (up to 5 minutes)
    let result = null;
    for (let i = 0; i < 150; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(
        `${MUAPI_BASE}/api/v1/predictions/${requestId}/result`,
        { headers: { "x-api-key": MUAPI_KEY } },
      );
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      const status = pollData.status?.toLowerCase();
      if (status === "completed" || status === "succeeded" || status === "success") {
        result = pollData;
        break;
      }
      if (status === "failed" || status === "error") {
        await supabase.from("videos").update({ status: "failed" }).eq("id", video.id);
        return new Response(JSON.stringify({ error: "Generation failed", video }), {
          status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    if (!result) {
      return new Response(JSON.stringify({ video, status: "processing", message: "Still processing" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const videoUrl = result.outputs?.[0] ?? result.url ?? result.output?.url;
    await supabase.from("videos").update({
      status: "completed",
      generated_url: videoUrl,
      thumbnail_url: videoUrl,
    }).eq("id", video.id);

    return new Response(JSON.stringify({ video: { ...video, generated_url: videoUrl, status: "completed" } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
