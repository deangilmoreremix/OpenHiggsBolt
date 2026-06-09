import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

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
    const { video_id, title, description, cta_text, cta_url, cta_secondary_text, cta_secondary_url, password, tenant_id } = await req.json();

    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id is required" }), {
        status: 400,
        headers: { "Content-Type", "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const slug = generateSlug();

    const { data, error } = await supabase
      .from("embed_pages")
      .insert({
        tenant_id: tenant_id ?? "default",
        video_id,
        slug,
        title,
        description,
        cta_text: cta_text ?? "Learn More",
        cta_url,
        cta_secondary_text,
        cta_secondary_url,
        password_hash: password ? btoa(password) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ embed: data }), {
      headers: { "Content-Type", "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type", "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
