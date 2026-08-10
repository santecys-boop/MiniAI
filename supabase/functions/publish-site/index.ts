import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function normalizeHtml(code: string) {
  let html = String(code).trim();
  html = html.replace(/^```(?:html)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  if (!/<!DOCTYPE\s+html>/i.test(html) && !/^<html[\s>]/i.test(html)) {
    html = `<!DOCTYPE html>\n<html lang="tr">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Mini Site</title><script src="https://cdn.tailwindcss.com"></script></head>\n<body>\n${html}\n</body>\n</html>`;
  }

  return html;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabase();
    const { code, siteId, appOrigin } = await req.json();
    if (!code) throw new Error("code missing");

    const id = siteId || crypto.randomUUID();
    const path = `${id}/index.html`;
    const html = normalizeHtml(code);

    const bytes = new TextEncoder().encode(html);
    const { error: upErr } = await supabase.storage
      .from("published-sites")
      .upload(path, bytes, {
        upsert: true,
        contentType: "text/html; charset=utf-8",
        cacheControl: "0",
      });
    if (upErr) throw upErr;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishedUrl = appOrigin
      ? `${appOrigin}/site/${id}`
      : `${supabaseUrl}/functions/v1/view-site/${id}?v=${Date.now()}`;

    if (siteId) {
      await supabase.from("sites").update({ published_url: publishedUrl }).eq("id", siteId);
    }

    return new Response(JSON.stringify({ url: publishedUrl, id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
