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
    const days = parseInt(url.searchParams.get("days") ?? "30");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const since = new Date(Date.now() - days * 86400000).toISOString();

    // Total plays
    let playsQuery = supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .eq("event_type", "play")
      .gte("created_at", since);
    if (video_id) playsQuery = playsQuery.eq("video_id", video_id);
    const { count: total_plays } = await playsQuery;

    // Total views
    let viewsQuery = supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .eq("event_type", "view")
      .gte("created_at", since);
    if (video_id) viewsQuery = viewsQuery.eq("video_id", video_id);
    const { count: total_views } = await viewsQuery;

    // Form submissions
    let formsQuery = supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .gte("created_at", since);
    if (video_id) formsQuery = formsQuery.eq("video_id", video_id);
    const { count: total_forms } = await formsQuery;

    // Survey submissions
    let surveysQuery = supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .gte("created_at", since);
    if (video_id) surveysQuery = surveysQuery.eq("video_id", video_id);
    const { count: total_surveys } = await surveysQuery;

    // Top videos by plays
    const { data: topVideos } = await supabase
      .from("analytics_events")
      .select("video_id, videos(name)")
      .eq("tenant_id", tenant_id)
      .eq("event_type", "play")
      .gte("created_at", since)
      .not("video_id", "is", null);

    const topVideosMap: Record<string, { name: string; count: number }> = {};
    (topVideos ?? []).forEach((row: any) => {
      const vid = row.video_id;
      if (!topVideosMap[vid]) topVideosMap[vid] = { name: row.videos?.name ?? "Unknown", count: 0 };
      topVideosMap[vid].count++;
    });

    const top_videos = Object.entries(topVideosMap)
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily breakdown
    const { data: dailyData } = await supabase
      .from("analytics_events")
      .select("event_type, created_at")
      .eq("tenant_id", tenant_id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    const daily: Record<string, { plays: number; views: number; clicks: number }> = {};
    (dailyData ?? []).forEach((row: any) => {
      const day = row.created_at.slice(0, 10);
      if (!daily[day]) daily[day] = { plays: 0, views: 0, clicks: 0 };
      if (row.event_type === "play") daily[day].plays++;
      else if (row.event_type === "view") daily[day].views++;
      else if (row.event_type === "click" || row.event_type === "cta_click") daily[day].clicks++;
    });

    return new Response(JSON.stringify({
      total_plays: total_plays ?? 0,
      total_views: total_views ?? 0,
      total_forms: total_forms ?? 0,
      total_surveys: total_surveys ?? 0,
      top_videos,
      daily: Object.entries(daily).map(([date, stats]) => ({ date, ...stats })),
      days,
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type", "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
