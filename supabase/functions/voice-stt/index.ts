// Sesi metne dönüştürür (Lovable AI Gateway)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const inForm = await req.formData();
    const file = inForm.get("file") as File | null;
    if (!file) throw new Error("audio file missing");

    const fd = new FormData();
    fd.append("model", "openai/gpt-4o-mini-transcribe");
    const ext = (file.type.includes("mp4") || file.type.includes("m4a")) ? "m4a"
      : file.type.includes("webm") ? "webm"
      : file.type.includes("wav") ? "wav" : "webm";
    fd.append("file", file, `voice.${ext}`);

    const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return new Response(JSON.stringify({ error: `stt_failed_${r.status}`, detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    return new Response(JSON.stringify({ text: j.text || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
