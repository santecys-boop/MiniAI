import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // path looks like /view-site/<id> ; take last segment
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id || id === "view-site") {
      return new Response("Site id missing", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Try storage first
    const { data: file } = await supabase.storage.from("published-sites").download(`${id}/index.html`);
    let html: string | null = null;
    if (file) html = await file.text();

    // Fallback: read from sites table
    if (!html) {
      const { data: row } = await supabase.from("sites").select("code").eq("id", id).maybeSingle();
      if (row?.code) html = String(row.code);
    }

    if (!html) {
      return new Response("<h1>Site bulunamadı</h1>", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Ensure full HTML doc
    if (!/<!DOCTYPE\s+html>/i.test(html) && !/^<html[\s>]/i.test(html.trim())) {
      html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Mini Site</title><script src="https://cdn.tailwindcss.com"></script></head><body>${html}</body></html>`;
    }

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : "unknown"}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
