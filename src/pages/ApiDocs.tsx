import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Copy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mini-api`;

const curlExample = `curl -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer mini_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"kırmızı bir portfolyo sitesi","type":"html"}'`;

const jsExample = `const res = await fetch("${ENDPOINT}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mini_xxxxxxxxxxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "kırmızı bir portfolyo sitesi",
    type: "html", // "html" | "chat"
  }),
});
const data = await res.json();
console.log(data.url); // canlı site linki`;

const pyExample = `import requests

r = requests.post(
    "${ENDPOINT}",
    headers={"Authorization": "Bearer mini_xxxxxxxxxxxxxxxx"},
    json={"prompt": "kırmızı bir portfolyo sitesi", "type": "html"},
)
print(r.json())`;

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group">
      <pre className="rounded-2xl bg-slate-950 text-slate-100 p-4 pr-14 text-xs overflow-auto border border-slate-800 shadow-[0_0_40px_-10px_rgba(56,189,248,0.35)]">
        <code>{code}</code>
      </pre>
      <Button
        size="icon" variant="ghost"
        className="absolute top-2 right-2 h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
        onClick={() => { navigator.clipboard.writeText(code); toast.success("Kopyalandı"); }}
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: "radial-gradient(600px circle at 20% 10%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(500px circle at 80% 30%, rgba(168,85,247,0.25), transparent 60%)" }} />
      <header className="relative border-b border-white/10 backdrop-blur-xl bg-slate-950/60 sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h1 className="font-bold tracking-tight">Mini API — Dokümantasyon</h1>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-full bg-white/5 border-white/15 hover:bg-white/10 text-slate-100">
            <Link to="/app"><ArrowLeft className="w-4 h-4" /> Uygulamaya dön</Link>
          </Button>
        </div>
      </header>

      <main className="relative container max-w-3xl py-10 space-y-8">
        <section className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Başlangıç</h2>
          <p className="text-slate-300">Mini API ile kendi uygulamandan site üretebilir, sohbet cevabı alabilirsin. Önce bir API anahtarı oluştur.</p>
          <Button asChild className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">
            <Link to="/app"><KeyRound className="w-4 h-4" /> API anahtarı üret</Link>
          </Button>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">Endpoint</h2>
          <Card className="bg-white/5 border-white/10 p-4 font-mono text-sm text-cyan-300 rounded-2xl">
            POST {ENDPOINT}
          </Card>
          <p className="text-sm text-slate-400">
            Header: <code className="text-cyan-300">Authorization: Bearer mini_…</code><br />
            Content-Type: <code className="text-cyan-300">application/json</code>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">İstek gövdesi</h2>
          <CodeBlock code={`{
  "prompt": "istediğin sitenin/isteğin açıklaması (1-4000 karakter)",
  "type": "html"  // "html" veya "chat"
}`} />
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">Cevap</h2>
          <CodeBlock code={`{
  "ok": true,
  "type": "html",
  "id": "6f2c…",           // sitenin id'si (sadece html)
  "url": "https://…",      // canlı ön izleme linki
  "code": "<!DOCTYPE …>",   // üretilen HTML kodu
  "message": "kısa açıklama" // sohbet cevabı
}`} />
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">Örnekler</h2>
          <Tabs defaultValue="curl">
            <TabsList className="bg-white/5 border border-white/10 rounded-full">
              <TabsTrigger value="curl" className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900">cURL</TabsTrigger>
              <TabsTrigger value="js" className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900">JavaScript</TabsTrigger>
              <TabsTrigger value="py" className="rounded-full data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="mt-3"><CodeBlock code={curlExample} /></TabsContent>
            <TabsContent value="js" className="mt-3"><CodeBlock code={jsExample} /></TabsContent>
            <TabsContent value="py" className="mt-3"><CodeBlock code={pyExample} /></TabsContent>
          </Tabs>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">Hata kodları</h2>
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-left border-b border-white/10">
                <tr><th className="py-2 px-3">Kod</th><th className="py-2 px-3">Anlamı</th></tr>
              </thead>
              <tbody className="[&_td]:py-2 [&_td]:px-3 [&_tr]:border-b [&_tr]:border-white/5">
                <tr><td className="font-mono text-cyan-300">401</td><td>Anahtar yok / geçersiz / format hatalı</td></tr>
                <tr><td className="font-mono text-cyan-300">403</td><td>Anahtar pasif</td></tr>
                <tr><td className="font-mono text-cyan-300">400</td><td>prompt eksik veya 4000+ karakter</td></tr>
                <tr><td className="font-mono text-cyan-300">429</td><td>24 saatlik limit aşıldı (100 istek; promo_unlimited hesaplarında limit yok)</td></tr>
                <tr><td className="font-mono text-cyan-300">502</td><td>Üretim modeli cevap veremedi</td></tr>
                <tr><td className="font-mono text-cyan-300">500</td><td>Beklenmeyen sunucu hatası</td></tr>
              </tbody>
            </table>
          </Card>
        </section>

        <p className="text-xs text-slate-500 text-center pt-4">Mini API · Ahmet avcı & MİNİ</p>
      </main>
    </div>
  );
}
