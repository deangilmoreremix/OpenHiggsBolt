import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const tenant_id = url.searchParams.get("tenant_id") ?? "default";
    const video_id = url.searchParams.get("video_id");
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
    const offset = (page - 1) * limit;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let query = supabase
      .from("feedback")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (video_id) query = query.eq("video_id", video_id);

    const { data, count, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({
      feedback: data ?? [],
      total: count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
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
