import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const tenant_id = url.searchParams.get("tenant_id") ?? "default";

      const { data, error } = await supabase
        .from("brand_kit")
        .select("*")
        .eq("tenant_id", tenant_id)
        .single();

if (error && error.code !== "PGRST116") throw error;

       return new Response(JSON.stringify({ brand_kit: data ?? null }), {
         headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
       });
     } catch (err) {
       return new Response(JSON.stringify({ error: err.message }), {
         status: 500,
         headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
       });
     }
  }

  if (req.method === "POST") {
    try {
      const { tenant_id, primary_color, secondary_color, primary_text_color, secondary_text_color, cta_text, logo_url, metadata } = await req.json();

      const { data, error } = await supabase
        .from("brand_kit")
        .upsert({
          tenant_id: tenant_id ?? "default",
          primary_color,
          secondary_color,
          primary_text_color,
          secondary_text_color,
          cta_text,
          logo_url,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

if (error) throw error;

       return new Response(JSON.stringify({ brand_kit: data }), {
         headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
       });
} catch (err) {
       return new Response(JSON.stringify({ error: err.message }), {
         status: 500,
         headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
       });
     }
   }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type", "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
