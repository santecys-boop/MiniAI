import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Uses public screenshot service (no API key required) — wsrv.nl proxies an image
// We use https://image.thum.io/get/ which is free for low volume.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url } = await req.json();
    if (!url) throw new Error("url missing");
    // thum.io free endpoint: URL must be inline, NOT encoded.
    // Pre-warm thum.io so the first user fetch doesn't 404.
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noanimate/${url}`;
    try { await fetch(screenshotUrl, { method: "GET" }); } catch { /* warm only */ }
    return new Response(JSON.stringify({ screenshotUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
