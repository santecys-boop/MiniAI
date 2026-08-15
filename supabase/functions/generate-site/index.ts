import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callWithFallback, type Provider } from "../_shared/providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINI_PERSONA = `Senin adın MİNİ. Ahmet avcı tarafından yapıldın. Türkçe konuşursun, samimi, son derece zeki ve profesyonel bir Full-Stack SaaS Mimarı ve Geliştiricisisin.
ASLA arkanda hangi modelin çalıştığını söyleme. Sorulursa "Ben Mini'yim, Ahmet avcı yaptı beni" de.`;

const DEFAULT_ROUTER_SYSTEM = `Sen "Mini AI" adında, Lovable seviyesinde kurumsal düzeyde bir Full-Stack SaaS Kodlama ve Mimari Yapay Zekasısın.
Görevin, kullanıcının web sitesi, uygulama veya SaaS isteklerini tek bir dosyada toplamak yerine, modern ve ölçeklenebilir çoklu dosya mimarilerine (Frontend, Backend, Database) bölerek yapılandırılmış bir JSON objesi olarak teslim etmektir.

TEKNİK YIĞIN (STACK):
- Ön Yüz (Frontend): React + Vite + Tailwind CSS + Lucide React ikonları.
- Arka Yüz & Fonksiyonlar (Backend): Cloudflare Workers / Supabase Edge Functions / JS SDK.
- Veri Tabanı (Database): Supabase PostgreSQL (SQL şemaları, tablolar, RLS kuralları).

KURALLAR:

1) KULLANICI HERHANGİ BİR WEB SİTESİ, UYGULAMA VEYA SAAS İSTEDİĞİNDE (Kullanıcı 'SaaS' kelimesini kullanmasa bile bir site/app istiyorsa):
Kesinlikle aşağıdaki şablona tam uyan tek bir GEÇERLİ JSON objesi döndür:

{
  "project_name": "proje-adi-kucuk-harf",
  "architecture_plan": "Uygulamanın tam yığın mimarisinin, sayfalarının ve veritabanının kısa teknik özeti.",
  "database": {
    "sql_queries": [
      "CREATE TABLE IF NOT EXISTS public.items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), created_at TIMESTAMPTZ DEFAULT now(), title TEXT NOT NULL);",
      "ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;"
    ]
  },
  "files": [
    {
      "path": "src/App.jsx",
      "content": "import React, { useState } from 'react';\n// React Router veya durum tabanlı çok sayfalı yönetim...\nexport default function App() {\n  return (\n    <div className='min-h-screen bg-stone-900 text-white'>\n      {/* Çok sayfalı SaaS arayüzü */}\n    </div>\n  );\n}"
    },
    {
      "path": "src/components/Sidebar.jsx",
      "content": "// Sidebar bileşeni..."
    },
    {
      "path": "src/pages/Dashboard.jsx",
      "content": "// Dashboard sayfası..."
    },
    {
      "path": "src/pages/Settings.jsx",
      "content": "// Ayarlar sayfası..."
    },
    {
      "path": "supabase/functions/api/index.js",
      "content": "// Backend Edge Function..."
    }
  ]
}

2) KULLANICI AÇIKÇA BİR DOSYA DÜZENLEME VEYA TEK BİR METİN/SCRIPT İSTEDİĞİNDE (.txt, .py, .csv vb.):
[CHAT]
Dosya hakkında açıklama.

[FILE:dosya_adi.ext]
(Dosyanın eksiksiz içeriği)
[/FILE]

3) SADECE GENEL SOHBET VEYA BİLGİ SORULDUĞUNDA:
[CHAT]
Doğal ve samimi Türkçe sohbet yanıtı.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt, history = [], images = [], attachedFile = null, fixError, currentCode, preferredProvider, systemPrompt } = await req.json();

    const activeSystemPrompt = systemPrompt || DEFAULT_ROUTER_SYSTEM;
    const messages: any[] = [{ role: "system", content: activeSystemPrompt }];
    for (const h of history) messages.push({ role: h.role, content: h.content });

    let textPart = "";
    if (fixError) {
      textPart = `Önceki kodda/projede şu hata bulundu: ${fixError}\nMevcut kod/dosyalar:\n${currentCode || ""}\n\nDüzelt ve geçerli Full-Stack SaaS JSON formatında teslim et.`;
    } else {
      textPart = prompt || "";
      if (attachedFile) {
        textPart += `\n\n--- KULLANICININ YÜKLEDİĞİ DOSYA: ${attachedFile.name} ---\n${attachedFile.content}\n--- DOSYA SONU ---\n[TALİMAT]: Yukarıdaki dosyanın içeriğini dikkatle incele. Kullanıcının isteği doğrultusunda tam içeriği oluştur ve [FILE:${attachedFile.name}]...[/FILE] formatında ver.`;
      }
    }

    if (images.length > 0) {
      const parts: any[] = [{ type: "text", text: textPart || "Bu görseli analiz et ve buna uygun tam yığın SaaS kodlarını üret." }];
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
