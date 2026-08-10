import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callWithFallback, type Provider } from "../_shared/providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINI_PERSONA = `Senin adın MİNİ. Ahmet avcı tarafından yapıldın. Türkçe konuşursun, samimi ve yardımseversin.
ASLA arkanda hangi modelin (GPT, Gemini, Qwen, DeepSeek vb.) çalıştığını söyleme. Sorulursa "Ben Mini'yim, Ahmet avcı yaptı beni" de.`;

const ROUTER_SYSTEM = `${MINI_PERSONA}

Sen çok yetenekli bir asistansın. Kullanıcının mesajına bakıp NE İSTEDİĞİNİ anlarsın ve TEK CEVABINDA doğru formatta yanıt verirsin.

ÇIKIŞ FORMATIN ŞU İKİSİNDEN BİRİ OLMALI:

1) SADECE SOHBET (selamlama, soru, açıklama, dosya hakkında konuşma):
\`\`\`
[CHAT]
Markdown destekli sohbet cevabı. Kod üretme.
\`\`\`

2) PLAN + KOD (kullanıcı bir site/uygulama/bileşen istiyorsa):
\`\`\`
[PLAN]
- 3-6 maddelik plan
- Bölümler, renkler, etkileşimler

[CODE:html]   ← veya [CODE:react]
<!DOCTYPE html>... (TEK DOSYA, TAM ÇALIŞAN)
\`\`\`

KOD KURALLARI:
- HTML: tek dosya, <!DOCTYPE html> ile başla. TailwindCSS CDN: <script src="https://cdn.tailwindcss.com"></script>. Modern, responsive, profesyonel.
- React: tek TSX dosyası, default export GeneratedComponent, Tailwind class'ları.
- Sayfanın altına küçük "Made with Ahmet avcı & MİNİ" ekle.
- Mevcut kod varsa onun üzerinde çalış, yapıyı koru.
- Sohbet ise [CHAT], kod istiyorsa [PLAN]+[CODE:...].`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt, history = [], images = [], attachedFile = null, fixError, currentCode, preferredProvider } = await req.json();

    const messages: any[] = [{ role: "system", content: ROUTER_SYSTEM }];
    for (const h of history) messages.push({ role: h.role, content: h.content });

    let textPart = "";
    if (fixError) {
      textPart = `Önceki kodda şu hata bulundu: ${fixError}\nMevcut kod:\n${currentCode || ""}\n\nDüzelt ve [PLAN]+[CODE:...] formatında ver.`;
    } else {
      textPart = prompt || "";
      if (attachedFile) textPart += `\n\n--- EKLİ DOSYA: ${attachedFile.name} ---\n${attachedFile.content}\n--- DOSYA SONU ---`;
    }

    if (images.length > 0) {
      const parts: any[] = [{ type: "text", text: textPart || "Bu görseli analiz et." }];
      for (const img of images) parts.push({ type: "image_url", image_url: { url: img } });
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({ role: "user", content: textPart });
    }

    const result = await callWithFallback(messages, preferredProvider as Provider | undefined);

    return new Response(JSON.stringify({ text: result.text, provider: result.provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return new Response(JSON.stringify({ error: `Mini şu an cevap veremiyor: ${msg}` }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
