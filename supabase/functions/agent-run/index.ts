import { Sandbox } from "npm:e2b@1.2.5";
import { callWithFallback } from "../_shared/providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANNER_SYSTEM = `Sen otonom bir full-stack yazılım mimarısın. Kullanıcı isteğini analiz edip çalışan bir Node/React/Express veya Python uygulaması planla.
Yanıtını YALNIZCA şu JSON formatında ver:
{
  "thought": "Düşünce ve mimari analiz",
  "packages": ["express", "cors"],
  "port": 3000,
  "start_cmd": "node server.js",
  "files": [
    {
      "path": "server.js",
      "content": "..."
    }
  ]
}`;

const REFLECTOR_SYSTEM = `Sen aynı ajansın. Sunucu çalıştı, test sonucu geldi. Kullanıcıya kısa Türkçe özet yaz (2-3 cümle): ne yaptın, ne çalışıyor, sıradaki adım önerisi.`;

function sseEvent(data: unknown): string {
  return "data: " + JSON.stringify(data) + "\n\n";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const apiKey = Deno.env.get("E2B_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "E2B_API_KEY yok" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  
  let prompt = "";
  let existingFiles: Array<{ path: string; content: string }> = [];
  try {
    const body = await req.json();
    prompt = body.prompt || "";
    existingFiles = body.existingFiles || [];
  } catch {}

  if (!prompt) return new Response(JSON.stringify({ error: "prompt yok" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (e: unknown) => controller.enqueue(enc.encode(sseEvent(e)));
      let sandbox: any = null;
      let completed = false;

      try {
        send({ type: "step", title: "🧠 Otonom Ajan Başlatıldı", detail: "E2B Linux VM ve Planlama Döngüsü Açılıyor..." });
        
        sandbox = await Sandbox.create({ apiKey, timeoutMs: 300000 });
        send({ type: "log", text: "✅ Sandbox ID: " + sandbox.sandboxId });

        // Varsa önceki snapshot dosyalarını sandbox'a yaz
        if (existingFiles.length > 0) {
          send({ type: "step", title: "📁 Önceki Proje Dosyaları Yükleniyor", detail: `${existingFiles.length} dosya aktarılıyor` });
          for (const ef of existingFiles) {
            try {
              await sandbox.files.write("/home/user/app/" + ef.path, ef.content);
            } catch {}
          }
        }

        const MAX_TURNS = 6;
        let turn = 0;
        let testOk = false;
        let finalUrl = "";
        let currentPrompt = prompt;
        let lastError = "";
        const projectFilesMap = new Map<string, string>();
        existingFiles.forEach(f => projectFilesMap.set(f.path, f.content));

        while (turn < MAX_TURNS && !testOk) {
          turn++;
          send({
            type: "step",
            title: `⚡ Ajan İterasyonu ${turn}/${MAX_TURNS}`,
            detail: lastError ? "Hata tespit edildi, kendi kendini onarma (Self-Healing) devrede..." : "Kodlar üretiliyor..."
          });

          const planPrompt = lastError
            ? `Önceki kodda derleme veya çalışma hatası oluştu:\n${lastError}\n\nLütfen hatalı dosyaları düzelt ve eksiksiz çalışan JSON yapısını yeniden ver.`
            : `İstek: ${currentPrompt}\nMevcut Dosyalar: ${Array.from(projectFilesMap.keys()).join(", ") || "(Yok)"}`;

          const plan = await callWithFallback([
            { role: "system", content: PLANNER_SYSTEM },
            { role: "user", content: planPrompt },
          ], "openrouter");

          const m = plan.text.match(/\{[\s\S]*\}/);
          if (!m) throw new Error("Plan JSON ayrıştırılamadı");
          const parsed = JSON.parse(m[0]);

          if (parsed.thought) send({ type: "thought", text: parsed.thought });
          send({ type: "plan", packages: parsed.packages || [], files: (parsed.files || []).map((f: any) => f.path), start_cmd: parsed.start_cmd });

          // Dosyaları sandbox'a yaz
          for (const f of (parsed.files || [])) {
            await sandbox.files.write("/home/user/app/" + f.path, f.content);
            projectFilesMap.set(f.path, f.content);
            send({ type: "file", path: f.path, bytes: f.content.length });
            send({ type: "log", text: `📝 [YAZILDI] ${f.path}` });
          }

          // Paketleri kur
          if (parsed.packages?.length) {
            send({ type: "step", title: "📦 Bağımlılıklar Kuruluyor", detail: "npm install" });
            const pkgJson = {
              name: "mini-app",
              version: "1.0.0",
              type: "module",
              dependencies: Object.fromEntries(parsed.packages.map((p: string) => [p, "latest"]))
            };
            await sandbox.files.write("/home/user/app/package.json", JSON.stringify(pkgJson, null, 2));
            const inst = await sandbox.commands.run("cd /home/user/app && npm install --silent", { timeoutMs: 120000 });
            if (inst.stderr && inst.stderr.includes("ERR!")) {
              send({ type: "log", text: `⚠️ npm install uyarısı: ${inst.stderr.slice(0, 300)}` });
            }
          }

          const port = parsed.port || 3000;
          const startCmd = parsed.start_cmd || "node server.js";
          send({ type: "step", title: "🚀 Sunucu Başlatılıyor", detail: startCmd });

          let runtimeErrorLogs = "";
          await sandbox.commands.run(`cd /home/user/app && pkill -f node 2>/dev/null || true`, { timeoutMs: 5000 }).catch(() => {});

          sandbox.commands.run(`cd /home/user/app && PORT=${port} ${startCmd}`, {
            background: true,
            onStdout: (d: any) => send({ type: "log", text: d.toString().slice(0, 300) }),
            onStderr: (d: any) => {
              const errStr = d.toString();
              runtimeErrorLogs += errStr;
              send({ type: "log", text: `[stderr] ${errStr.slice(0, 300)}` });
            }
          }).catch(() => {});

          await new Promise((r) => setTimeout(r, 4000));
          const host = sandbox.getHost(port);
          finalUrl = "https://" + host;
          send({ type: "url", url: finalUrl });

          send({ type: "step", title: "🧪 Canlı Test Yapılıyor", detail: "GET " + finalUrl });
          let status = 0;
          let snippet = "";

          for (let i = 0; i < 6; i++) {
            try {
              const r = await fetch(finalUrl);
              status = r.status;
              snippet = (await r.text()).slice(0, 500);
              if (r.ok) {
                testOk = true;
                break;
              }
            } catch (e: any) {
              snippet = String(e?.message || e);
            }
            await new Promise((r) => setTimeout(r, 1500));
          }

          send({ type: "test", ok: testOk, status, snippet });

          if (!testOk) {
            lastError = `HTTP Durum: ${status || "Bağlanılamadı"}\nSunucu Çıktısı / Hata:\n${snippet}\n${runtimeErrorLogs}`;
            send({
              type: "error",
              message: `🚨 Test Başarısız (Durum: ${status}). Hata modele geri besleniyor...`
            });
          }
        }

        // Tüm üretilen proje dosyalarını topla ve istemciye snapshot olarak ilet
        const snapshotFiles = Array.from(projectFilesMap.entries()).map(([path, content]) => ({ path, content }));
        send({
          type: "snapshot",
          files: snapshotFiles
        });

        const reflect = await callWithFallback([
          { role: "system", content: REFLECTOR_SYSTEM },
          { role: "user", content: `İstek: ${prompt}\nURL: ${finalUrl}\nTest: ${testOk ? "BAŞARILI (OK)" : "TAMAMLANDI"}\nDosya Sayısı: ${snapshotFiles.length}` },
        ], "openrouter");

        send({ type: "reflection", text: reflect.text });
        completed = true;
        send({ type: "done", url: finalUrl, files: snapshotFiles });

      } catch (e: any) {
        send({ type: "error", message: e instanceof Error ? e.message : String(e) });
      } finally {
        // İstemcinin test edebilmesi için sandbox'ı hemen öldürme
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
});
