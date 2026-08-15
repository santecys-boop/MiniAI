// Agent Mode: 3 modeli paralel çalıştır, 4. model jüri seçer en iyiyi
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callProvider, callWithFallback, type Provider } from "../_shared/providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Sen "Mini AI" adında, Lovable seviyesinde kurumsal düzeyde bir Full-Stack SaaS Kodlama ve Mimari Yapay Zekasısın.
Görevin, kullanıcının isteklerini modern ve ölçeklenebilir çoklu dosya mimarilerine (React + Vite + Tailwind + Supabase PostgreSQL SQL + Edge Functions) bölerek yapılandırılmış bir JSON objesi olarak teslim etmektir.

CEVAP JSON ŞABLONU:
{
  "project_name": "proje-adi",
  "architecture_plan": "Uygulamanın tam yığın mimarisinin kısa ve teknik özeti.",
  "database": {
    "sql_queries": [
      "CREATE TABLE IF NOT EXISTS ...",
      "ALTER TABLE ... ENABLE ROW LEVEL SECURITY;"
    ]
  },
  "files": [
    { "path": "src/App.jsx", "content": "..." },
    { "path": "src/components/Sidebar.jsx", "content": "..." },
    { "path": "src/pages/Dashboard.jsx", "content": "..." },
    { "path": "supabase/functions/api/index.js", "content": "..." }
  ]
}`;

const JURY_SYSTEM = `Sen bir teknik jürisin. Sana 3 farklı yapay zekanın aynı isteğe verdiği Full-Stack SaaS cevapları gelecek.
Hangisinin en iyi, en eksiksiz, en profesyonel mimariye, en doğru SQL şemasına ve en temiz React koduna sahip olduğunu SEÇECEKSİN.
Sadece JSON döndür: {"winner": 1|2|3, "reason": "kısa neden"}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt } = await req.json();
    if (!prompt) throw new Error("prompt missing");

    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ];

    // 3 farklı sağlayıcıyı paralel çalıştır
    const providers: Provider[] = ["sambanova", "lovable", "gemini"];
    const results = await Promise.allSettled(providers.map((p) => callProvider(p, messages)));

    const candidates = results
      .map((r, i) => (r.status === "fulfilled" ? { idx: i + 1, provider: providers[i], text: r.value.text } : null))
      .filter(Boolean) as { idx: number; provider: Provider; text: string }[];

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "Tüm modeller başarısız oldu" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let winnerIdx = 1;
    let reason = "Tek aday";
    if (candidates.length > 1) {
      const juryPrompt = candidates
        .map((c) => `--- ADAY ${c.idx} ---\n${c.text.slice(0, 4000)}`)
        .join("\n\n") + `\n\nKullanıcı isteği: ${prompt}\n\nHangisi en iyi? JSON döndür.`;
      try {
        const jury = await callWithFallback(
          [{ role: "system", content: JURY_SYSTEM }, { role: "user", content: juryPrompt }],
          "openrouter"
        );
        const m = jury.text.match(/\{[\s\S]*?\}/);
        if (m) {
          const j = JSON.parse(m[0]);
          if (j.winner && candidates.find((c) => c.idx === j.winner)) {
            winnerIdx = j.winner;
            reason = j.reason || "Jüri seçti";
          }
        }
      } catch (_) { /* jüri başarısızsa ilk adayı seç */ }
    }

    return new Response(JSON.stringify({
      candidates: candidates.map((c) => ({ idx: c.idx, text: c.text })),
      winner: winnerIdx,
      reason,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
