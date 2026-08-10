import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const DAILY_LIMIT = 100;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "missing_bearer_token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = auth.slice(7).trim();
    if (!token.startsWith("mini_")) {
      return new Response(JSON.stringify({ error: "invalid_key_format" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const keyHash = await sha256Hex(token);
    const { data: keyRow, error: keyErr } = await admin
      .from("api_keys").select("id, user_id, active, last_used_at")
      .eq("key_hash", keyHash).maybeSingle();

    if (keyErr || !keyRow) {
      return new Response(JSON.stringify({ error: "invalid_api_key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!keyRow.active) {
      return new Response(JSON.stringify({ error: "api_key_disabled" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit unless promo_unlimited
    const { data: profile } = await admin.from("profiles").select("promo_unlimited").eq("id", keyRow.user_id).maybeSingle();
    if (!profile?.promo_unlimited) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await admin.from("sites").select("id", { count: "exact", head: true }).gte("created_at", since);
      if ((count ?? 0) >= DAILY_LIMIT) {
        return new Response(JSON.stringify({ error: "rate_limit_exceeded", limit: DAILY_LIMIT, window: "24h" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt || "").toString().trim();
    const type: string = (body.type === "chat" ? "chat" : "html");
    if (!prompt || prompt.length > 4000) {
      return new Response(JSON.stringify({ error: "invalid_prompt", detail: "prompt must be 1-4000 chars" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Delegate to generate-site (existing pipeline)
    const genUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-site`;
    const genRes = await fetch(genUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ prompt }),
    });
    const genData = await genRes.json().catch(() => ({}));
    if (!genRes.ok) {
      return new Response(JSON.stringify({ error: "generation_failed", detail: genData }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract code from router output
    const raw: string = genData.content || genData.text || genData.output || "";
    let code = "";
    const m = raw.match(/\[CODE:(html|react)\]\s*([\s\S]*?)$/);
    if (m) code = m[2].trim();
    const chat = raw.replace(/\[CODE:[\s\S]*$/, "").replace(/^\[CHAT\]|^\[PLAN\]/gm, "").trim();

    // Persist site if we got code
    let siteId: string | null = null;
    let publicUrl: string | null = null;
    if (type === "html" && code) {
      const { data: site } = await admin.from("sites").insert({ prompt, code, type: "html", model: "mini-api" }).select("id").single();
      siteId = site?.id ?? null;
      if (siteId) publicUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/view-site/${siteId}`;
    }

    // Update last_used_at (best-effort)
    admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then(() => {});

    return new Response(JSON.stringify({
      ok: true,
      type,
      id: siteId,
      url: publicUrl,
      code: code || null,
      message: chat || null,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal_error", detail: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
