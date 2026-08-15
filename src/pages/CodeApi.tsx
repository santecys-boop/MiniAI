import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Copy, BookOpen, Terminal, Sparkles, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";

const ENDPOINT = "https://radiant-liger-e14789.netlify.app/api/generate";

const curlExample = `curl -X POST "${ENDPOINT}" \\
  -H "Authorization: Bearer mini_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Modern portfolyo web sitesi","type":"html"}'`;

const jsExample = `// JavaScript / TypeScript (Node.js & Fetch)
const response = await fetch("${ENDPOINT}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.MINI_AI_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "Koyu temalı interaktif hesap makinesi",
    type: "html", // "html" veya "chat"
  }),
});

const data = await response.json();
console.log("Canlı Site URL:", data.url);
console.log("HTML Kodu:", data.code);`;

const pyExample = `# Python 3
import requests
import os

api_key = os.getenv("MINI_AI_API_KEY", "mini_xxxxxxxxxxxxxxxx")

response = requests.post(
    "${ENDPOINT}",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Responsive e-ticaret açılış sayfası",
        "type": "html"
    }
)

result = response.json()
print("Yayınlanan Site:", result.get("url"))`;

const reactExample = `// React / Next.js Entegrasyonu
import { useState } from "react";

export function MiniAIChat() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");

  const handleAsk = async () => {
    const res = await fetch("${ENDPOINT}", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.NEXT_PUBLIC_MINI_AI_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, type: "chat" })
    });
    const json = await res.json();
    setOutput(json.text);
  };

  return (
    <div>
      <input value={prompt} onChange={e => setPrompt(e.target.value)} />
      <button onClick={handleAsk}>Mini AI'ye Sor</button>
      <p>{output}</p>
    </div>
  );
}`;

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
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">v2.0</span>
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
            Mini AI API ile kendi Python, Node.js veya React uygulamalarınızdan otonom web siteleri üretebilir, yapay zeka kodlama ve sohbet yanıtları alabilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-stone-200">1. API Anahtarınızı Tanımlayın</h3>
          <p className="text-xs text-stone-400">
            Anahtarınızı Mini AI sol menüsünden <b>"API Anahtarları"</b> sekmesinden ücretsiz oluşturabilirsiniz.
          </p>
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 font-mono text-xs text-stone-300">
            Authorization: Bearer <span className="text-amber-400">mini_xxxxxxxxxxxxxxxxxxxxxxxx</span>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-stone-200">2. Entegrasyon Kod Örnekleri</h3>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="bg-stone-900 border border-stone-800 rounded-xl p-1">
              <TabsTrigger value="curl" className="rounded-lg text-xs">cURL</TabsTrigger>
              <TabsTrigger value="js" className="rounded-lg text-xs">JavaScript</TabsTrigger>
              <TabsTrigger value="py" className="rounded-lg text-xs">Python</TabsTrigger>
              <TabsTrigger value="react" className="rounded-lg text-xs">React</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="mt-3">
              <CodeBox code={curlExample} lang="BASH / CURL" />
            </TabsContent>
            <TabsContent value="js" className="mt-3">
              <CodeBox code={jsExample} lang="JAVASCRIPT / NODE.JS" />
            </TabsContent>
            <TabsContent value="py" className="mt-3">
              <CodeBox code={pyExample} lang="PYTHON 3" />
            </TabsContent>
            <TabsContent value="react" className="mt-3">
              <CodeBox code={reactExample} lang="REACT / NEXT.JS" />
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-4 pt-4 border-t border-stone-800">
          <h3 className="text-lg font-bold text-stone-200">3. Yanıt Formatı (JSON)</h3>
          <CodeBox
            lang="JSON RESPONSE"
            code={`{
  "ok": true,
  "type": "html",
  "id": "site_7f28a9b1",
  "url": "https://ff5a3d3ff28e65ee5c421618acf220f4.r2.cloudflarestorage.com/mini-ai-sites/sites/site_7f28a9b1/index.html",
  "code": "<!DOCTYPE html><html>...</html>",
  "chat": "Web siteniz Cloudflare R2 üzerinde başarıyla oluşturuldu."
}`}
          />
        </section>
      </main>
    </div>
  );
}
