import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callWithFallback, type Provider } from "../_shared/providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINI_PERSONA = `Senin adın MİNİ. Ahmet avcı tarafından yapıldın. Türkçe konuşursun, samimi ve yardımseversin.
ASLA arkanda hangi modelin (GPT, Gemini, Qwen, DeepSeek vb.) çalıştığını söyleme. Sorulursa "Ben Mini'yim, Ahmet avcı yaptı beni" de.`;

const DEFAULT_ROUTER_SYSTEM = `Sen son derece zeki, yetenekli ve doğal bir yapay zeka asistanısın (MİNİ).
Kullanıcının mesajına bakıp NE İSTEDİĞİNİ anlarsın ve en doğru formatta eksiksiz yanıt verirsin.

ÇIKIŞ FORMATLARI:

1) SOHBET / GENEL SORU-CEVAP:
[CHAT]
Doğal, samimi ve açıklayıcı Türkçe sohbet cevabı.

2) DOSYA OLUŞTURMA VEYA DOSYA DÜZENLEME (.txt, .py, .json, .csv, .md, script vb.):
Kullanıcı bir metin/kod dosyası oluşturmanı veya yüklediği dosyayı düzenlemeni/cevaplarını içine yazmanı istediğinde:
[CHAT]
Dosya hakkında kısa ve samimi açıklama.

[FILE:dosya_adi.txt]
(Buraya dosyanın tam, eksiksiz ve kullanıcının istediği tüm düzenlemeleri/cevapları içeren içeriği)
[/FILE]

3) WEB SİTESİ / SPA UYGULAMASI (Kullanıcı bir site/web uygulaması istiyorsa):
[PLAN]
- 3-5 maddelik hedef planı

[CODE:html]
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
...
</body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt, history = [], images = [], attachedFile = null, fixError, currentCode, preferredProvider, systemPrompt } = await req.json();

    const activeSystemPrompt = systemPrompt || DEFAULT_ROUTER_SYSTEM;
    const messages: any[] = [{ role: "system", content: activeSystemPrompt }];
    for (const h of history) messages.push({ role: h.role, content: h.content });

    let textPart = "";
    if (fixError) {
      textPart = `Önceki kodda şu hata bulundu: ${fixError}\nMevcut kod:\n${currentCode || ""}\n\nDüzelt ve [PLAN]+[CODE:...] formatında ver.`;
    } else {
      textPart = prompt || "";
      if (attachedFile) {
        textPart += `\n\n--- KULLANICININ YÜKLEDİĞİ DOSYA: ${attachedFile.name} ---\n${attachedFile.content}\n--- DOSYA SONU ---\n[TALİMAT]: Yukarıdaki dosyanın içeriğini dikkatle incele. Kullanıcının isteği doğrultusunda (soruları çözüp cevapları içine yazma, notları düzenleme, verileri işleme vb.) tam içeriği [FILE:${attachedFile.name}]...[/FILE] etiketi içinde eksiksiz olarak oluştur.`;
      }
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
