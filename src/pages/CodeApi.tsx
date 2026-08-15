import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Copy, BookOpen, Terminal, Sparkles, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";

const ENDPOINT = "https://dhryhmkhdelwuzowyjbo.supabase.co/functions/v1/generate-site";

// --- 🌐 WEB SİTESİ & KOD ÜRETİM API'Sİ ---
const siteCurlExample = `curl -X POST "${ENDPOINT}" \\
  -H "Authorization: Bearer mini_site_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Modern koyu temalı portfolyo web sitesi","type":"html"}'`;

const siteJsExample = `// JavaScript / TypeScript (Node.js & Fetch - Web Sitesi Üretimi)
const response = await fetch("${ENDPOINT}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.MINI_AI_SITE_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "Modern portfolyo web sitesi",
    type: "html", // HTML & Bağımsız SPA kodu üretir
  }),
});

const data = await response.json();
console.log("Canlı Site URL:", data.url);
console.log("HTML Kodu:", data.code);`;

const sitePyExample = `# Python 3 (Web Sitesi & Kod Üretimi)
import requests
import os

api_key = os.getenv("MINI_AI_SITE_KEY", "mini_site_xxxxxxxxxxxxxxxx")

response = requests.post(
    "${ENDPOINT}",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Modern koyu temalı portfolyo web sitesi",
        "type": "html"
    }
)

result = response.json()
print("Yayınlanan Site:", result.get("url"))
print("Oluşturulan HTML:", result.get("code")[:100], "...")`;

// --- 💬 SOHBET / CHAT & DOSYA API'Sİ ---
const chatCurlExample = `curl -X POST "${ENDPOINT}" \\
  -H "Authorization: Bearer mini_chat_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Python ile veri analizi ve dosya işlemleri nasıl yapılır? Örnek kod ver.","type":"chat"}'`;

const chatJsExample = `// JavaScript / TypeScript (Node.js & Fetch - Sohbet & Dosya API)
const response = await fetch("${ENDPOINT}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.MINI_AI_CHAT_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "Merhaba! Yapay zekanın geleceğini 3 maddede özetler misin?",
    type: "chat", // Doğal diyalog, soru-cevap ve dosya üretimi
  }),
});

const data = await response.json();
console.log("Mini AI Yanıtı:", data.text || data.message);`;

const chatPyExample = `# Python 3 (Sohbet / Chat & Dosya Analizi)
import requests
import os

api_key = os.getenv("MINI_AI_CHAT_KEY", "mini_chat_xxxxxxxxxxxxxxxx")

response = requests.post(
    "${ENDPOINT}",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Python ile veri analizi ve dosya işlemleri nasıl yapılır? Örnek kod ver.",
        "type": "chat"
    }
)

result = response.json()
print("Mini AI Yanıtı:\\n", result.get("text") or result.get("message"))`;

function CodeBox({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-800 text-stone-400 text-xs font-mono">
        <span>{lang}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success("Kod panoya kopyalandı");
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </Button>
      </div>
      <pre className="p-4 text-xs font-mono text-stone-200 overflow-auto leading-relaxed max-h-96">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CodeApi() {
  const [apiType, setApiType] = useState<"site" | "chat">("site");

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500/30">
      <header className="sticky top-0 z-20 border-b border-stone-800 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                Mini AI API & Code Docs
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">v2.5</span>
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-200">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" /> Mini AI'ye Dön</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Resmi Geliştirici Dokümantasyonu
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Kendi Projelerinize Mini AI Ekleyin
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed max-w-2xl">
            Mini AI API ile kendi Python, Node.js veya React uygulamalarınızdan hem <b>otonom web siteleri / kodlar</b> üretebilir, hem de <b>ChatGPT kalitesinde sohbet ve dosya analizi</b> yapabilirsiniz.
          </p>
        </section>

        {/* API Türü Seçimi */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-stone-200">1. Kullanmak İstediğiniz API Türünü Seçin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setApiType("site")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${apiType === "site" ? "border-amber-500/80 bg-amber-500/10 ring-2 ring-amber-500/20" : "border-stone-800 bg-stone-900/60 hover:border-stone-700"}`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <Globe className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-stone-100">🌐 Web Sitesi / Kod Üretim API</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                İstemlerden (prompt) otomatik HTML5/SPA kodları ve canlı Cloudflare R2 web sitesi bağlantıları üretir.
              </p>
              <div className="mt-2.5 font-mono text-[10px] text-amber-300">
                Key Prefix: <span className="bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/40">mini_site_...</span>
              </div>
            </div>

            <div
              onClick={() => setApiType("chat")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${apiType === "chat" ? "border-emerald-500/80 bg-emerald-500/10 ring-2 ring-emerald-500/20" : "border-stone-800 bg-stone-900/60 hover:border-stone-700"}`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-stone-100">💬 Sohbet (Chat) & Dosya API</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Doğal soru-cevap, metin/kod analizi, özetleme ve dosya (.txt/script) oluşturma yanıtları döndürür.
              </p>
              <div className="mt-2.5 font-mono text-[10px] text-emerald-300">
                Key Prefix: <span className="bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">mini_chat_...</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-stone-200">2. Entegrasyon Kod Örnekleri ({apiType === "site" ? "Web Sitesi API" : "Sohbet API"})</h3>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="bg-stone-900 border border-stone-800 rounded-xl p-1">
              <TabsTrigger value="curl" className="rounded-lg text-xs">cURL</TabsTrigger>
              <TabsTrigger value="js" className="rounded-lg text-xs">JavaScript</TabsTrigger>
              <TabsTrigger value="py" className="rounded-lg text-xs">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="mt-3">
              <CodeBox code={apiType === "site" ? siteCurlExample : chatCurlExample} lang="BASH / CURL" />
            </TabsContent>
            <TabsContent value="js" className="mt-3">
              <CodeBox code={apiType === "site" ? siteJsExample : chatJsExample} lang="JAVASCRIPT / NODE.JS" />
            </TabsContent>
            <TabsContent value="py" className="mt-3">
              <CodeBox code={apiType === "site" ? sitePyExample : chatPyExample} lang="PYTHON 3" />
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-4 pt-4 border-t border-stone-800">
          <h3 className="text-lg font-bold text-stone-200">3. Yanıt Formatı ({apiType === "site" ? "Site JSON" : "Chat JSON"})</h3>
          <CodeBox
            lang="JSON RESPONSE"
            code={apiType === "site" ? `{
  "ok": true,
  "type": "html",
  "id": "site_7f28a9b1",
  "url": "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/sites/site_7f28a9b1/index.html",
  "code": "<!DOCTYPE html><html>...</html>",
  "message": "Web siteniz Cloudflare R2 üzerinde başarıyla oluşturuldu."
}` : `{
  "ok": true,
  "type": "chat",
  "text": "Python ile dosya okuma ve veri analizi yapmak için built-in open() veya pandas kütüphanesini kullanabilirsiniz...",
  "message": "Cevabınız hazırlandı."
}`}
          />
        </section>
      </main>
    </div>
  );
}
