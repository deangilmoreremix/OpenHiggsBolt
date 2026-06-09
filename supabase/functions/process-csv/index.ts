import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { csv_text, source_video_url, tenant_id } = await req.json();

    if (!csv_text) {
      return new Response(JSON.stringify({ error: "csv_text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Parse simple CSV (header row + data rows)
    const lines = csv_text.trim().split("\n");
    if (lines.length < 2) {
return new Response(JSON.stringify({ error: "CSV must have a header and at least one data row" }), {
         status: 400,
         headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
       });
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) =>
      line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
    );

    // Create campaign record
    const { data: campaign } = await supabase
      .from("campaigns")
      .insert({
        tenant_id: tenant_id ?? "default",
        name: `Campaign ${new Date().toISOString().slice(0, 10)}`,
        source_video_url,
        status: "processing",
        total_videos: rows.length,
      })
      .select()
      .single();

    // Create video records for each row
    const promptIdx = headers.findIndex((h) => h.toLowerCase() === "prompt");
    const nameIdx = headers.findIndex((h) => h.toLowerCase() === "name");

    const videoInserts = rows.map((row, i) => ({
      tenant_id: tenant_id ?? "default",
      name: nameIdx >= 0 && row[nameIdx] ? row[nameIdx] : `Campaign Video ${i + 1}`,
      type: "campaign",
      prompt: promptIdx >= 0 ? row[promptIdx] : "",
      source_video_url,
      status: "processing",
      metadata: { campaign_id: campaign.id, row_data: row, headers, row_index: i },
    }));

    const { data: videos } = await supabase
      .from("videos")
      .insert(videoInserts)
      .select("id");

    return new Response(JSON.stringify({
      campaign,
      video_count: videoInserts.length,
      videos: videos ?? [],
      headers,
      rows: rows.length,
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
return new Response(JSON.stringify({ error: err.message }), {
       status: 500,
       headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
     });
  }
});
