import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get video to find storage files
    const { data: video } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .single();

    // Delete storage files
    if (video?.generated_url) {
      const filePath = extractStoragePath(video.generated_url);
      if (filePath) {
        await supabase.storage.from("videos").remove([filePath]);
      }
    }
    if (video?.source_video_url) {
      const filePath = extractStoragePath(video.source_video_url);
      if (filePath) {
        await supabase.storage.from("sources").remove([filePath]);
      }
    }

    // Delete DB record
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type", "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

function extractStoragePath(url: string): string | null {
  try {
    const u = new URL(url);
    // Supabase storage URL format: .../storage/v1/object/public/bucket/path
    const parts = u.pathname.split("/storage/v1/object/public/");
    if (parts.length === 2) {
      const [bucket, ...rest] = parts[1].split("/");
      return rest.join("/");
    }
    return null;
  } catch {
    return null;
  }
}
